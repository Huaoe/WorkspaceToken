"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { StatusField } from "./components/StatusField";
import { PropertyDetailsFields } from "./components/PropertyDetailsFields";
import { LocationField } from "./components/LocationField";
import { ClientOnly } from "./components/ClientOnly";
import {
  useAccount,
  usePublicClient,
  useWalletClient,
  useSwitchChain,
  useReadContract,
} from "wagmi";
import propertyFactoryJSON from "@contracts/abis/PropertyFactory.json";
import { type Abi } from "viem";
import { parseUnits } from "viem";
import { decodeEventLog } from "viem";
import { StakingInitButton } from "./components/StakingInitButton";

import { propertyFormSchema } from "./components/PropertyDetailsFields";

const formSchema = propertyFormSchema.extend({
  location: z.string().min(2).max(256, {
    message: "Location must be between 2 and 256 characters.",
  }),
  token_address: z.string().optional(),
});

function CreateTokenButton({
  id,
  status,
  formData,
}: {
  id: string;
  status: string;
  formData: any;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const { address, isConnected } = useAccount();
  const contractAddress = process.env
    .NEXT_PUBLIC_PROPERTY_FACTORY_PROXY_ADDRESS as `0x${string}`;
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const router = useRouter();
  const propertyFactoryABI = propertyFactoryJSON.abi as Abi;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (walletClient) {
      console.log("Wallet client ready:", walletClient);
    }
  }, [walletClient]);

  const { data: factoryOwner } = useReadContract({
    address: contractAddress,
    abi: propertyFactoryABI,
    functionName: "owner",
  });

  const isOwner =
    address &&
    factoryOwner &&
    factoryOwner.toLowerCase() === address.toLowerCase();

  if (!mounted || !isConnected) {
    return null;
  }

  const convertPriceToTokens = (price: string | number): bigint => {
    let numericPrice: number;
    if (typeof price === "string") {
      numericPrice = parseFloat(price.replace(/,/g, ""));
    } else {
      numericPrice = price;
    }

    if (isNaN(numericPrice) || numericPrice <= 0) {
      throw new Error("Invalid price value");
    }

    return parseUnits(numericPrice.toString(), 6);
  };

  const handleCreateToken = async () => {
    if (!walletClient || !formData || !isConnected) {
      toast({
        title: "Error",
        description:
          "Please connect your wallet and ensure form data is complete",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Save changes to database first
      const { error: saveError } = await supabase
        .from("property_requests")
        .update({
          title: formData.title,
          description: formData.description,
          location: formData.location,
          expected_price: formData.expected_price,
          number_of_tokens: formData.number_of_tokens,
          token_name: formData.token_name,
          token_symbol: formData.token_symbol,
          image_url: formData.image_url,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (saveError) {
        throw new Error(`Failed to save changes: ${saveError.message}`);
      }

      // Get the current nonce
      const nonce = await publicClient.getTransactionCount({
        address: address!,
      });

      console.log("Current nonce:", nonce);

      // Validate input lengths
      if (formData.title.length > 32) {
        throw new Error("Title must be less than 32 characters");
      }
      if (formData.description.length > 256) {
        throw new Error("Description must be less than 256 characters");
      }

      // Truncate location if needed
      const location =
        formData.location.length > 64
          ? formData.location.substring(0, 64)
          : formData.location;

      // Ensure image URL is valid and not too long
      const imageUrl =
        formData.image_url && formData.image_url.length > 128
          ? formData.image_url.substring(0, 128)
          : formData.image_url || "";

      // Convert and validate price
      const priceValue = convertPriceToTokens(formData.expected_price);

      // Convert number of tokens to total supply with 18 decimals
      const totalSupply =
        BigInt(Number(formData.number_of_tokens)) * BigInt(10 ** 18);

      console.log("Starting token creation with:", {
        contractAddress,
        title: formData.title,
        description: formData.description,
        location,
        imageUrl,
        price: priceValue.toString(),
        totalSupply: totalSupply.toString(),
        tokenName: formData.token_name,
        tokenSymbol: formData.token_symbol,
        walletAddress: address,
        nonce,
      });

      // First simulate the transaction
      const { request } = await publicClient.simulateContract({
        address: contractAddress,
        abi: propertyFactoryABI,
        functionName: "createProperty",
        args: [
          formData.title,
          formData.description,
          location,
          imageUrl,
          priceValue,
          totalSupply,
          formData.token_name,
          formData.token_symbol,
        ],
        account: address,
      });

      console.log("Simulation successful, executing transaction...");

      // Execute the transaction with explicit nonce
      const hash = await walletClient.writeContract({
        ...request,
        address: contractAddress,
        nonce,
      });

      console.log("Transaction submitted:", hash);

      toast({
        title: "Transaction Sent",
        description: "Creating property token...",
      });

      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        timeout: 60_000,
      });

      console.log("Transaction receipt:", receipt);
      console.log("Transaction logs:", receipt.logs);

      if (receipt.status === "success") {
        // Get the property token address from the event logs
        console.log("Looking for PropertySubmitted event in logs...");

        const propertySubmittedEvent = receipt.logs.find((log) => {
          try {
            console.log("Trying to decode log:", log);
            const event = decodeEventLog({
              abi: propertyFactoryABI,
              data: log.data,
              topics: log.topics,
            });
            console.log("Decoded event:", event);
            return event.eventName === "PropertySubmitted";
          } catch (error) {
            console.log("Failed to decode log:", error);
            return false;
          }
        });

        console.log("Found event:", propertySubmittedEvent);

        if (!propertySubmittedEvent) {
          throw new Error("Property token address not found in event logs");
        }

        console.log("Decoding event data...");
        const decodedEvent = decodeEventLog({
          abi: propertyFactoryABI,
          data: propertySubmittedEvent.data,
          topics: propertySubmittedEvent.topics,
        });
        console.log("Decoded event:", decodedEvent);

        const propertyTokenAddress = decodedEvent.args
          .tokenAddress as `0x${string}`;
        console.log("Property token address:", propertyTokenAddress);

        await supabase
          .from("property_requests")
          .update({
            status: "onchain",
            token_address: propertyTokenAddress,
          })
          .eq("id", id);

        console.log("Updated Supabase with token address");
        toast({
          title: "Success!",
          description: "Property token created successfully",
        });

        router.push("/admin/requests");
      } else {
        throw new Error("Transaction failed");
      }
    } catch (error) {
      console.error("Contract interaction error:", error);
      let errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to create property token";

      // Handle specific error cases
      if (errorMessage.includes("execution reverted")) {
        errorMessage =
          "Transaction reverted. Please check the property details and try again.";
      } else if (errorMessage.includes("nonce too high")) {
        errorMessage =
          "Network state error. Please refresh the page and try again.";
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveProperty = async () => {
    if (!walletClient || !isConnected) {
      toast({
        title: "Error",
        description: "Please connect your wallet",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Get the property token address from Supabase
      console.log("Fetching property data from Supabase...");
      const { data: propertyData, error: propertyError } = await supabase
        .from("property_requests")
        .select("token_address")
        .eq("id", id)
        .single();

      console.log("Property data from Supabase:", propertyData);
      console.log("Property error from Supabase:", propertyError);

      if (propertyError) {
        console.error("Supabase error:", propertyError);
        throw new Error(
          "Failed to fetch property data: " + propertyError.message
        );
      }

      if (!propertyData?.token_address) {
        console.error("Property data:", propertyData);
        throw new Error("Property token address not found Wrong data");
      }

      // Get the current nonce
      const nonce = await publicClient.getTransactionCount({
        address: address!,
      });

      console.log("Current nonce:", nonce);
      console.log("Using token address:", propertyData.token_address);

      // First simulate the transaction
      const { request } = await publicClient.simulateContract({
        address: contractAddress,
        abi: propertyFactoryABI,
        functionName: "approveProperty",
        args: [propertyData.token_address as `0x${string}`],
        account: address,
      });

      console.log("Simulation successful, executing transaction...");

      // Execute the transaction with explicit nonce
      const hash = await walletClient.writeContract({
        ...request,
        address: contractAddress,
        nonce,
      });

      console.log("Transaction submitted:", hash);

      toast({
        title: "Transaction Sent",
        description: "Approving property...",
      });

      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        timeout: 60_000,
      });

      console.log("Transaction receipt:", receipt);

      if (receipt.status === "success") {
        await supabase
          .from("property_requests")
          .update({ status: "funding" })
          .eq("id", id);

        toast({
          title: "Success!",
          description: "Property approved successfully",
        });

        router.push("/admin/requests");
      } else {
        throw new Error("Transaction failed");
      }
    } catch (error) {
      console.error("Contract interaction error:", error);
      let errorMessage =
        error instanceof Error ? error.message : "Failed to approve property";

      // Handle specific error cases
      if (errorMessage.includes("execution reverted")) {
        errorMessage =
          "Transaction reverted. Please check the property details and try again.";
      } else if (errorMessage.includes("nonce too high")) {
        errorMessage =
          "Network state error. Please refresh the page and try again.";
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if ((status !== "approved" && status !== "onchain") || !isOwner) {
    return null;
  }

  return (
    <div className="space-y-4">
      {status === "approved" && (
        <Button
          onClick={handleCreateToken}
          disabled={loading}
          className="bg-primary"
        >
          {loading ? "Creating Token..." : "Create Token"}
        </Button>
      )}

      {status === "onchain" && (
        <Button
          onClick={handleApproveProperty}
          disabled={loading}
          className="bg-primary"
        >
          {loading ? "Approving Property..." : "Go Funding Property"}
        </Button>
      )}
    </div>
  );
}

export default function ReviewRequest() {
  const { id } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<any>(null);
  const [mapLocation, setMapLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const locationPickerRef = useRef<{
    updateMapLocation: (lat: number, lng: number) => void;
  }>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      expected_price: "",
      number_of_tokens: 0,
      token_name: "",
      token_symbol: "",
      image_url: "",
      status: "pending",
      token_address: "",
    },
  });

  const status = form.watch("status");

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const { data, error } = await supabase
          .from("property_requests")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;

        if (data) {
          setRequest(data);
          form.reset({
            title: data.title || "",
            description: data.description || "",
            location: data.location || "",
            expected_price: data.expected_price?.toString() || "",
            number_of_tokens: data.number_of_tokens || 0,
            token_name: data.token_name || "",
            token_symbol: data.token_symbol || "",
            image_url: data.image_url || "",
            status: data.status || "pending",
            token_address: data.token_address || "",
          });

          // Geocode the location and update the map
          if (data.location) {
            try {
              const result = await geocodeAddress(data.location);
              if (result) {
                setMapLocation({ lat: result.lat, lng: result.lng });
                // Update the map location using the ref
                locationPickerRef.current?.updateMapLocation(
                  result.lat,
                  result.lng
                );
              }
            } catch (error) {
              console.error("Failed to geocode location:", error);
            }
          }
        }
      } catch (error) {
        console.error("Error:", error);
        toast({
          title: "Error",
          description: "Failed to load property request",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchRequest();
    }
  }, [id]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const now = new Date().toISOString();
      const updates = {
        title: values.title,
        description: values.description,
        location: values.location,
        expected_price: Number(values.expected_price),
        image_url: values.image_url || null,
        documents_url: values.documents_url || null,
        number_of_tokens: Number(values.number_of_tokens),
        status: values.status,
        token_name: values.token_name,
        token_symbol: values.token_symbol,
        token_address: values.token_address,
      };

      if (values.status === "approved") {
        updates["approved_at"] = now;
      } else if (values.status === "rejected") {
        updates["rejected_at"] = now;
      } else if (values.status === "onchain") {
        updates["tokenized_at"] = now;
      } else if (values.status === "funding") {
        updates["funding_at"] = now;
      }

      const { error } = await supabase
        .from("property_requests")
        .update(updates)
        .match({ id });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Property request updated successfully",
      });

      router.refresh();
    } catch (error) {
      console.error("Error saving request:", error);
      toast({
        title: "Error",
        description: "Failed to save property request",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="pt-6">
            <p>Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Review Property Request</CardTitle>
          <CardDescription>
            Review and update property request details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <StatusField form={form} />
              <PropertyDetailsFields form={form} />
              <LocationField form={form} />

              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={() => router.push("/admin/requests")}
                >
                  Back
                </Button>
                <div className="flex gap-4">
                  <Button type="submit">Save Changes</Button>
                  <ClientOnly>
                    {() => (
                      <CreateTokenButton
                        id={id}
                        status={form.watch("status")}
                        formData={form.getValues()}
                      />
                    )}
                  </ClientOnly>
                  {form.watch("status") === "funding" && (
                    <StakingInitButton
                      propertyTokenAddress={
                        form.getValues().token_address || ""
                      }
                      status={form.watch("status")}
                    />
                  )}
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
