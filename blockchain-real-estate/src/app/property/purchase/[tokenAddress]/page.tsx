"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
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
import Image from "next/image";
import { propertyTokenABI, mockEURCABI } from "@/lib/contracts";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/lib/database.types";
import { PropertyRequest } from "@/types/property";

export default function PurchaseProperty() {
  const { tokenAddress } = useParams();
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [propertyDetails, setPropertyDetails] =
    useState<PropertyRequest | null>(null);
  const [tokenAmount, setTokenAmount] = useState("");
  const [eurcAmount, setEurcAmount] = useState("");
  const [eurcBalance, setEurcBalance] = useState(0n);
  const [eurcAllowance, setEurcAllowance] = useState(0n);
  const [tokenBalance, setTokenBalance] = useState(0n);
  const [remainingTokens, setRemainingTokens] = useState(0n);
  const [onChainDetails, setOnChainDetails] = useState<any>(null);
  const [tokenHolders, setTokenHolders] = useState<
    { address: string; balance: bigint }[]
  >([]);
  const supabase = createClientComponentClient<Database>();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const fetchPropertyDetails = async () => {
    if (!address || !tokenAddress) return;
    setLoading(true);
    try {
      // Fetch on-chain data first
      const propertyContract = {
        address: tokenAddress as `0x${string}`,
        abi: propertyTokenABI,
      };

      const eurcContract = {
        address: process.env.NEXT_PUBLIC_EURC_TOKEN_ADDRESS as `0x${string}`,
        abi: mockEURCABI,
      };

      const [
        tokenName,
        tokenSymbol,
        totalSupply,
        userBalance,
        userEurcBalance,
        userEurcAllowance,
        remainingTokens,
        price,
      ] = await Promise.all([
        publicClient.readContract({
          ...propertyContract,
          functionName: "name",
        }),
        publicClient.readContract({
          ...propertyContract,
          functionName: "symbol",
        }),
        publicClient.readContract({
          ...propertyContract,
          functionName: "totalSupply",
        }),
        publicClient.readContract({
          ...propertyContract,
          functionName: "balanceOf",
          args: [address],
        }),
        publicClient.readContract({
          ...eurcContract,
          functionName: "balanceOf",
          args: [address],
        }),
        publicClient.readContract({
          ...eurcContract,
          functionName: "allowance",
          args: [address, tokenAddress as `0x${string}`],
        }),
        publicClient.readContract({
          ...propertyContract,
          functionName: "getTotalCirculatingBalance",
        }),
        publicClient.readContract({
          ...propertyContract,
          functionName: "getPrice",
        }),
      ]);
      console.log("Your balanace:", userBalance);
      console.log("Remaining tokens:", remainingTokens);

      // Calculate remaining tokens available for purchase (total - circulating)
      const remaining = Number(formatUnits(remainingTokens, 0));

      // Try to fetch Supabase data, but don't fail if it's not available
      try {
        const { data: property, error } = await supabase
          .from("property_requests")
          .select("*")
          .eq("token_address", tokenAddress)
          .single();

        if (property && !error) {
          setPropertyDetails(property as PropertyRequest);
        } else {
          // Set default property details if no Supabase data
          setPropertyDetails({
            id: tokenAddress as string,
            created_at: new Date().toISOString(),
            owner_address: address,
            title: tokenName,
            description: "Property token details not available",
            location: "Location not specified",
            image_url: "/images/placeholder-property.jpg",
            expected_price: Number(formatUnits(price, 6)),
            latitude: 0,
            longitude: 0,
            status: "live",
            token_address: tokenAddress as string,
          });
        }
      } catch (supabaseError) {
        console.log("Supabase data not available:", supabaseError);
        // Set default property details if Supabase fails
        setPropertyDetails({
          id: tokenAddress as string,
          created_at: new Date().toISOString(),
          owner_address: address,
          title: tokenName,
          description: "Property token details not available",
          location: "Location not specified",
          image_url: "/images/placeholder-property.jpg",
          expected_price: Number(formatUnits(price, 6)),
          latitude: 0,
          longitude: 0,
          status: "live",
          token_address: tokenAddress as string,
        });
      }

      setOnChainDetails({
        name: tokenName,
        symbol: tokenSymbol,
        totalSupply: totalSupply,
        price: price,
      });

      setTokenBalance(formatUnits(userBalance, 18));
      setEurcBalance(userEurcBalance);
      setEurcAllowance(userEurcAllowance);
      setRemainingTokens(formatUnits(remainingTokens, 18));
    } catch (error) {
      console.error("Error fetching details:", error);
      toast({
        title: "Error",
        description: "Failed to fetch token details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    if (tokenAddress && address) {
      fetchPropertyDetails();
      fetchTokenHolders();
    }
  }, [tokenAddress, address]);

  const handleTokenAmountChange = (value: string) => {
    setTokenAmount(value);
    const calculatedEurcAmount =
      Number(value) * (propertyDetails?.expected_price || 5);
    setEurcAmount(calculatedEurcAmount.toString());
  };

  const approveEurc = async () => {
    if (!walletClient || !address || !tokenAmount || !onChainDetails?.price) {
      toast({
        title: "Error",
        description: "Missing required information for approval",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Calculate EURC amount needed (considering 6 decimals for EURC)
      const tokenAmountBigInt = parseUnits(tokenAmount, 18);
      const eurcAmount =
        (tokenAmountBigInt * BigInt(onChainDetails.price)) / BigInt(10 ** 12); // Adjust for decimal difference (18 - 6)

      console.log("Debug - Approval calculation:", {
        tokenAmount,
        tokenAmountBigInt: tokenAmountBigInt.toString(),
        price: onChainDetails.price.toString(),
        calculatedEurcAmount: eurcAmount.toString(),
        calculatedEurcFormatted: formatUnits(eurcAmount, 6),
      });

      const { request } = await publicClient.simulateContract({
        address: process.env.NEXT_PUBLIC_EURC_TOKEN_ADDRESS as `0x${string}`,
        abi: mockEURCABI,
        functionName: "approve",
        args: [tokenAddress, eurcAmount],
        account: address,
      });

      // Execute the transaction
      const hash = await walletClient.writeContract(request);
      await publicClient.waitForTransactionReceipt({ hash });

      await fetchPropertyDetails();
      toast({
        title: "Success",
        description: "EURC approved successfully",
      });
    } catch (error: any) {
      console.error("Error approving EURC:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to approve EURC",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  const purchaseTokens = async () => {
    if (!walletClient || !address || !tokenAmount || !onChainDetails?.price) {
      toast({
        title: "Error",
        description: "Missing required information for purchase",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      // Calculate EURC amount needed (considering 6 decimals for EURC)
      const tokenAmountBigInt = parseUnits(tokenAmount, 18);
      const eurcAmount =
        (tokenAmountBigInt * BigInt(onChainDetails.price)) / BigInt(10 ** 12); // Adjust for decimal difference (18 - 6)

      console.log("Debug - Purchase details:", {
        tokenAmount: tokenAmount.toString(),
        eurcAmount: formatUnits(eurcAmount, 6),
        price: formatUnits(onChainDetails.price, 6),
        tokenAddress,
        eurcAddress: process.env.NEXT_PUBLIC_EURC_TOKEN_ADDRESS,
      });

      // Check current EURC allowance
      const currentAllowance = await publicClient.readContract({
        address: process.env.NEXT_PUBLIC_EURC_TOKEN_ADDRESS as `0x${string}`,
        abi: mockEURCABI,
        functionName: "allowance",
        args: [address, tokenAddress],
      });
      console.log(
        "Debug - Current allowance before purchase:",
        formatUnits(currentAllowance, 6),
        "EURC"
      );

      // Check EURC balance
      const balance = await publicClient.readContract({
        address: process.env.NEXT_PUBLIC_EURC_TOKEN_ADDRESS as `0x${string}`,
        abi: mockEURCABI,
        functionName: "balanceOf",
        args: [address],
      });
      console.log(
        "Debug - EURC balance before purchase:",
        formatUnits(balance, 6),
        "EURC"
      );

      // First approve EURC spending if needed
      if (currentAllowance < formatUnits(eurcAmount, 6)) {
        console.log("Debug - Need to approve more EURC:", {
          currentAllowance: formatUnits(currentAllowance, 6),
          neededAmount: formatUnits(eurcAmount, 12),
        });

        const { request: approveRequest } = await publicClient.simulateContract(
          {
            address: process.env
              .NEXT_PUBLIC_EURC_TOKEN_ADDRESS as `0x${string}`,
            abi: mockEURCABI,
            functionName: "approve",
            args: [tokenAddress, formatUnits(eurcAmount, 6)],
            account: address,
          }
        );

        const approveHash = await walletClient.writeContract(approveRequest);
        console.log("Debug - Approval transaction hash:", approveHash);

        const approveReceipt = await publicClient.waitForTransactionReceipt({
          hash: approveHash,
        });
        console.log("Debug - Approval receipt:", approveReceipt);

        // Wait for allowance to be updated and verify
        let retries = 0;
        let newAllowance;
        while (retries < 5) {
          newAllowance = await publicClient.readContract({
            address: process.env
              .NEXT_PUBLIC_EURC_TOKEN_ADDRESS as `0x${string}`,
            abi: mockEURCABI,
            functionName: "allowance",
            args: [address, tokenAddress],
          });
          console.log(
            "Debug - New allowance after approval:",
            formatUnits(newAllowance, 6),
            "EURC"
          );

          if (formatUnits(newAllowance, 6) >= formatUnits(eurcAmount, 12)) {
            break;
          }

          retries++;
          await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 1 second between retries
        }

        if (!newAllowance || formatUnits(newAllowance, 6) < formatUnits(eurcAmount, 12)) {
          console.error(
            "Debug - Failed to increase EURC allowance",
            newAllowance,
            eurcAmount
          );
          throw new Error("Failed to increase EURC allowance");
        }
      }

      // Call purchaseTokens on the PropertyToken contract
      const { request: purchaseRequest } = await publicClient.simulateContract({
        address: tokenAddress as `0x${string}`,
        abi: propertyTokenABI,
        functionName: "purchaseTokens",
        args: [parseUnits(tokenAmount, 18)],
        account: address,
      });

      console.log("Debug - Purchase simulation:", {
        tokenAmount: formatUnits(parseUnits(tokenAmount, 18), 18),
        eurcAmount: formatUnits(eurcAmount, 6),
        contract: tokenAddress,
        args: purchaseRequest.args.map((arg) =>
          typeof arg === "bigint" ? formatUnits(arg, 18) : arg
        ),
      });

      const purchaseHash = await walletClient.writeContract(purchaseRequest);
      console.log("Debug - Purchase transaction hash:", purchaseHash);

      const purchaseReceipt = await publicClient.waitForTransactionReceipt({
        hash: purchaseHash,
      });
      console.log("Debug - Purchase receipt:", {
        status: purchaseReceipt.status,
        blockNumber: purchaseReceipt.blockNumber,
        gasUsed: purchaseReceipt.gasUsed.toString(),
        logs: purchaseReceipt.logs.map((log) => ({
          ...log,
          data: log.data,
          topics: log.topics,
        })),
      });

      await fetchPropertyDetails();
      setTokenAmount("");
      toast({
        title: "Success",
        description: "Tokens purchased successfully",
      });
    } catch (error) {
      console.error("Debug - Error purchasing tokens:", error);
      // Log detailed error information
      if (error.cause) console.error("Debug - Error cause:", error.cause);
      if (error.data) console.error("Debug - Error data:", error.data);
      if (error.message) console.error("Debug - Error message:", error.message);
      toast({
        title: "Error",
        description:
          error.message ||
          "Failed to purchase tokens. Please check the console for details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sellTokens = async () => {
    if (!walletClient || !tokenAddress || !tokenAmount) return;
    try {
      setLoading(true);
      const hash = await walletClient.writeContract({
        address: tokenAddress as `0x${string}`,
        abi: propertyTokenABI,
        functionName: "sellTokens",
        args: [parseUnits(tokenAmount, 18)],
      });
      await publicClient.waitForTransactionReceipt({ hash });
      await fetchPropertyDetails();
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
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Purchase Property Tokens</CardTitle>
          <CardDescription>
            Purchase tokens for this property using EURC
          </CardDescription>
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
                <div className="text-sm text-gray-600 mb-1">
                  PropertyToken Address
                </div>
                <div className="font-mono text-sm break-all">
                  {tokenAddress as string}
                </div>
              </div>
             
              <div className="flex flex-col md:flex-row gap-6">
                {/* Property Image */}
                <div className="w-full md:w-1/2 relative">
                  <div className="aspect-square relative rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <Image
                      src={
                        propertyDetails.image_url ||
                        "/images/placeholder-property.jpg"
                      }
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
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {propertyDetails.title}
                    </h3>
                    <p className="text-gray-600">
                      {propertyDetails.description}
                    </p>
                    <div className="mt-2 inline-flex items-center bg-gray-100 rounded-full px-3 py-1 text-sm">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      {propertyDetails.location}
                    </div>
                  </div>

                  {/* Token Information */}
                  <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
                    <h4 className="text-lg font-semibold border-b pb-2">
                      Token Information
                    </h4>
                    <div className="grid gap-3">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            Token Symbol
                          </span>
                          <span className="font-semibold text-blue-600">
                            {onChainDetails?.symbol}
                          </span>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            Total Supply
                          </span>
                          <span className="font-semibold text-purple-600">
                            {formatUnits(onChainDetails?.totalSupply || 0n, 18)}{" "}
                            Tokens
                          </span>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            Available Tokens
                          </span>
                          <span className="font-semibold text-green-600">
                            {remainingTokens.toString()} Tokens
                          </span>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            Your Balance
                          </span>
                          <span className="font-semibold text-green-600">
                            {tokenBalance.toString()} Tokens
                          </span>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            EURC Balance
                          </span>
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
                          <span className="text-sm font-medium text-blue-900">
                            Price per token
                          </span>
                          <span className="text-xl font-bold text-blue-600">
                            {propertyDetails.expected_price} EURC
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
                            disabled={loading}
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
                            {formatUnits(holder.balance,18)} tokens
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
