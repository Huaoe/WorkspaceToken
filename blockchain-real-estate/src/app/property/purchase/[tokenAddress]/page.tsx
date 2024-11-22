'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { propertyTokenABI } from '@/contracts/abis/propertyTokenABI'
import { erc20ABI } from '@/contracts/abis/erc20ABI'

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

  useEffect(() => {
    if (!isConnected || !tokenAddress) return
    fetchDetails()
  }, [isConnected, tokenAddress])

  const fetchDetails = async () => {
    try {
      setLoading(true)

      // Get property details
      const data = await publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: propertyTokenABI,
        functionName: 'getPropertyDetails',
      })

      setPropertyDetails(data)

      // Get EURC token address
      const { data: eurcTokenAddress } = await publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: propertyTokenABI,
        functionName: 'eurcToken',
      })

      setEurcAddress(eurcTokenAddress as string)

      if (address) {
        // Get token balance
        const balance = await publicClient.readContract({
          address: tokenAddress as `0x${string}`,
          abi: propertyTokenABI,
          functionName: 'balanceOf',
          args: [address],
        })
        setTokenBalance(formatUnits(balance as bigint, 18))

        // Get EURC balance
        const eurcBalance = await publicClient.readContract({
          address: eurcTokenAddress as `0x${string}`,
          abi: erc20ABI,
          functionName: 'balanceOf',
          args: [address],
        })
        setEurcBalance(formatUnits(eurcBalance as bigint, 6))

        // Get EURC allowance
        const allowance = await publicClient.readContract({
          address: eurcTokenAddress as `0x${string}`,
          abi: erc20ABI,
          functionName: 'allowance',
          args: [address, tokenAddress],
        })
        setEurcAllowance(formatUnits(allowance as bigint, 6))
      }
    } catch (error) {
      console.error('Error fetching details:', error)
      toast({
        title: "Error",
        description: "Failed to fetch details",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTokenAmountChange = (value: string) => {
    setTokenAmount(value)
    if (propertyDetails && value) {
      const eurcNeeded = (Number(value) * Number(propertyDetails.price)).toString()
      setEurcAmount(eurcNeeded)
    } else {
      setEurcAmount('0')
    }
  }

  const approveEurc = async () => {
    if (!walletClient || !eurcAddress || !tokenAddress) return
    try {
      setLoading(true)
      const hash = await walletClient.writeContract({
        address: eurcAddress as `0x${string}`,
        abi: erc20ABI,
        functionName: 'approve',
        args: [tokenAddress, parseUnits(eurcAmount, 6)],
      })
      await publicClient.waitForTransactionReceipt({ hash })
      await fetchDetails()
      toast({
        title: "Success",
        description: "EURC approved for spending",
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
      const hash = await walletClient.writeContract({
        address: tokenAddress as `0x${string}`,
        abi: propertyTokenABI,
        functionName: 'purchaseTokens',
        args: [parseUnits(tokenAmount, 18)],
      })
      await publicClient.waitForTransactionReceipt({ hash })
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
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">Price per token</p>
                <p className="text-2xl font-bold">{propertyDetails.price} EURC</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Your EURC Balance</p>
                  <p className="text-lg">{eurcBalance} EURC</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Your Token Balance</p>
                  <p className="text-lg">{tokenBalance} Tokens</p>
                </div>
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
