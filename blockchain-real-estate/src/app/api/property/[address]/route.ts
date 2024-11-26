import { NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { hardhat } from 'viem/chains';
import { propertyTokenABI } from '@/lib/contracts';

const client = createPublicClient({
  chain: hardhat,
  transport: http('http://127.0.0.1:8545'),
});

export async function GET(
  request: Request,
  { params }: { params: { address: string } }
) {
  try {
    const propertyAddress = params.address as `0x${string}`;
    
    const propertyDetails = await client.readContract({
      address: propertyAddress,
      abi: propertyTokenABI,
      functionName: 'getPropertyDetails',
    });

    const price = await client.readContract({
      address: propertyAddress,
      abi: propertyTokenABI,
      functionName: 'getPrice',
    });

    const totalSupply = await client.readContract({
      address: propertyAddress,
      abi: propertyTokenABI,
      functionName: 'totalSupply',
    });

    const isApproved = await client.readContract({
      address: propertyAddress,
      abi: propertyTokenABI,
      functionName: 'isApproved',
    });

    return NextResponse.json({
      ...propertyDetails,
      price,
      totalSupply,
      isApproved,
    });
  } catch (error) {
    console.error('Error fetching property details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch property details' },
      { status: 500 }
    );
  }
}
