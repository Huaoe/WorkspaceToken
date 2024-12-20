"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { propertyFormSchema } from "./components/PropertyDetailsFields";
import {
  useAccount,
  usePublicClient,
  useWalletClient,
} from "wagmi";
import { formatUnits, parseUnits } from "viem";
import { decodeEventLog } from "viem";
import { StakingInitButton } from "./components/StakingInitButton";
import { StatusField } from "./components/StatusField";
import { PropertyDetailsFields } from "./components/PropertyDetailsFields";
import { LocationField } from "./components/LocationField";
import { ClientOnly } from "./components/ClientOnly";
import { CreateTokenButton } from "./components/CreateTokenButton";

const formSchema = propertyFormSchema.extend({
  location: z.string().min(2).max(256, {
    message: "Location must be between 2 and 256 characters.",
  }),
  token_address: z.string().optional(),
  roi: z.number().min(0, "ROI must be greater than 0"),
  payout_duration: z.number().min(0, "Duration must be greater than 0"),
});

export default function ReviewRequest() {
  const { id } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      expected_price: "",
      number_of_tokens: "",
      token_name: "",
      token_symbol: "",
      status: "pending",
      token_address: "",
      payout_duration: 365,
      roi: 8.8,
    },
  });

  const fetchRequest = async () => {
    try {
      const { data, error } = await supabase
        .from("property_requests")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (data) {
        console.log('Database Response:', {
          payout_duration: data.payout_duration,
          roi: data.roi,
          full_data: data
        });

        form.reset({
          title: data.title || "",
          description: data.description || "",
          location: data.location || "",
          expected_price: data.expected_price || "",
          number_of_tokens: data.number_of_tokens || "",
          token_name: data.token_name || "",
          token_symbol: data.token_symbol || "",
          status: data.status || "pending",
          token_address: data.token_address || "",
          payout_duration: data.payout_duration || 365,
          roi: data.roi || 8.8,
        });
      }
    } catch (error) {
      console.error("Error fetching request:", error);
      toast({
        title: "Error",
        description: "Failed to fetch request data",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchRequest();
  }, [id]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      console.log("Form submission started with values:", {
        ...values,
        number_of_tokens_type: typeof values.number_of_tokens,
        number_of_tokens_value: values.number_of_tokens,
      });

      const now = new Date().toISOString();
      const updateData = {
        title: values.title,
        description: values.description,
        location: values.location,
        expected_price: values.expected_price,
        number_of_tokens: values.number_of_tokens,
        token_name: values.token_name,
        token_symbol: values.token_symbol,
        status: values.status,
        token_address: values.token_address,
        payout_duration: values.payout_duration || 365,
        roi: values.roi || 8.8,
        updated_at: now,
      };

      console.log('Updating request with data:', updateData);

      const { error: updateError } = await supabase
        .from("property_requests")
        .update(updateData)
        .eq("id", id);

      if (updateError) {
        console.error("Database update error:", updateError);
        throw updateError;
      }

      console.log("Database update successful");

      toast({
        title: "Success",
        description: "Property request updated successfully",
      });

      // Refresh the data
      const { data: refreshedData, error: refreshError } = await supabase
        .from("property_requests")
        .select("*")
        .eq("id", id)
        .single();

      if (refreshError) {
        console.error("Error refreshing data:", refreshError);
        throw refreshError;
      }

      console.log("Refreshed data:", refreshedData);
    } catch (error: any) {
      console.error("Form submission error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update property request",
        variant: "destructive",
      });
    }
  };

  return (
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
            <div className="space-y-4">
              <StatusField form={form} />
              <PropertyDetailsFields form={form} />
              <LocationField form={form} />

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="roi"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <div className="space-y-1">
                        <FormLabel>ROI (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="8.8"
                            {...field}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value);
                              field.onChange(isNaN(value) ? '' : value);
                            }}
                          />
                        </FormControl>
                      </div>
                      <FormDescription>
                        Annual return on investment percentage
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="payout_duration"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <div className="space-y-1">
                        <FormLabel>Payout Duration (days)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="365"
                            {...field}
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              field.onChange(isNaN(value) ? '' : value);
                            }}
                          />
                        </FormControl>
                      </div>
                      <FormDescription>
                        Duration of the staking period in days
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                type="button"
                onClick={() => router.push("/admin/requests")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && (
                  <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </div>
          </form>
        </Form>

        <div className="mt-6 flex flex-col gap-4">
          <ClientOnly>
            {() => form.watch("status") === "approved" && (
              <CreateTokenButton
                id={id}
                formData={form.getValues()}
              />
            )}
          </ClientOnly>
          <ClientOnly>
            {() => form.watch("status") === "funding" && (
              <StakingInitButton
                propertyTokenAddress={form.getValues().token_address as `0x${string}`}
                status={form.watch("status")}
              />
            )}
          </ClientOnly>
        </div>
      </CardContent>
    </Card>
  );
}
