'use client';

import { useRouter } from 'next/navigation';
import { useAccount, useContractWrite, useWaitForTransaction, usePublicClient } from 'wagmi';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { propertyFactoryABI } from '@/contracts/abis/propertyFactoryABI';
import { parseEther, keccak256 } from 'viem';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const propertySchema = z.object({
  title: z.string()
    .min(3, "Title must be at least 3 characters")
    .max(20, "Title must be less than 20 characters")
    .regex(/^[\w\s-]*$/, "Title can only contain letters, numbers, spaces, and hyphens"),
  description: z.string()
    .min(10, "Description must be at least 10 characters")
    .max(50, "Description must be less than 50 characters")
    .regex(/^[\w\s-.,]*$/, "Description can only contain letters, numbers, spaces, periods, commas, and hyphens"),
  location: z.string()
    .min(3, "Location must be at least 3 characters")
    .max(20, "Location must be less than 20 characters")
    .regex(/^[\w\s-,]*$/, "Location can only contain letters, numbers, spaces, commas, and hyphens"),
  price: z.string()
    .min(1, "Price is required")
    .regex(/^\d*\.?\d*$/, "Price must be a valid number")
    .refine((val) => {
      try {
        const num = parseFloat(val);
        return num >= 0.1 && num <= 100;
      } catch {
        return false;
      }
    }, "Price must be between 0.1 and 100 ETH"),
  imageUrl: z.string()
    .url("Must be a valid URL")
    .max(100, "URL must be less than 100 characters"),
});

type PropertyFormData = z.infer<typeof propertySchema>;

export default function SubmitProperty() {
  const router = useRouter();
  const { address } = useAccount();
  const { toast } = useToast();
  const publicClient = usePublicClient();

  const { register, handleSubmit, formState: { errors } } = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
  });

  const contractAddress = process.env.NEXT_PUBLIC_PROPERTY_FACTORY_ADDRESS;
  
  if (!contractAddress) {
    console.error('🏠 [Property Submit] Contract address not found in environment variables');
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-red-500">
          Contract address not configured. Please check your environment variables.
        </div>
      </div>
    );
  }

  const { write: createProperty, data: txData, isLoading: isWritePending } = useContractWrite({
    address: contractAddress as `0x${string}`,
    abi: propertyFactoryABI,
    functionName: 'createProperty',
    onSuccess: (data) => {
      console.log("🏠 [Property Submit] Write success:", data);
    },
    onError: (error) => {
      console.error("🏠 [Property Submit] Write error:", error);
      toast({
        title: "Error",
        description: "Failed to create property. Please try again.",
        variant: "destructive",
      });
    }
  });

  const { isLoading: isWaitingForTransaction } = useWaitForTransaction({
    hash: txData?.hash,
    onSuccess: (receipt) => {
      console.log("🏠 [Property Submit] Transaction receipt:", receipt);
      
      // Get the PropertySubmitted event from the receipt
      const event = receipt.logs.find(log => {
        try {
          return log.topics[0] === '0x' + keccak256('PropertySubmitted(address,address)').toString('hex');
        } catch {
          return false;
        }
      });

      console.log("🏠 [Property Submit] PropertySubmitted event:", event);

      toast({
        title: "Success",
        description: "Property submitted successfully! Redirecting to homepage...",
      });

      // Wait a brief moment before redirecting
      setTimeout(() => {
        router.push('/');
      }, 2000);
    },
    onError: (error) => {
      console.error("🏠 [Property Submit] Transaction error:", error);
      toast({
        title: "Error",
        description: "Transaction failed. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: PropertyFormData) => {
    try {
      if (!address) {
        toast({
          title: "Error",
          description: "Please connect your wallet first",
          variant: "destructive",
        });
        return;
      }

      if (!createProperty) {
        throw new Error("Contract write function not available");
      }

      // Verify contract exists
      const contractCode = await publicClient.getBytecode({
        address: contractAddress as `0x${string}`,
      });

      if (!contractCode) {
        throw new Error("Contract not deployed. Please deploy the contract first.");
      }

      // Convert price to Wei with proper validation
      const priceString = data.price.trim();
      if (!/^\d*\.?\d*$/.test(priceString)) {
        throw new Error("Invalid price format");
      }

      const priceNum = parseFloat(priceString);
      if (priceNum < 0.1 || priceNum > 100) {
        throw new Error("Price must be between 0.1 and 100 ETH");
      }

      const priceInWei = parseEther(priceString);

      // Clean input strings
      const cleanTitle = data.title.trim().replace(/[^\w\s-]/g, '');
      const cleanDescription = data.description.trim().replace(/[^\w\s-.,]/g, '');
      const cleanLocation = data.location.trim().replace(/[^\w\s-,]/g, '');
      
      console.log("🏠 [Property Submit] Submitting property with args:", {
        title: cleanTitle,
        description: cleanDescription,
        location: cleanLocation,
        imageUrl: data.imageUrl.trim(),
        price: priceInWei.toString()
      });

      createProperty({
        args: [
          cleanTitle,
          cleanDescription,
          cleanLocation,
          data.imageUrl.trim(),
          priceInWei
        ],
      });

    } catch (error) {
      console.error("🏠 [Property Submit] Error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit property",
        variant: "destructive",
      });
    }
  };

  const isLoading = isWritePending || isWaitingForTransaction;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Submit Property</h1>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
        <div>
          <label className="block text-sm font-medium mb-2">Title</label>
          <input
            {...register("title")}
            className="w-full p-2 border rounded"
            placeholder="Property Title"
          />
          {errors.title && (
            <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            {...register("description")}
            className="w-full p-2 border rounded"
            placeholder="Property Description"
            rows={3}
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Location</label>
          <input
            {...register("location")}
            className="w-full p-2 border rounded"
            placeholder="Property Location"
          />
          {errors.location && (
            <p className="text-red-500 text-sm mt-1">{errors.location.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Price (ETH)</label>
          <input
            {...register("price")}
            className="w-full p-2 border rounded"
            placeholder="0.00"
            type="number"
            step="0.01"
          />
          {errors.price && (
            <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Image URL</label>
          <input
            {...register("imageUrl")}
            className="w-full p-2 border rounded"
            placeholder="https://..."
          />
          {errors.imageUrl && (
            <p className="text-red-500 text-sm mt-1">{errors.imageUrl.message}</p>
          )}
        </div>

        <Button 
          type="submit" 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? "Submitting..." : "Submit Property"}
        </Button>
      </form>
    </div>
  );
}
