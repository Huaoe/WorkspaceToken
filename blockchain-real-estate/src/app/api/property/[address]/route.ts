import { NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { hardhat } from 'viem/chains';
import { propertyTokenABI } from '@contracts/abis/propertyTokenABI';

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
    
    const data = await client.readContract({
      address: propertyAddress,
      abi: propertyTokenABI,
      functionName: 'getPropertyDetails',
    });

    if (!data || !Array.isArray(data)) {
      throw new Error('Invalid property data');
    }

    const [title, description, location, imageUrl, price] = data;

    return NextResponse.json({
      title,
      description,
      location,
      imageUrl,
      price,
    });
  } catch (error) {
    console.error('Error fetching property details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch property details' },
      { status: 500 }
    );
  }
}
