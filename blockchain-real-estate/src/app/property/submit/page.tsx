'use client';

import { useRouter } from 'next/navigation';
import { useAccount, useContractWrite, useWaitForTransaction, usePublicClient } from 'wagmi';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { propertyFactoryABI } from '@/contracts/abis/propertyFactoryABI';
import { parseEther } from 'viem';
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
  tokenName: z.string()
    .min(3, "Token name must be at least 3 characters")
    .max(20, "Token name must be less than 20 characters")
    .regex(/^[\w\s-]*$/, "Token name can only contain letters, numbers, spaces, and hyphens"),
  tokenSymbol: z.string()
    .min(2, "Token symbol must be at least 2 characters")
    .max(6, "Token symbol must be less than 6 characters")
    .regex(/^[A-Z0-9]*$/, "Token symbol must be uppercase letters and numbers only"),
  propertyOwnerAddress: z.string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Must be a valid Ethereum address"),
});

type PropertyFormData = z.infer<typeof propertySchema>;

const contractAddress = process.env.NEXT_PUBLIC_PROPERTY_FACTORY_ADDRESS;

export default function SubmitProperty() {
  const router = useRouter();
  const { address } = useAccount();
  const { toast } = useToast();
  const publicClient = usePublicClient();

  const { register, handleSubmit, formState: { errors } } = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
  });

  const { write: createProperty, data: createPropertyData } = useContractWrite({
    address: contractAddress as `0x${string}`,
    abi: propertyFactoryABI,
    functionName: 'createProperty',
  });

  const { isLoading: isPropertyCreating } = useWaitForTransaction({
    hash: createPropertyData?.hash,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Property created successfully!",
      });
      router.push('/property/list');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create property: ${error.message}`,
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

      createProperty({
        args: [
          data.title,
          data.description,
          data.location,
          data.imageUrl,
          data.tokenName,
          data.tokenSymbol,
          data.propertyOwnerAddress,
          parseEther(data.price),
        ],
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create property",
        variant: "destructive",
      });
    }
  };

  if (!address) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Submit Property</h1>
        <p>Please connect your wallet to submit a property.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Submit Property</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
        <div>
          <label className="block text-sm font-medium mb-2">Title</label>
          <input
            {...register("title")}
            className="w-full p-2 border rounded-md"
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
            className="w-full p-2 border rounded-md"
            placeholder="Property Description"
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Location</label>
          <input
            {...register("location")}
            className="w-full p-2 border rounded-md"
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
            className="w-full p-2 border rounded-md"
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
            className="w-full p-2 border rounded-md"
            placeholder="https://example.com/image.jpg"
          />
          {errors.imageUrl && (
            <p className="text-red-500 text-sm mt-1">{errors.imageUrl.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Token Name</label>
          <input
            {...register("tokenName")}
            className="w-full p-2 border rounded-md"
            placeholder="MyProperty Token"
          />
          {errors.tokenName && (
            <p className="text-red-500 text-sm mt-1">{errors.tokenName.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Token Symbol</label>
          <input
            {...register("tokenSymbol")}
            className="w-full p-2 border rounded-md"
            placeholder="PROP"
          />
          {errors.tokenSymbol && (
            <p className="text-red-500 text-sm mt-1">{errors.tokenSymbol.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Property Owner Address</label>
          <input
            {...register("propertyOwnerAddress")}
            className="w-full p-2 border rounded-md"
            placeholder="0x..."
          />
          {errors.propertyOwnerAddress && (
            <p className="text-red-500 text-sm mt-1">{errors.propertyOwnerAddress.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isPropertyCreating}
        >
          {isPropertyCreating ? "Creating Property..." : "Create Property"}
        </Button>
      </form>
    </div>
  );
}
