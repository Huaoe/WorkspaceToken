'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ReloadIcon } from "@radix-ui/react-icons";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { propertyFormSchema } from "./components/PropertyDetailsFields";
import { PropertyDetailsFields } from "./components/PropertyDetailsFields";
import { useWalletEvents } from "@/app/wallet-events-provider";
import { LocationField } from "./components/LocationField";
import { StatusField } from "./components/StatusField";
import { CreateTokenButton } from "./components/CreateTokenButton";
import { ApproveTokenButton } from "./components/ApproveTokenButton"; 
import { StakingInitButton } from "./components/StakingInitButton";
import { ClientOnly } from "./components/ClientOnly";
import { PropertyStatus } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { formatUnits } from "viem";

type FormValues = z.infer<typeof propertyFormSchema> & {
  location: string;
  token_address?: string;
  roi: number;
  payout_duration: number;
  image_url: string;
  documents_url: string;
  staking_contract_address?: string;
  staking_reward_rate?: string;
  staking_duration?: string;
  staking_is_active?: boolean;
};

export default function ReviewRequest({
  params,
}: {
  params: { id: string };
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { id } = params;
  const router = useRouter();
  const { isConnected } = useWalletEvents();

  const form = useForm<FormValues>({
    resolver: zodResolver(propertyFormSchema.extend({
      location: z.string().min(2).max(256, {
        message: "Location must be between 2 and 256 characters.",
      }),
      token_address: z.string().optional(),
      roi: z.coerce.number().min(0, "ROI must be greater than 0"),
      payout_duration: z.coerce.number().min(0, "Duration must be greater than 0"),
      image_url: z.string(),
      documents_url: z.string(),
      staking_contract_address: z.string().optional(),
      staking_reward_rate: z.string().optional(),
      staking_duration: z.string().optional(),
      staking_is_active: z.boolean().optional(),
    })),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      expected_price: "0",
      number_of_tokens: "0",
      token_name: "",
      token_symbol: "",
      token_address: "",
      roi: 0,
      payout_duration: 0,
      status: "pending" as PropertyStatus,
      image_url: "",
      documents_url: "",
      staking_contract_address: "",
      staking_reward_rate: "",
      staking_duration: "",
      staking_is_active: false,
    },
  });

  useEffect(() => {
    async function fetchRequest() {
      try {
        setLoading(true);
        setError(null);

        const { data: request, error } = await supabase
          .from("property_requests")
          .select("*")
          .eq("id", id)
          .single();

        if (error) {
          throw new Error(error.message);
        }

        if (!request) {
          throw new Error("Property request not found");
        }

        form.reset({
          title: request.title || "",
          description: request.description || "",
          location: request.location || "",
          expected_price: request.expected_price?.toString() || "0",
          number_of_tokens: request.number_of_tokens?.toString() || "0",
          token_name: request.token_name || "",
          token_symbol: request.token_symbol || "",
          token_address: request.token_address || "",
          roi: request.roi || 0,
          payout_duration: request.payout_duration || 0,
          status: (request.status as PropertyStatus) || "pending",
          image_url: request.image_url || "",
          documents_url: request.documents_url || "",
          staking_contract_address: request.staking_contract_address || "",
          staking_reward_rate: request.staking_reward_rate || "",
          staking_duration: request.staking_duration || "",
          staking_is_active: request.staking_is_active || false,
        });
      } catch (err: any) {
        console.error("Error fetching request:", err);
        setError(err.message);
        toast({
          title: "Error",
          description: err.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchRequest();
    }
  }, [id, form, toast]);

  const onSubmit = async (values: FormValues) => {
    try {
      setLoading(true);
      const now = new Date().toISOString();

      const { error } = await supabase
        .from("property_requests")
        .update({
          title: values.title,
          description: values.description,
          location: values.location,
          expected_price: values.expected_price,
          number_of_tokens: values.number_of_tokens,
          token_name: values.token_name,
          token_symbol: values.token_symbol,
          status: values.status,
          token_address: values.token_address,
          payout_duration: values.payout_duration,
          roi: values.roi,
          image_url: values.image_url,
          documents_url: values.documents_url,
          staking_contract_address: values.staking_contract_address,
          staking_reward_rate: values.staking_reward_rate,
          staking_duration: values.staking_duration,
          staking_is_active: values.staking_is_active,
          updated_at: now,
        })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Property request updated successfully",
      });

      router.refresh();
    } catch (err: any) {
      console.error("Error updating request:", err);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="text-center py-8">
        <h1 className="text-2xl font-bold mb-4">Please connect your wallet</h1>
        <p className="text-muted-foreground">You need to connect your wallet to view this page</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
        <span>Loading property request...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p className="text-muted-foreground">{error}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push('/admin/requests')}
        >
          Back to Requests
        </Button>
      </div>
    );
  }

  const StakingInfo = ({ values }: { values: FormValues }) => {
    if (!values.staking_contract_address) return null;

    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Staking Contract Information</CardTitle>
          <CardDescription>Details about the staking contract for this property</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>
              <span className="font-semibold">Contract Address:</span>
              <code className="ml-2 p-1 bg-muted rounded">{values.staking_contract_address}</code>
            </div>
            <div>
              <span className="font-semibold">Reward Rate:</span>
              <span className="ml-2">
                {formatUnits(BigInt(values.staking_reward_rate || "0"), 6)} EURC/second
              </span>
            </div>
            <div>
              <span className="font-semibold">Duration:</span>
              <span className="ml-2">
                {(Number(values.staking_duration || 0) / (24 * 60 * 60)).toFixed(1)} days
              </span>
            </div>
            <div>
              <span className="font-semibold">Status:</span>
              <span className={cn("ml-2 px-2 py-1 rounded text-sm", 
                values.staking_is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              )}>
                {values.staking_is_active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <ClientOnly>
      <Card>
        <CardHeader>
          <CardTitle>Review Property Request</CardTitle>
          <CardDescription>
            Review and update the property request details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column - Property Details */}
                <div className="space-y-6">
                  <div className="space-y-6">
                    <PropertyDetailsFields form={form} />
                  </div>
                  <div className="space-y-4">
                    <StatusField form={form} />
                  </div>
                </div>

                {/* Right Column - Location */}
                <div className="space-y-6">
                  <LocationField form={form} />
                </div>
              </div>

              <div className="flex justify-between items-center pt-6 border-t">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-32"
                >
                  {loading && (
                    <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Changes
                </Button>

                <div className="flex space-x-4">
                  <ClientOnly>
                    {isConnected && form.getValues("status") === "pending" && (
                      <CreateTokenButton
                        propertyId={id}
                        form={form}
                      />
                    )}
                    {isConnected && form.getValues("status") === "onchain" && (
                      <ApproveTokenButton
                        propertyId={id}
                        form={form}
                      />
                    )}
                    {isConnected && form.getValues("status") === "funding" && (
                      <StakingInitButton 
                        propertyTokenAddress={form.getValues("token_address") || ""}
                        requestId={id}
                        form={form}
                      />
                    )}
                  </ClientOnly>
                </div>
              </div>
            </form>
          </Form>
          <StakingInfo values={form.getValues()} />
        </CardContent>
      </Card>
    </ClientOnly>
  );
}
