'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import { propertyTokenABI, mockEURCABI } from '@/lib/contracts';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/lib/database.types'
import { PropertyRequest } from "@/types/property"

export default function PurchaseProperty() {
  const { tokenAddress } = useParams()
  const { address, isConnected } = useAccount()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [propertyDetails, setPropertyDetails] = useState<PropertyRequest | null>(null)
  const [tokenAmount, setTokenAmount] = useState('')
  const [eurcAmount, setEurcAmount] = useState('')
  const [eurcBalance, setEurcBalance] = useState(0n)
  const [eurcAllowance, setEurcAllowance] = useState(0n)
  const [tokenBalance, setTokenBalance] = useState(0n)
  const [remainingTokens, setRemainingTokens] = useState(0n)
  const [onChainDetails, setOnChainDetails] = useState<any>(null)
  const supabase = createClientComponentClient<Database>()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  const fetchPropertyDetails = async () => {
    if (!address || !tokenAddress) return
    setLoading(true)
    try {
      // Fetch on-chain data first
      const propertyContract = {
        address: tokenAddress as `0x${string}`,
        abi: propertyTokenABI,
      }

      const eurcContract = {
        address: process.env.NEXT_PUBLIC_EURC_TOKEN_ADDRESS as `0x${string}`,
        abi: mockEURCABI,
      }

      const [
        tokenName,
        tokenSymbol,
        totalSupply,
        userBalance,
        userEurcBalance,
        userEurcAllowance,
        tokenTotalSupply,
      ] = await Promise.all([
        publicClient.readContract({
          ...propertyContract,
          functionName: 'name',
        }),
        publicClient.readContract({
          ...propertyContract,
          functionName: 'symbol',
        }),
        publicClient.readContract({
          ...propertyContract,
          functionName: 'totalSupply',
        }),
        publicClient.readContract({
          ...propertyContract,
          functionName: 'balanceOf',
          args: [address],
        }),
        publicClient.readContract({
          ...eurcContract,
          functionName: 'balanceOf',
          args: [address],
        }),
        publicClient.readContract({
          ...eurcContract,
          functionName: 'allowance',
          args: [address, tokenAddress as `0x${string}`],
        }),
        publicClient.readContract({
          ...propertyContract,
          functionName: 'totalSupply',
        }),
      ])

      const remaining = tokenTotalSupply - userBalance

      // Try to fetch Supabase data, but don't fail if it's not available
      try {
        const { data: property, error } = await supabase
          .from('property_requests')
          .select('*')
          .eq('token_address', tokenAddress)
          .single()

        if (property && !error) {
          setPropertyDetails(property as PropertyRequest)
        } else {
          // Set default property details if no Supabase data
          setPropertyDetails({
            id: tokenAddress as string,
            created_at: new Date().toISOString(),
            owner_address: address,
            title: tokenName,
            description: "Property token details not available",
            location: "Location not specified",
            image_url: '/images/placeholder-property.jpg',
            expected_price: 5,
            latitude: 0,
            longitude: 0,
            status: 'live',
            token_address: tokenAddress as string,
          })
        }
      } catch (supabaseError) {
        console.log('Supabase data not available:', supabaseError)
        // Set default property details if Supabase fails
        setPropertyDetails({
          id: tokenAddress as string,
          created_at: new Date().toISOString(),
          owner_address: address,
          title: tokenName,
          description: "Property token details not available",
          location: "Location not specified",
          image_url: '/images/placeholder-property.jpg',
          expected_price: 5,
          latitude: 0,
          longitude: 0,
          status: 'live',
          token_address: tokenAddress as string,
        })
      }

      setOnChainDetails({
        name: tokenName,
        symbol: tokenSymbol,
        totalSupply: totalSupply,
      })

      setTokenBalance(userBalance)
      setEurcBalance(userEurcBalance)
      setEurcAllowance(userEurcAllowance)
      setRemainingTokens(remaining)

    } catch (error) {
      console.error('Error fetching details:', error)
      toast({
        title: "Error",
        description: "Failed to fetch token details",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (tokenAddress && address) {
      fetchPropertyDetails()
    }
  }, [tokenAddress, address])

  const handleTokenAmountChange = (value: string) => {
    setTokenAmount(value)
    const calculatedEurcAmount = Number(value) * (propertyDetails?.expected_price || 5)
    setEurcAmount(calculatedEurcAmount.toString())
  }

  const approveEurc = async () => {
    if (!walletClient || !tokenAddress || !tokenAmount) return
    setLoading(true)
    try {
      // Calculate the exact amount needed based on property price
      // Price is already in EURC with 6 decimals, tokenAmount needs to be converted to base units
      const pricePerToken = propertyDetails?.price || BigInt(5 * 10**6) // Price in EURC with 6 decimals
      const tokenAmountBigInt = parseUnits(tokenAmount, 18) // Convert to wei (18 decimals)
      
      // Calculate total EURC needed:
      // 1. Convert token amount to base units (divide by 10^18)
      // 2. Multiply by price (which is already in EURC with 6 decimals)
      const eurcAmount = (tokenAmountBigInt * pricePerToken) / BigInt(10**18)
      
      console.log('Debug - EURC approval calculation:', {
        tokenAmount,
        tokenAmountInWei: tokenAmountBigInt.toString(),
        pricePerToken: pricePerToken.toString(),
        priceInEURC: formatUnits(pricePerToken, 6),
        calculatedEurcAmount: eurcAmount.toString(),
        eurcAmountFormatted: formatUnits(eurcAmount, 6),
        tokenAddress,
        eurcAddress: process.env.NEXT_PUBLIC_EURC_TOKEN_ADDRESS,
        userAddress: address
      })

      // Check current allowance before approval
      const currentAllowance = await publicClient.readContract({
        address: process.env.NEXT_PUBLIC_EURC_TOKEN_ADDRESS as `0x${string}`,
        abi: mockEURCABI,
        functionName: 'allowance',
        args: [address, tokenAddress],
      })
      console.log('Debug - Current allowance:', formatUnits(currentAllowance, 6), 'EURC')
      
      // Check EURC balance
      const balance = await publicClient.readContract({
        address: process.env.NEXT_PUBLIC_EURC_TOKEN_ADDRESS as `0x${string}`,
        abi: mockEURCABI,
        functionName: 'balanceOf',
        args: [address],
      })
      console.log('Debug - EURC balance:', formatUnits(balance, 6), 'EURC')

      // First simulate the transaction
      const { request } = await publicClient.simulateContract({
        address: process.env.NEXT_PUBLIC_EURC_TOKEN_ADDRESS as `0x${string}`,
        abi: mockEURCABI,
        functionName: 'approve',
        args: [tokenAddress, eurcAmount],
        account: address,
      })
      
      console.log('Debug - Simulated approval request:', {
        to: request.address,
        amount: eurcAmount.toString(),
        amountInEURC: formatUnits(eurcAmount, 6),
        from: address,
        args: request.args,
        functionName: request.functionName,
      })

      // Execute the transaction
      const hash = await walletClient.writeContract({
        ...request,
        account: address,
      })
      
      console.log('Debug - Approval transaction hash:', hash)
      
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      console.log('Debug - Approval transaction receipt:', {
        status: receipt.status,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        logs: receipt.logs
      })

      // Verify new allowance after approval
      const newAllowance = await publicClient.readContract({
        address: process.env.NEXT_PUBLIC_EURC_TOKEN_ADDRESS as `0x${string}`,
        abi: mockEURCABI,
        functionName: 'allowance',
        args: [address, tokenAddress],
      })
      console.log('Debug - New allowance after approval:', formatUnits(newAllowance, 6), 'EURC')

      await fetchPropertyDetails()
      toast({
        title: "Success",
        description: "EURC approved successfully",
      })
    } catch (error) {
      console.error('Debug - Error approving EURC:', error)
      // Log detailed error information
      if (error.cause) console.error('Debug - Error cause:', error.cause)
      if (error.data) console.error('Debug - Error data:', error.data)
      if (error.message) console.error('Debug - Error message:', error.message)
      toast({
        title: "Error",
        description: error.message || "Failed to approve EURC. Please check the console for details.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const purchaseTokens = async () => {
    if (!walletClient || !tokenAddress || !tokenAmount) return
    try {
      setLoading(true)
      
      // Convert token amount to wei (18 decimals)
      const tokenAmountBigInt = parseUnits(tokenAmount, 18)
      // Price is already in EURC with 6 decimals
      const pricePerToken = propertyDetails?.price || BigInt(5 * 10**6)
      // Calculate total EURC needed (same as in approveEurc)
      const eurcAmount = (tokenAmountBigInt * pricePerToken) / BigInt(10**18)

      console.log('Debug - Purchase tokens:', {
        tokenAmount,
        tokenAmountInWei: tokenAmountBigInt.toString(),
        pricePerToken: pricePerToken.toString(),
        priceInEURC: formatUnits(pricePerToken, 6),
        eurcAmount: eurcAmount.toString(),
        eurcAmountFormatted: formatUnits(eurcAmount, 6),
        tokenAddress,
        eurcAddress: process.env.NEXT_PUBLIC_EURC_TOKEN_ADDRESS
      })

      // Check current EURC allowance
      const currentAllowance = await publicClient.readContract({
        address: process.env.NEXT_PUBLIC_EURC_TOKEN_ADDRESS as `0x${string}`,
        abi: mockEURCABI,
        functionName: 'allowance',
        args: [address, tokenAddress],
      })
      console.log('Debug - Current allowance before purchase:', formatUnits(currentAllowance, 6), 'EURC')

      // Check EURC balance
      const balance = await publicClient.readContract({
        address: process.env.NEXT_PUBLIC_EURC_TOKEN_ADDRESS as `0x${string}`,
        abi: mockEURCABI,
        functionName: 'balanceOf',
        args: [address],
      })
      console.log('Debug - EURC balance before purchase:', formatUnits(balance, 6), 'EURC')

      // First approve EURC spending if needed
      if (currentAllowance < eurcAmount) {
        console.log('Debug - Need to approve more EURC')
        const { request } = await publicClient.simulateContract({
          address: process.env.NEXT_PUBLIC_EURC_TOKEN_ADDRESS as `0x${string}`,
          abi: mockEURCABI,
          functionName: 'approve',
          args: [tokenAddress, eurcAmount],
          account: address,
        })
        
        const approveHash = await walletClient.writeContract({
          ...request,
          account: address,
        })
        console.log('Debug - Approval transaction hash:', approveHash)
        
        const approveReceipt = await publicClient.waitForTransactionReceipt({ hash: approveHash })
        console.log('Debug - Approval receipt:', approveReceipt)

        // Wait for allowance to be updated
        const newAllowance = await publicClient.readContract({
          address: process.env.NEXT_PUBLIC_EURC_TOKEN_ADDRESS as `0x${string}`,
          abi: mockEURCABI,
          functionName: 'allowance',
          args: [address, tokenAddress],
        })
        console.log('Debug - New allowance after approval:', formatUnits(newAllowance, 6), 'EURC')
      }

      // Call purchaseTokens on the PropertyToken contract
      const { request } = await publicClient.simulateContract({
        address: tokenAddress as `0x${string}`,
        abi: propertyTokenABI,
        functionName: 'purchaseTokens',
        args: [tokenAmountBigInt],
        account: address,
      })
      
      console.log('Debug - Purchase simulation:', {
        tokenAmount: tokenAmountBigInt.toString(),
        contract: tokenAddress,
        args: request.args,
      })

      const purchaseHash = await walletClient.writeContract({
        ...request,
        account: address,
      })
      console.log('Debug - Purchase transaction hash:', purchaseHash)
      
      const purchaseReceipt = await publicClient.waitForTransactionReceipt({ hash: purchaseHash })
      console.log('Debug - Purchase receipt:', {
        status: purchaseReceipt.status,
        blockNumber: purchaseReceipt.blockNumber,
        gasUsed: purchaseReceipt.gasUsed.toString(),
        logs: purchaseReceipt.logs
      })
      
      await fetchPropertyDetails()
      setTokenAmount('')
      toast({
        title: "Success",
        description: "Tokens purchased successfully",
      })
    } catch (error) {
      console.error('Debug - Error purchasing tokens:', error)
      // Log detailed error information
      if (error.cause) console.error('Debug - Error cause:', error.cause)
      if (error.data) console.error('Debug - Error data:', error.data)
      if (error.message) console.error('Debug - Error message:', error.message)
      toast({
        title: "Error",
        description: error.message || "Failed to purchase tokens. Please check the console for details.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const sellTokens = async () => {
    if (!walletClient || !tokenAddress || !tokenAmount) return
    try {
      setLoading(true)
      const hash = await walletClient.writeContract({
        address: tokenAddress as `0x${string}`,
        abi: propertyTokenABI,
        functionName: 'sellTokens',
        args: [parseUnits(tokenAmount, 18)],
      })
      await publicClient.waitForTransactionReceipt({ hash })
      await fetchPropertyDetails()
      setTokenAmount('')
      toast({
        title: "Success",
        description: "Tokens sold successfully",
      })
    } catch (error) {
      console.error('Error selling tokens:', error)
      toast({
        title: "Error",
        description: "Failed to sell tokens",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Purchase Property Tokens</CardTitle>
          <CardDescription>Purchase tokens for this property using EURC</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : propertyDetails ? (
            <div className="space-y-6">
              {/* Add PropertyToken Address display */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">PropertyToken Address</div>
                <div className="font-mono text-sm break-all">{tokenAddress as string}</div>
              </div>
              <div className="flex flex-col md:flex-row gap-6">
                {/* Property Image */}
                <div className="w-full md:w-1/2 relative">
                  <div className="aspect-square relative rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <Image
                      src={propertyDetails.image_url || '/images/placeholder-property.jpg'}
                      alt={propertyDetails.title}
                      width={500}
                      height={500}
                      className="object-cover hover:scale-105 transition-transform duration-300"
                      priority
                    />
                  </div>
                </div>

                {/* Property Details */}
                <div className="w-full md:w-1/2 space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{propertyDetails.title}</h3>
                    <p className="text-gray-600">{propertyDetails.description}</p>
                    <div className="mt-2 inline-flex items-center bg-gray-100 rounded-full px-3 py-1 text-sm">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {propertyDetails.location}
                    </div>
                  </div>

                  {/* Token Information */}
                  <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
                    <h4 className="text-lg font-semibold border-b pb-2">Token Information</h4>
                    <div className="grid gap-3">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Token Symbol</span>
                          <span className="font-semibold text-blue-600">{onChainDetails?.symbol}</span>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Total Supply</span>
                          <span className="font-semibold text-purple-600">
                            {formatUnits(onChainDetails?.totalSupply || 0n, 18)} Tokens
                          </span>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Available Tokens</span>
                          <span className="font-semibold text-green-600">
                            {formatUnits(remainingTokens, 18)} Tokens
                          </span>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Your Balance</span>
                          <span className="font-semibold text-green-600">
                            {formatUnits(tokenBalance, 18)} Tokens
                          </span>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">EURC Balance</span>
                          <span className="font-semibold text-blue-600">
                            {formatUnits(eurcBalance, 6)} EURC
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Purchase Form */}
                    <div className="space-y-4 mt-6">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-sm font-medium text-blue-900">Price per token</span>
                          <span className="text-xl font-bold text-blue-600">{propertyDetails.expected_price} EURC</span>
                        </div>
                        <div className="space-y-3">
                          <label className="block text-sm font-medium text-gray-700">
                            Amount to Purchase
                          </label>
                          <Input
                            type="number"
                            value={tokenAmount}
                            onChange={(e) => handleTokenAmountChange(e.target.value)}
                            placeholder="Enter number of tokens"
                            className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            disabled={loading}
                          />
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Total Cost:</span>
                            <span className="font-semibold text-blue-600">{eurcAmount} EURC</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-4">
                        <Button
                          onClick={approveEurc}
                          disabled={loading || !tokenAmount}
                          className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white transition-all duration-200"
                        >
                          {loading ? (
                            <div className="flex items-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              <span>Approving...</span>
                            </div>
                          ) : (
                            "Approve EURC"
                          )}
                        </Button>
                        <Button
                          onClick={purchaseTokens}
                          disabled={loading || !tokenAmount}
                          className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white transition-all duration-200"
                        >
                          {loading ? (
                            <div className="flex items-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              <span>Processing...</span>
                            </div>
                          ) : (
                            "Purchase Tokens"
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">No property details available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
