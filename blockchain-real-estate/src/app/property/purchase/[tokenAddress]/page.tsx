'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Image from 'next/image'
import { propertyTokenABI } from '@contracts/abis/PropertyToken.json
import { erc20ABI } from '@contracts/abis/MockEURC.json'

export default function PurchaseProperty() {
  const { tokenAddress } = useParams()
  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  const { toast } = useToast()

  const [loading, setLoading] = useState(false)
  const [propertyDetails, setPropertyDetails] = useState<any>(null)
  const [eurcAddress, setEurcAddress] = useState<string>('')
  const [eurcBalance, setEurcBalance] = useState<string>('0')
  const [eurcAllowance, setEurcAllowance] = useState<string>('0')
  const [tokenAmount, setTokenAmount] = useState('')
  const [eurcAmount, setEurcAmount] = useState('0')
  const [tokenBalance, setTokenBalance] = useState<string>('0')
  const [remainingTokens, setRemainingTokens] = useState<string>('0')
  const [mounted, setMounted] = useState(false)

  // Mock EURC token address
  const MOCK_EURC_ADDRESS = "0xa85233C63b9Ee964Add6F2cffe00Fd84eb32338f"

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isConnected || !tokenAddress || !mounted) return
    fetchDetails()
  }, [isConnected, tokenAddress, mounted])

  if (!mounted) {
    return null
  }

  if (!isConnected) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>Purchase Property Tokens</CardTitle>
            <CardDescription>Please connect your wallet to purchase tokens</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const fetchDetails = async () => {
    if (!tokenAddress || !publicClient || !address) return

    try {
      setLoading(true)

      // Get property details
      const data = await publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: propertyTokenABI,
        functionName: 'getPropertyDetails',
      }) as any[]

      const [title, description, location, imageUrl, price, isActive] = data
      console.log('Raw price from contract:', price.toString())
      
      // Price should be 5 EURC (5 * 10^6 since EURC has 6 decimals)
      const priceInEurc = Number(formatUnits(price, 6))
      console.log('Formatted price:', priceInEurc)

      setPropertyDetails({
        title,
        description,
        location,
        imageUrl,
        price: priceInEurc,
        isActive
      })

      setEurcAddress(MOCK_EURC_ADDRESS)

      // Get EURC balance
      const eurcBalanceResult = await publicClient.readContract({
        address: MOCK_EURC_ADDRESS as `0x${string}`,
        abi: erc20ABI,
        functionName: 'balanceOf',
        args: [address],
      })
      console.log('Raw EURC balance:', (eurcBalanceResult as bigint).toString())
      setEurcBalance(eurcBalanceResult as bigint)

      // Get token balance
      const tokenBalanceResult = await publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: propertyTokenABI,
        functionName: 'balanceOf',
        args: [address],
      })
      console.log('Raw token balance:', (tokenBalanceResult as bigint).toString())
      setTokenBalance(tokenBalanceResult as bigint)

      // Get total supply (max supply) - hardcoded to 1000 tokens
      const maxSupply = parseUnits('1000', 18)

      // Get current supply
      const currentSupply = await publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: propertyTokenABI,
        functionName: 'totalSupply',
      }) as bigint

      // Calculate remaining tokens
      const remaining = maxSupply - currentSupply
      console.log('Max supply:', formatUnits(maxSupply, 18))
      console.log('Current supply:', formatUnits(currentSupply, 18))
      console.log('Remaining tokens:', formatUnits(remaining, 18))
      setRemainingTokens(remaining)

      // Get EURC allowance
      const allowance = await publicClient.readContract({
        address: MOCK_EURC_ADDRESS as `0x${string}`,
        abi: erc20ABI,
        functionName: 'allowance',
        args: [address, tokenAddress],
      })
      setEurcAllowance(formatUnits(allowance as bigint, 6))
    } catch (error) {
      console.error('Error fetching details:', error)
      toast({
        title: "Error",
        description: "Failed to fetch property details",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTokenAmountChange = (value: string) => {
    setTokenAmount(value)
    if (value) {
      // Calculate total EURC needed (5 EURC per token)
      const totalEurc = (Number(value) * 5).toFixed(2)
      setEurcAmount(totalEurc)
    } else {
      setEurcAmount('0')
    }
  }

  const approveEurc = async () => {
    if (!walletClient || !tokenAddress || !tokenAmount) return
    try {
      setLoading(true)
      // Calculate EURC amount needed (5 EURC per token)
      const eurcNeeded = parseUnits((Number(tokenAmount) * 5).toString(), 6)
      const hash = await walletClient.writeContract({
        address: MOCK_EURC_ADDRESS as `0x${string}`,
        abi: erc20ABI,
        functionName: 'approve',
        args: [tokenAddress, eurcNeeded],
      })
      await publicClient.waitForTransactionReceipt({ hash })
      await fetchDetails()
      toast({
        title: "Success",
        description: "EURC approved successfully",
      })
    } catch (error) {
      console.error('Error approving EURC:', error)
      toast({
        title: "Error",
        description: "Failed to approve EURC",
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
      const amountInWei = parseUnits(tokenAmount, 18)
      // Calculate EURC amount (price is 5 EURC per token, EURC has 6 decimals)
      const eurcAmount = parseUnits((Number(tokenAmount) * 5).toString(), 6)

      // First approve EURC spending
      const approveHash = await walletClient.writeContract({
        address: MOCK_EURC_ADDRESS as `0x${string}`,
        abi: erc20ABI,
        functionName: 'approve',
        args: [tokenAddress, eurcAmount],
      })
      await publicClient.waitForTransactionReceipt({ hash: approveHash })

      // Then transfer EURC to the contract
      const transferHash = await walletClient.writeContract({
        address: MOCK_EURC_ADDRESS as `0x${string}`,
        abi: erc20ABI,
        functionName: 'transfer',
        args: [tokenAddress, eurcAmount],
      })
      
      await publicClient.waitForTransactionReceipt({ hash: transferHash })
      await fetchDetails()
      setTokenAmount('')
      toast({
        title: "Success",
        description: "Tokens purchased successfully",
      })
    } catch (error) {
      console.error('Error purchasing tokens:', error)
      toast({
        title: "Error",
        description: "Failed to purchase tokens",
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
      await fetchDetails()
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
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Purchase Property Tokens</CardTitle>
          <CardDescription>
            {loading ? "Loading property details..." : (
              propertyDetails ? `${propertyDetails.title} - ${propertyDetails.location}` : "Property details not found"
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {propertyDetails && (
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-2xl font-bold">{propertyDetails.title}</h1>
                
                {/* Property Image */}
                <div className="relative w-full h-[400px] rounded-lg overflow-hidden">
                  <Image
                    src={propertyDetails.imageUrl}
                    alt={propertyDetails.title}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Property Description */}
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold">Description</h2>
                  <p className="text-gray-600">{propertyDetails.description}</p>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold">Location</h2>
                  <p className="text-gray-600">{propertyDetails.location}</p>
                </div>

                <div className="border-t pt-4">
                  <h2 className="text-xl font-semibold mb-4">Token Details</h2>
                  <div>
                    <p className="text-sm font-medium">Price per token</p>
                    <p className="text-2xl font-bold">5.00 EURC</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Your EURC Balance</p>
                      <p className="text-lg">{Number(formatUnits(eurcBalance, 6)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EURC</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Your Token Balance</p>
                      <p className="text-lg">{Number(formatUnits(tokenBalance, 18)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Tokens</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Remaining Tokens Available</p>
                    <p className="text-lg font-semibold">{Number(formatUnits(remainingTokens, 18)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Tokens</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Amount of tokens</label>
                    <Input
                      type="number"
                      value={tokenAmount}
                      onChange={(e) => handleTokenAmountChange(e.target.value)}
                      placeholder="Enter amount of tokens"
                      disabled={loading}
                    />
                    <p className="text-sm text-gray-500">Total EURC: {eurcAmount}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          {Number(eurcAllowance) < Number(eurcAmount) ? (
            <Button onClick={approveEurc} disabled={loading || !tokenAmount}>
              {loading ? "Approving..." : "Approve EURC"}
            </Button>
          ) : (
            <>
              <Button onClick={sellTokens} disabled={loading || !tokenAmount || Number(tokenAmount) > Number(tokenBalance)} variant="outline">
                {loading ? "Selling..." : "Sell Tokens"}
              </Button>
              <Button onClick={purchaseTokens} disabled={loading || !tokenAmount || Number(eurcAmount) > Number(eurcBalance)}>
                {loading ? "Purchasing..." : "Buy Tokens"}
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
