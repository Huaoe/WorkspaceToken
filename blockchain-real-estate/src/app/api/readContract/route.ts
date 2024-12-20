import { NextResponse } from 'next/server'
import { createPublicClient, http, parseAbiItem, formatEther } from 'viem'
import { hardhat } from 'viem/chains'

const publicClient = createPublicClient({
  chain: hardhat,
  transport: http('http://127.0.0.1:8545'),
})

// Helper function to serialize BigInt values
function serializeBigInt(obj: any): any {
  if (typeof obj === 'bigint') {
    return obj.toString();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(serializeBigInt);
  }
  
  if (obj && typeof obj === 'object') {
    const serialized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      serialized[key] = serializeBigInt(value);
    }
    return serialized;
  }
  
  return obj;
}

export async function POST(request: Request) {
  try {
    const { address, abi, functionName, args = [] } = await request.json()

    // Validate inputs
    if (!address || !abi || !functionName) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Ensure address is a valid address string
    if (typeof address !== 'string' || !address.startsWith('0x')) {
      return NextResponse.json(
        { error: 'Invalid address format' },
        { status: 400 }
      )
    }

    // Find the specific function in the ABI
    const abiFunction = abi.find(
      (item: any) => item.type === 'function' && item.name === functionName
    )

    if (!abiFunction) {
      return NextResponse.json(
        { error: `Function ${functionName} not found in ABI` },
        { status: 400 }
      )
    }

    // Read from the contract
    const data = await publicClient.readContract({
      address: address as `0x${string}`,
      abi,
      functionName,
      args,
    })

    // For functions that return multiple values, convert to an object
    if (Array.isArray(data) && abiFunction.outputs) {
      const result = abiFunction.outputs.reduce((acc: any, output: any, index: number) => {
        const value = serializeBigInt(data[index]);
        const key = output.name || output.type || `output${index}`;
        acc[key] = value;
        return acc;
      }, {})
      return NextResponse.json(result)
    }

    // Serialize any BigInt values in the response
    return NextResponse.json(serializeBigInt(data))
  } catch (error: any) {
    return NextResponse.json(
      { 
        error: 'Failed to read contract',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
