"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Address } from "viem";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/lib/database.types";
import { PropertyRequest } from "@/types/property";
import Image from "next/image";
import { Loader2, MapPinIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useWalletEvents } from "@/app/wallet-events-provider";
import { getPropertyTokenContract, getPropertyFactoryContract, getEURCContract, getWhitelistContract } from "@/lib/ethereum";
import { formatEther, parseEther } from "ethers";

export default function PurchaseProperty() {
  const { tokenAddress } = useParams();
  const { address, isConnected } = useWalletEvents();
  const { toast } = useToast();
  const [propertyDetails, setPropertyDetails] = useState<PropertyRequest | null>(null);
  const [onChainDetails, setOnChainDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tokenAmount, setTokenAmount] = useState("");
  const [eurcAmount, setEurcAmount] = useState("");
  const [eurcBalance, setEurcBalance] = useState(0n);
  const [eurcAllowance, setEurcAllowance] = useState(0n);
  const [tokenBalance, setTokenBalance] = useState(0n);
  const [remainingTokens, setRemainingTokens] = useState(0n);
  const [tokenHolders, setTokenHolders] = useState<{ address: string; balance: bigint }[]>([]);
  const supabase = createClientComponentClient<Database>();
  const router = useRouter();

  // Initialize contracts
  const [propertyTokenContract, setPropertyTokenContract] = useState<any>(null);
  const [eurcContract, setEurcContract] = useState<any>(null);
  const [whitelistContract, setWhitelistContract] = useState<any>(null);

  // Initialize contracts
  useEffect(() => {
    const initContracts = async () => {
      try {
        // Get factory contract first to get EURC address
        const factory = await getPropertyFactoryContract();
        const eurcTokenAddress = await factory.paymentToken();
        console.log('EURC token address:', eurcTokenAddress);

        // Initialize other contracts
        const propertyToken = await getPropertyTokenContract(tokenAddress as string);
        const eurc = await getEURCContract(eurcTokenAddress);
        const whitelist = await getWhitelistContract();

        setPropertyTokenContract(propertyToken);
        setEurcContract(eurc);
        setWhitelistContract(whitelist);
      } catch (error) {
        console.error('Error initializing contracts:', error);
        toast({
          title: 'Error',
          description: 'Failed to initialize contracts',
          variant: 'destructive',
        });
      }
    };

    if (tokenAddress) {
      initContracts();
    }
  }, [tokenAddress, toast]);

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
    if (propertyTokenContract && address) {
      const fetchOnChainDetails = async () => {
        try {
          const propertyDetailsResult = await propertyTokenContract.propertyDetails();
          const balance = await propertyTokenContract.balanceOf(address);
          const name = await propertyTokenContract.name();
          const symbol = await propertyTokenContract.symbol();
          const totalSupply = await propertyTokenContract.totalSupply();

          if (propertyDetailsResult) {
            const [title, description, location, imageUrl, price, isActive] = propertyDetailsResult;

            const priceBigInt = typeof price === 'bigint' ? price :
                               price ? BigInt(price.toString()) : 
                               BigInt(0);

            setOnChainDetails({
              price: priceBigInt,
              isActive: !!isActive,
              title: title || "",
              description: description || "",
              location: location || "",
              imageUrl: imageUrl || "",
              name: name || "",
              symbol: symbol || "",
              totalSupply: totalSupply || BigInt(0)
            });

            if (priceBigInt > BigInt(0) && tokenAmount) {
              try {
                const calculatedEurcAmount = Number(tokenAmount) * Number(formatEther(priceBigInt));
                setEurcAmount(calculatedEurcAmount.toString());
              } catch (error) {
                console.error("Error calculating EURC amount:", error);
              }
            }
          }

          if (balance) {
            setTokenBalance(balance);
          }

          if (eurcContract) {
            const eurcBalance = await eurcContract.balanceOf(address);
            setEurcBalance(eurcBalance);
          }
        } catch (error) {
          console.error("Error fetching on-chain details:", error);
        }
      };

      fetchOnChainDetails();
    }
  }, [propertyTokenContract, address, tokenAmount]);

  const handleTokenAmountChange = (value: string) => {
    setTokenAmount(value);
    if (onChainDetails?.price) {
      const calculatedEurcAmount = Number(value) * Number(formatEther(onChainDetails.price));
      setEurcAmount(calculatedEurcAmount.toString());
    }
  };

  const handleEurcAmountChange = (value: string) => {
    setEurcAmount(value);
    if (onChainDetails?.price) {
      const pricePerToken = Number(formatEther(onChainDetails.price));
      const calculatedTokenAmount = Number(value) / pricePerToken;
      setTokenAmount(calculatedTokenAmount.toString());
    }
  };

  const handlePurchaseTokens = async () => {
    if (!address || !tokenAmount) {
      toast({
        title: "Error",
        description: "Please connect your wallet and enter a token amount",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check whitelist status first
      const isWhitelisted = await whitelistContract.isWhitelisted(address);

      if (!isWhitelisted) {
        toast({
          title: "Error",
          description: "Your address is not whitelisted. Please contact the administrator to get whitelisted.",
          variant: "destructive",
        });
        return;
      }

      // Convert token amount to string before parsing
      const tokenAmountBigInt = parseEther(tokenAmount.toString());
      const priceInEurc = onChainDetails.price;
      const calculatedEurcAmount = (tokenAmountBigInt * priceInEurc) / BigInt(10 ** 18);

      // Check property active status first
      const propertyDetails = await propertyTokenContract.propertyDetails();

      if (!propertyDetails[5]) {
        throw new Error("Property is not active for trading");
      }

      // Check EURC balance
      const eurcBalance = await eurcContract.balanceOf(address);

      if (eurcBalance < calculatedEurcAmount) {
        throw new Error(`Insufficient EURC balance. You have ${formatEther(eurcBalance)} EURC but need ${formatEther(calculatedEurcAmount)} EURC`);
      }

      // Check EURC allowance for the property factory contract
      const factory = await getPropertyFactoryContract();
      const factoryAddress = await factory.getAddress();
      
      const allowance = await eurcContract.allowance(address, factoryAddress);

      // If allowance is insufficient, request approval
      if (allowance < calculatedEurcAmount) {
        const approvalTx = await eurcContract.approve(factoryAddress, calculatedEurcAmount);
        await approvalTx.wait();
        
        // Verify new allowance
        const newAllowance = await eurcContract.allowance(address, factoryAddress);
        console.log("New allowance:", formatEther(newAllowance));
      }

      // Now purchase tokens through the factory
      const purchaseTx = await factory.purchasePropertyTokens(tokenAddress, tokenAmountBigInt);
      await purchaseTx.wait();

      // Update UI
      toast({
        title: "Success",
        description: "Tokens purchased successfully",
      });

      // Refresh balances
      const newBalance = await propertyTokenContract.balanceOf(address);
      const newEurcBalance = await eurcContract.balanceOf(address);
      setTokenBalance(newBalance);
      setEurcBalance(newEurcBalance);
      setTokenAmount("");
      setEurcAmount("");

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
                            {onChainDetails?.totalSupply ? Number(formatEther(onChainDetails.totalSupply)).toLocaleString() : "0"} Tokens
                          </span>
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-500">
                            Your Balance
                          </span>
                          <span className="font-semibold text-green-600">
                            {tokenBalance ? Number(formatEther(tokenBalance)).toLocaleString() : "0"} Tokens
                          </span>
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-500">
                            EURC Balance
                          </span>
                          <span className="font-semibold text-green-600">
                            {eurcBalance ? Number(formatEther(eurcBalance)).toLocaleString() : "0"} EURC
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
                            {onChainDetails?.price ? formatEther(onChainDetails.price) : "0"} EURC
                          </span>
                        </div>
                        <div className="space-y-3">
                          <Label>Amount to Purchase</Label>
                          <Input
                            type="number"
                            value={tokenAmount}
                            onChange={(e) => handleTokenAmountChange(e.target.value)}
                            placeholder="Enter number of tokens"
                            className="w-full"
                          />
                          <div className="text-sm text-gray-500">
                            Total Cost: {eurcAmount} EURC
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={handlePurchaseTokens}
                        className="w-full"
                        disabled={!isConnected || !tokenAmount || Number(tokenAmount) <= 0}
                      >
                        Purchase Tokens
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Property details not found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
