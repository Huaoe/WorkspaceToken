"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAccount, usePublicClient, useWalletClient, useContractReads } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/lib/database.types";
import { PropertyRequest } from "@/types/property";
import propertyTokenABI from "@contracts/abis/PropertyToken";
import mockEURCABI from "@contracts/abis/MockEURC";
import whitelistJSON from "@contracts/abis/Whitelist.json";
import Image from "next/image";
import { Loader2, MapPinIcon } from "lucide-react";

const whitelistABI = whitelistJSON.abi;

export default function PurchaseProperty() {
  const { tokenAddress } = useParams();
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const [propertyDetails, setPropertyDetails] =
    useState<PropertyRequest | null>(null);
  const [onChainDetails, setOnChainDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tokenAmount, setTokenAmount] = useState("");
  const [eurcAmount, setEurcAmount] = useState("");
  const [eurcBalance, setEurcBalance] = useState(0n);
  const [eurcAllowance, setEurcAllowance] = useState(0n);
  const [tokenBalance, setTokenBalance] = useState(0n);
  const [remainingTokens, setRemainingTokens] = useState(0n);
  const [tokenHolders, setTokenHolders] = useState<
    { address: string; balance: bigint }[]
  >([]);
  const supabase = createClientComponentClient<Database>();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { data: contractData, isLoading: isContractLoading } = useContractReads({
    contracts: [
      {
        address: tokenAddress as `0x${string}`,
        abi: propertyTokenABI,
        functionName: 'propertyDetails',
      },
      {
        address: tokenAddress as `0x${string}`,
        abi: propertyTokenABI,
        functionName: 'balanceOf',
        args: [address || '0x0000000000000000000000000000000000000000'],
      },
      {
        address: tokenAddress as `0x${string}`,
        abi: propertyTokenABI,
        functionName: 'name',
      },
      {
        address: tokenAddress as `0x${string}`,
        abi: propertyTokenABI,
        functionName: 'symbol',
      },
      {
        address: tokenAddress as `0x${string}`,
        abi: propertyTokenABI,
        functionName: 'totalSupply',
      },
      {
        address: process.env.NEXT_PUBLIC_EURC_TOKEN_ADDRESS as `0x${string}`,
        abi: mockEURCABI,
        functionName: 'balanceOf',
        args: [address || '0x0000000000000000000000000000000000000000'],
      },
    ],
    watch: true,
    enabled: !!tokenAddress && !!address,
  });
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [sellLoading, setSellLoading] = useState(false);

  useEffect(() => {
    const fetchPropertyData = async () => {
      if (!tokenAddress) return;
      
      try {
        // Fetch property details from Supabase
        const { data: property, error } = await supabase
          .from('property_requests')
          .select('*')
          .eq('token_address', tokenAddress)
          .single();

        if (error) throw error;
        if (property) {
          setPropertyDetails(property);
        }
      } catch (error) {
        console.error('Error fetching property details:', error);
        toast({
          title: "Error",
          description: "Failed to fetch property details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPropertyData();
  }, [tokenAddress]);

  useEffect(() => {
    if (contractData && !isContractLoading) {
      const [propertyDetailsResult, balance, name, symbol, totalSupply, eurcBalance] = contractData;
      
      console.log("🔥 Contract Data Status:", {
        propertyDetails: propertyDetailsResult?.status,
        balance: balance?.status,
        name: name?.status,
        symbol: symbol?.status,
        totalSupply: totalSupply?.status,
        eurcBalance: eurcBalance?.status
      });

      console.log("💋 Raw Property Details:", propertyDetailsResult);
      
      if (propertyDetailsResult?.status === 'success' && propertyDetailsResult.result) {
        // The struct fields come back in the order they're defined in the contract:
        // struct PropertyDetails {
        //     string title;
        //     string description;
        //     string location;
        //     string imageUrl;
        //     uint256 price;
        //     bool isActive;
        // }
        const [title, description, location, imageUrl, price, isActive] = propertyDetailsResult.result;
        
        console.log("🎀 Property Details:", {
          title,
          description,
          location,
          imageUrl,
          price: typeof price === 'bigint' ? price.toString() : 
                 typeof price === 'number' ? price.toString() : 
                 price?.toString() || '0',
          isActive
        });

        // Make sure to handle price as BigInt
        const priceBigInt = typeof price === 'bigint' ? price :
                           price ? BigInt(price.toString()) : 
                           BigInt(0);
        
        console.log("💎 Price BigInt:", priceBigInt.toString());
        console.log("💰 Price in EURC:", formatUnits(priceBigInt, 6));

        setOnChainDetails({
          price: priceBigInt,
          isActive: !!isActive,
          title: title || "",
          description: description || "",
          location: location || "",
          imageUrl: imageUrl || "",
          name: name?.result || "",
          symbol: symbol?.result || "",
          totalSupply: totalSupply?.result || BigInt(0)
        });

        if (priceBigInt > BigInt(0) && tokenAmount) {
          try {
            const calculatedEurcAmount = Number(tokenAmount) * Number(formatUnits(priceBigInt, 6));
            setEurcAmount(calculatedEurcAmount.toString());
            console.log("💸 Calculated EURC Amount:", calculatedEurcAmount);
          } catch (error) {
            console.error("💔 Error calculating EURC amount:", error);
          }
        }
      } else {
        console.error("🚨 Property details failed:", propertyDetailsResult?.error);
      }

      if (balance?.status === 'success' && balance.result !== undefined) {
        setTokenBalance(balance.result);
      }

      if (eurcBalance?.status === 'success' && eurcBalance.result !== undefined) {
        setEurcBalance(eurcBalance.result);
      }
    }
  }, [contractData, isContractLoading, tokenAmount]);

  useEffect(() => {
    if (tokenAddress && address) {
      fetchTokenHolders();
    }
  }, [tokenAddress, address]);

  const fetchTokenHolders = async () => {
    if (!address || !tokenAddress) return;

    try {
      const propertyContract = {
        address: tokenAddress as `0x${string}`,
        abi: propertyTokenABI,
      };

      // Get Transfer events from the beginning
      const transferEvents = await publicClient.getContractEvents({
        address: tokenAddress as `0x${string}`,
        abi: propertyTokenABI,
        eventName: "Transfer",
        fromBlock: 0n,
        toBlock: "latest",
      });

      // Get unique addresses from transfer events
      const uniqueAddresses = new Set<string>();
      transferEvents.forEach((event) => {
        if (event.args.from) uniqueAddresses.add(event.args.from.toLowerCase());
        if (event.args.to) uniqueAddresses.add(event.args.to.toLowerCase());
      });

      // Remove zero address and get balances
      uniqueAddresses.delete("0x0000000000000000000000000000000000000000");

      const holderPromises = Array.from(uniqueAddresses).map(
        async (holderAddress) => {
          const balance = await publicClient.readContract({
            ...propertyContract,
            functionName: "balanceOf",
            args: [holderAddress as `0x${string}`],
          });

          return {
            address: holderAddress,
            balance: balance as bigint,
          };
        }
      );

      const holders = await Promise.all(holderPromises);

      // Filter out zero balances and sort by balance
      const activeHolders = holders
        .filter((holder) => holder.balance > 0n)
        .sort((a, b) => (b.balance > a.balance ? 1 : -1));

      setTokenHolders(activeHolders);
    } catch (error) {
      console.error("Error fetching token holders:", error);
      toast({
        title: "Error",
        description: "Failed to fetch token holders",
        variant: "destructive",
      });
    }
  };

  const handleTokenAmountChange = (value: string) => {
    setTokenAmount(value);
    if (onChainDetails?.price) {
      const calculatedEurcAmount = Number(value) * Number(formatUnits(onChainDetails.price, 6));
      setEurcAmount(calculatedEurcAmount.toString());
    }
  };

  const handleEurcAmountChange = (value: string) => {
    setEurcAmount(value);
    if (onChainDetails?.price) {
      const pricePerToken = Number(formatUnits(onChainDetails.price, 6));
      const calculatedTokenAmount = Number(value) / pricePerToken;
      setTokenAmount(calculatedTokenAmount.toString());
    }
  };

  const handlePurchaseTokens = async () => {
    if (!walletClient || !address || !tokenAmount) {
      toast({
        title: "Error",
        description: "Please connect your wallet and enter a token amount",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check whitelist status first
      const isWhitelisted = await publicClient.readContract({
        address: process.env.NEXT_PUBLIC_WHITELIST_PROXY_ADDRESS as `0x${string}`,
        abi: whitelistABI,
        functionName: "isWhitelisted",
        args: [address],
      });

      console.log("Whitelist check:", {
        address,
        isWhitelisted,
        whitelistContract: process.env.NEXT_PUBLIC_WHITELIST_PROXY_ADDRESS,
      });

      if (!isWhitelisted) {
        toast({
          title: "Error",
          description: "Your address is not whitelisted. Please contact the administrator to get whitelisted.",
          variant: "destructive",
        });
        return;
      }

      // Get the current nonce
      let nonce = await publicClient.getTransactionCount({
        address: address,
      });

      console.log("Current nonce for purchase:", nonce);

      // Convert token amount to string before parsing
      const tokenAmountBigInt = parseUnits(tokenAmount.toString(), 18);
      const priceInEurc = BigInt(onChainDetails.price);
      const calculatedEurcAmount = (tokenAmountBigInt * priceInEurc) / BigInt(10 ** 18);

      console.log("Purchase calculations:", {
        tokenAmount,
        tokenAmountInWei: tokenAmountBigInt.toString(),
        pricePerToken: formatUnits(priceInEurc, 6),
        calculatedEurcAmount: calculatedEurcAmount.toString(),
        calculatedEurcFormatted: formatUnits(calculatedEurcAmount, 6),
      });

      // Check EURC balance
      const eurcBalance = await publicClient.readContract({
        address: process.env.NEXT_PUBLIC_EURC_TOKEN_ADDRESS as `0x${string}`,
        abi: mockEURCABI,
        functionName: "balanceOf",
        args: [address],
      });

      console.log("EURC Balance:", {
        balance: eurcBalance.toString(),
        formattedBalance: formatUnits(eurcBalance as bigint, 6),
        needed: formatUnits(calculatedEurcAmount, 6),
      });

      if (eurcBalance < calculatedEurcAmount) {
        throw new Error(`Insufficient EURC balance. You have ${formatUnits(eurcBalance as bigint, 6)} EURC but need ${formatUnits(calculatedEurcAmount, 6)} EURC`);
      }

      // Check EURC allowance for the property token contract
      const allowance = await publicClient.readContract({
        address: process.env.NEXT_PUBLIC_EURC_TOKEN_ADDRESS as `0x${string}`,
        abi: mockEURCABI,
        functionName: "allowance",
        args: [address, tokenAddress as `0x${string}`],
      });

      console.log("EURC Allowance:", {
        allowance: allowance.toString(),
        formattedAllowance: formatUnits(allowance as bigint, 6),
        needed: formatUnits(calculatedEurcAmount, 6),
      });

      // If allowance is insufficient, request approval
      if (allowance < calculatedEurcAmount) {
        console.log("Insufficient allowance, requesting approval...");
        const { request: approvalRequest } = await publicClient.simulateContract({
          address: process.env.NEXT_PUBLIC_EURC_TOKEN_ADDRESS as `0x${string}`,
          abi: mockEURCABI,
          functionName: "approve",
          args: [tokenAddress as `0x${string}`, calculatedEurcAmount],
          account: address,
        });

        const approvalHash = await walletClient.writeContract({
          ...approvalRequest,
          nonce,
        });

        console.log("Approval transaction hash:", approvalHash);

        await publicClient.waitForTransactionReceipt({
          hash: approvalHash,
          timeout: 60_000,
        });

        // Increment nonce for the next transaction
        nonce++;
      }

      // Check if property is active
      const propertyDetails = await publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: propertyTokenABI,
        functionName: "propertyDetails",
      });

      console.log("Property details:", propertyDetails);

      if (!propertyDetails[5]) { // isActive is the 6th field in the struct
        throw new Error("Property is not active for trading");
      }

      // Now purchase tokens
      const { request } = await publicClient.simulateContract({
        address: tokenAddress as `0x${string}`,
        abi: propertyTokenABI,
        functionName: "purchaseTokens",
        args: [tokenAmountBigInt],
        account: address,
      });

      // Execute the transaction with updated nonce
      const hash = await walletClient.writeContract({
        ...request,
        nonce,
      });

      console.log("Purchase transaction hash:", hash);

      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        timeout: 60_000,
      });

      console.log("Purchase transaction receipt:", receipt);

      // Update UI
      await fetchTokenHolders();
      toast({
        title: "Success",
        description: "Tokens purchased successfully",
      });
    } catch (error: any) {
      console.error("Error purchasing tokens:", error);

      // Handle specific error cases based on error signatures
      const errorSignature = error.message?.match(/0x[0-9a-fA-F]{8}/)?.[0];
      if (errorSignature) {
        switch (errorSignature) {
          case "0x584a7938": // NotWhitelisted
            toast({
              title: "Error",
              description: "Your address is not whitelisted. Please contact the administrator to get whitelisted.",
              variant: "destructive",
            });
            return;
          case "0x0c75b613": // InsufficientBalance
            toast({
              title: "Error",
              description: "Insufficient balance to complete the purchase.",
              variant: "destructive",
            });
            return;
          case "0x8c0b5e22": // PropertyInactive
            toast({
              title: "Error",
              description: "This property is not active for trading.",
              variant: "destructive",
            });
            return;
          case "0x13be252b": // InsufficientAllowance
            toast({
              title: "Error",
              description: "Insufficient EURC allowance. Please approve the required amount.",
              variant: "destructive",
            });
            return;
          case "0x90b8ec18": // TransferFailed
            toast({
              title: "Error",
              description: "Token transfer failed. Please try again.",
              variant: "destructive",
            });
            return;
          default:
            break;
        }
      }

      // Handle other errors
      toast({
        title: "Error",
        description: error.message || "Failed to purchase tokens",
        variant: "destructive",
      });
    }
  };

  const sellTokens = async () => {
    if (!walletClient || !tokenAddress || !tokenAmount) return;
    setSellLoading(true);
    try {
      const hash = await walletClient.writeContract({
        address: tokenAddress as `0x${string}`,
        abi: propertyTokenABI,
        functionName: "sellTokens",
        args: [parseUnits(tokenAmount, 18)],
      });
      await publicClient.waitForTransactionReceipt({ hash });
      await fetchTokenHolders();
      setTokenAmount("");
      toast({
        title: "Success",
        description: "Tokens sold successfully",
      });
    } catch (error) {
      console.error("Error selling tokens:", error);
      toast({
        title: "Error",
        description: "Failed to sell tokens",
        variant: "destructive",
      });
    } finally {
      setSellLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Purchase Property Tokens</CardTitle>
          <CardDescription>Purchase tokens for this property using EURC</CardDescription>
        </CardHeader>
        <CardContent>
          {propertyDetails && onChainDetails ? (
            <div className="space-y-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500">PropertyToken Address</h3>
                <p className="mt-1 text-sm text-gray-900 font-mono">{tokenAddress}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Property Image */}
                <div className="aspect-square relative rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <Image
                    src={propertyDetails.image_url || "/images/placeholder-property.jpg"}
                    alt={propertyDetails.title}
                    width={500}
                    height={500}
                    className="object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Property Details */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {propertyDetails.title}
                    </h3>
                    <p className="text-gray-600">
                      {propertyDetails.description}
                    </p>
                    <div className="mt-2 inline-flex items-center bg-gray-100 rounded-full px-3 py-1 text-sm">
                      <MapPinIcon className="h-4 w-4 mr-1" />
                      {propertyDetails.location}
                    </div>
                  </div>

                  {/* Token Information */}
                  <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
                    <h4 className="text-lg font-semibold border-b pb-2">
                      Token Information
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-500">
                            Token Symbol
                          </span>
                          <span className="font-semibold text-blue-600">
                            {onChainDetails?.symbol || "Loading..."}
                          </span>
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-500">
                            Total Supply
                          </span>
                          <span className="font-semibold text-purple-600">
                            {onChainDetails?.totalSupply ? Number(formatUnits(onChainDetails.totalSupply, 18)).toLocaleString() : "0"} Tokens
                          </span>
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-500">
                            Your Balance
                          </span>
                          <span className="font-semibold text-green-600">
                            {tokenBalance ? Number(formatUnits(tokenBalance, 18)).toLocaleString() : "0"} Tokens
                          </span>
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-500">
                            EURC Balance
                          </span>
                          <span className="font-semibold text-green-600">
                            {eurcBalance ? Number(formatUnits(eurcBalance, 6)).toLocaleString() : "0"} EURC
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Purchase Form */}
                    <div className="space-y-4 mt-6">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-sm font-medium text-blue-900">
                            Price per token
                          </span>
                          <span className="text-xl font-bold text-blue-600">
                            {onChainDetails?.price ? formatUnits(onChainDetails.price, 6) : "0"} EURC
                          </span>
                        </div>
                        <div className="space-y-3">
                          <label className="block text-sm font-medium text-gray-700">
                            Amount to Purchase
                          </label>
                          <Input
                            type="number"
                            value={tokenAmount}
                            onChange={(e) =>
                              handleTokenAmountChange(e.target.value)
                            }
                            placeholder="Enter number of tokens"
                            className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            disabled={purchaseLoading}
                          />
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Total Cost:</span>
                            <span className="font-semibold text-blue-600">
                              {eurcAmount} EURC
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-4">
                        <Button
                          onClick={handlePurchaseTokens}
                          disabled={purchaseLoading || !tokenAmount}
                          className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white transition-all duration-200"
                        >
                          {purchaseLoading ? (
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
              <div className="space-y-4">
                <h2 className="text-xl font-bold mb-4">Token Holders</h2>
                <div className="grid gap-4">
                  {tokenHolders.map((holder) => (
                    <div
                      key={holder.address}
                      className="p-4 rounded-lg bg-gray-100"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-mono text-sm break-all">
                            {holder.address}
                          </p>
                          <p className="text-lg font-bold mt-1">
                            {Number(formatUnits(holder.balance, 18)).toLocaleString()} tokens
                          </p>
                        </div>
                        {holder.address.toLowerCase() ===
                          address?.toLowerCase() && (
                          <span className="px-2 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
                            You
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {tokenHolders.length === 0 && (
                    <p className="text-gray-500 text-center">
                      No token holders found
                    </p>
                  )}
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
  );
}
