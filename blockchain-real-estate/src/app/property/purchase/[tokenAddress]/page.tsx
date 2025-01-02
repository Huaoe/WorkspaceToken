"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AddressDisplay } from "@/components/ui/address-display";
import { useToast } from "@/components/ui/use-toast";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import {
  propertyTokenABI,
  eurcABI,
  whitelistABI,
  propertyFactoryABI,
  PROPERTY_FACTORY_ADDRESS,
  EURC_TOKEN_ADDRESS,
  WHITELIST_ADDRESS,
  STAKING_FACTORY_ADDRESS,
  stakingFactoryABI,
} from "@/lib/contracts";
import {
  formatUnits,
  parseUnits,
} from "viem";
import { formatEURCAmount } from "@/lib/utils";
import { MapPin as MapPinIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { PropertyRequest } from "@/types/property";

interface PropertyDetails {
  title: string;
  description: string;
  location: string;
  imageUrl: string;
  price: bigint;
  owner: string;
  isActive: boolean;
}

export default function PurchaseProperty() {
  const { tokenAddress } = useParams();
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [tokenBalance, setTokenBalance] = useState<bigint>(BigInt(0));
  const [eurcBalance, setEurcBalance] = useState<string>("0");
  const [eurcSymbol, setEurcSymbol] = useState<string>("EURC");
  const [tokenAmount, setTokenAmount] = useState<string>("");
  const [eurcAmount, setEurcAmount] = useState<string>("");
  const [onChainDetails, setOnChainDetails] = useState<PropertyDetails>({
    title: "",
    description: "",
    location: "",
    imageUrl: "",
    price: BigInt(0),
    owner: "",
    isActive: false,
  });
  const [ownerBalance, setOwnerBalance] = useState("0");
  const [propertyDetails, setPropertyDetails] =
    useState<PropertyRequest | null>(null);
  const [totalSupply, setTotalSupply] = useState<string>("0");
  const [tokenHolder, setTokenHolder] = useState<string | null>(null);
  const [holderBalance, setHolderBalance] = useState<string>("0");
  const [owner, setOwner] = useState<string | null>(null);
  const [stakingContract, setStakingContract] = useState<string | null>(null);
  const [apr, setApr] = useState<number | null>(null);

  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const handleTokenAmountChange = (value: string) => {
    setTokenAmount(value);
    if (value && onChainDetails.price) {
      try {
        // Convert token amount to BigInt with 18 decimals
        const tokenAmountInWei = parseUnits(value, 18);

        // Calculate total cost in EURC (6 decimals)
        // totalCost = (tokenAmount * price) / 10^18
        const totalCostInEURC =
          (tokenAmountInWei * onChainDetails.price) / parseUnits("1", 18);

        setEurcAmount(formatUnits(totalCostInEURC, 6));
      } catch (error) {
        console.error("Error calculating EURC amount:", error);
        setEurcAmount("0");
      }
    } else {
      setEurcAmount("0");
    }
  };

  const fetchEURCBalance = async () => {
    if (!address) return;

    try {
      const balance = await publicClient.readContract({
        address: EURC_TOKEN_ADDRESS as `0x${string}`,
        abi: eurcABI,
        functionName: "balanceOf",
        args: [address],
      });
      
      // EURC has 6 decimals
      const formattedBalance = formatUnits(balance, 6);
      setEurcBalance(formattedBalance);
    } catch (error) {
      console.error("Error fetching EURC balance:", error);
    }
  };

  const fetchOnChainDetails = useCallback(async () => {
    if (!tokenAddress || !address) return;

    try {
      console.log("Fetching on-chain details...");

      // Get token holder (factory owner)
      const currentHolder = await publicClient.readContract({
        address: PROPERTY_FACTORY_ADDRESS as `0x${string}`,
        abi: propertyFactoryABI,
        functionName: "owner",
      });
      console.log("Token holder (factory owner):", currentHolder);
      setTokenHolder(currentHolder);

      // Get holder balance
      const holderTokenBalance = await publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: propertyTokenABI,
        functionName: "balanceOf",
        args: [currentHolder],
      });
      console.log("Holder balance (raw):", holderTokenBalance.toString());
      console.log(
        "Holder balance (formatted):",
        formatUnits(holderTokenBalance, 18)
      );
      setHolderBalance(formatUnits(holderTokenBalance, 18));

      // Get property details for price
      const details = await publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: propertyTokenABI,
        functionName: "propertyDetails",
      }) as [string, string, string, string, bigint, boolean];

      console.log("Property details:", {
        price: formatUnits(details[4], 18),
        priceWei: details[4].toString(),
        isActive: details[5]
      });

      if (!details[5]) { // isActive is at index 5
        throw new Error("This property is not active for purchase");
      }

      setOnChainDetails({
        title: details[0],
        description: details[1],
        location: details[2],
        imageUrl: details[3],
        price: details[4],
        isActive: details[5],
      });

      // Get total supply
      const supply = await publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: propertyTokenABI,
        functionName: "totalSupply",
      });
      console.log("Total supply:", formatUnits(supply, 18));
      setTotalSupply(formatUnits(supply, 18));

      // Get user balance
      const balance = await publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: propertyTokenABI,
        functionName: "balanceOf",
        args: [address],
      });
      console.log("User balance:", formatUnits(balance, 18));
      setTokenBalance(balance);
    } catch (error) {
      console.error("Error fetching on-chain details:", error);
      toast({
        title: "Error",
        description: "Failed to fetch token details",
      });
    }
  }, [tokenAddress, address, toast, publicClient]);

  // Fetch staking contract and APR
  useEffect(() => {
    async function fetchStakingInfo() {
      if (!tokenAddress || !publicClient) return;

      try {
        // Get staking contract address from factory
        const stakingAddress = await publicClient.readContract({
          address: STAKING_FACTORY_ADDRESS as `0x${string}`,
          abi: stakingFactoryABI,
          functionName: "getStakingContracts",
          args: [tokenAddress as `0x${string}`],
        });

        setStakingContract(stakingAddress);

        // Fetch APR from Supabase
        const { data: propertyData, error } = await supabase
          .from('property_requests')
          .select('roi')
          .eq('token_address', tokenAddress)
          .single();

        if (error) {
          console.error('Error fetching APR from Supabase:', error);
          // Try fetching from properties table as fallback
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('properties')
            .select('roi')
            .eq('token_address', tokenAddress)
            .single();

          if (fallbackError) {
            console.error('Error fetching APR from fallback:', fallbackError);
            return;
          }

          if (fallbackData?.roi) {
            console.log('APR from properties table:', fallbackData.roi);
            setApr(fallbackData.roi);
          }
          return;
        }

        if (propertyData?.roi) {
          console.log('APR from property_requests:', propertyData.roi);
          setApr(propertyData.roi);
        } else {
          console.log('No APR found for this property');
          setApr(null);
        }

      } catch (error) {
        console.error("Error fetching staking info:", error);
      }
    }

    fetchStakingInfo();
  }, [tokenAddress, publicClient]);

  // Format APR with proper locale
  const formattedApr = useMemo(() => {
    if (apr === null) return 'Not available';
    return new Intl.NumberFormat(undefined, {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(apr / 100);
  }, [apr]);

  const handlePurchaseTokens = async () => {
    if (
      !address ||
      !tokenAddress ||
      !walletClient ||
      !tokenAmount ||
      !eurcAmount
    ) {
      console.log("Missing required data:", {
        address,
        tokenAddress,
        walletClient,
        tokenAmount,
        eurcAmount,
      });
      return;
    }

    setIsLoading(true);

    try {
      // Get property details and whitelist contract
      const [details, whitelistContractAddress, tokenHolder] = await Promise.all([
        publicClient.readContract({
          address: tokenAddress as `0x${string}`,
          abi: propertyTokenABI,
          functionName: "propertyDetails",
        }),
        publicClient.readContract({
          address: tokenAddress as `0x${string}`,
          abi: propertyTokenABI,
          functionName: "whitelistContract",
        }),
        publicClient.readContract({
          address: tokenAddress as `0x${string}`,
          abi: propertyTokenABI,
          functionName: "tokenHolder",
        })
      ]);

      console.log("Contract addresses:", {
        propertyToken: tokenAddress,
        whitelist: whitelistContractAddress,
        eurc: EURC_TOKEN_ADDRESS,
        tokenHolder,
        user: address
      });

      console.log("Property details:", {
        price: formatUnits(details[4], 18),
        priceWei: details[4].toString(),
        isActive: details[5]
      });

      if (!details[5]) { // isActive is at index 5
        throw new Error("This property is not active for purchase");
      }

      // Check if user is whitelisted
      const isWhitelisted = await publicClient.readContract({
        address: whitelistContractAddress as `0x${string}`,
        abi: whitelistABI,
        functionName: "isWhitelisted",
        args: [address],
      });

      if (!isWhitelisted) {
        throw new Error("You must be whitelisted to purchase property tokens");
      }

      // Convert token amount to wei (18 decimals)
      const tokenAmountWei = parseUnits(tokenAmount, 18);
      const pricePerToken = details[4]; // price from property details

      // Calculate EURC amount (6 decimals)
      // Since price is in EURC decimals (6) and tokenAmount in property decimals (18)
      // We need to adjust the calculation to get the final amount in EURC decimals (6)
      const totalCost = (tokenAmountWei * pricePerToken) / parseUnits("1", 18);

      console.log("Purchase amounts:", {
        tokenAmount,
        tokenAmountWei: tokenAmountWei.toString(),
        pricePerToken: formatUnits(pricePerToken, 6),
        totalCost: formatUnits(totalCost, 6),
        totalCostWei: totalCost.toString()
      });

      // First verify contracts
      console.log("Verifying contracts...");
      
      // Check EURC contract
      const [eurcName, eurcSymbol, eurcDecimals] = await Promise.all([
        publicClient.readContract({
          address: EURC_TOKEN_ADDRESS as `0x${string}`,
          abi: eurcABI,
          functionName: "name",
        }),
        publicClient.readContract({
          address: EURC_TOKEN_ADDRESS as `0x${string}`,
          abi: eurcABI,
          functionName: "symbol",
        }),
        publicClient.readContract({
          address: EURC_TOKEN_ADDRESS as `0x${string}`,
          abi: eurcABI,
          functionName: "decimals",
        })
      ]);

      console.log("EURC Contract verified:", {
        address: EURC_TOKEN_ADDRESS,
        name: eurcName,
        symbol: eurcSymbol,
        decimals: Number(eurcDecimals)
      });

      // Check EURC balances and allowances
      const [balance, allowance] = await Promise.all([
        publicClient.readContract({
          address: EURC_TOKEN_ADDRESS as `0x${string}`,
          abi: eurcABI,
          functionName: "balanceOf",
          args: [address],
        }),
        publicClient.readContract({
          address: EURC_TOKEN_ADDRESS as `0x${string}`,
          abi: eurcABI,
          functionName: "allowance",
          args: [address, tokenAddress as `0x${string}`],
        })
      ]);

      console.log("EURC token details:", {
        balance: formatUnits(balance, 6),
        balanceWei: balance.toString(),
        allowance: formatUnits(allowance, 6),
        allowanceWei: allowance.toString(),
        required: formatUnits(totalCost, 6),
        requiredWei: totalCost.toString()
      });

      // Check if user has enough EURC
      if (balance < totalCost) {
        throw new Error(`Insufficient EURC balance. You have ${formatUnits(balance, 6)} EURC but need ${formatUnits(totalCost, 6)} EURC. Please acquire more EURC tokens.`);
      }

      
      try {
        // Get the current nonce
        const nonce = await publicClient.getTransactionCount({
          address: address as `0x${string}`
        });
        
        console.log("Current nonce:", nonce);
        // Now proceed with full approval
        console.log("Proceeding with full approval...");

        // Get the next nonce
        const nextNonce = await publicClient.getTransactionCount({
          address: address as `0x${string}`
        });

        const { request: approveRequest } = await publicClient.simulateContract({
          account: address,
          address: EURC_TOKEN_ADDRESS as `0x${string}`,
          abi: eurcABI,
          functionName: "approve",
          args: [tokenAddress as `0x${string}`, totalCost],
          nonce: nextNonce // Use the next nonce
        });

        const approveHash = await walletClient.writeContract({
          ...approveRequest,
          nonce: nextNonce // Use the next nonce
        });
        console.log("EURC approval transaction sent:", approveHash);

        const approveReceipt = await publicClient.waitForTransactionReceipt({ 
          hash: approveHash,
          timeout: 30_000
        });
        console.log("EURC approval confirmed:", approveReceipt);

        // Get final nonce for purchase
        const purchaseNonce = await publicClient.getTransactionCount({
          address: address as `0x${string}`
        });

        // Now purchase tokens
        console.log("Purchasing tokens...");
        const { request: purchaseRequest } = await publicClient.simulateContract({
          account: address,
          address: tokenAddress as `0x${string}`,
          abi: propertyTokenABI,
          functionName: "purchaseTokens",
          args: [tokenAmountWei],
          nonce: purchaseNonce // Use the final nonce
        });

        const purchaseHash = await walletClient.writeContract({
          ...purchaseRequest,
          nonce: purchaseNonce // Use the final nonce
        });
        console.log("Purchase transaction sent:", purchaseHash);

        const purchaseReceipt = await publicClient.waitForTransactionReceipt({ 
          hash: purchaseHash,
          timeout: 30_000
        });
        console.log("Purchase confirmed:", purchaseReceipt);

        toast({
          title: "Success",
          description: `Successfully purchased ${tokenAmount} tokens!`,
        });

        // Refresh balances and details
        await Promise.all([
          // Refresh token balance
          publicClient.readContract({
            address: tokenAddress as `0x${string}`,
            abi: propertyTokenABI,
            functionName: "balanceOf",
            args: [address],
          }).then(balance => {
            console.log("New token balance:", formatUnits(balance, 18));
            setTokenBalance(balance);
          }),

          // Refresh EURC balance
          publicClient.readContract({
            address: EURC_TOKEN_ADDRESS as `0x${string}`,
            abi: eurcABI,
            functionName: "balanceOf",
            args: [address],
          }).then(balance => {
            setEurcBalance(formatUnits(balance, 6));
          }),

          // Refresh holder balance
          publicClient.readContract({
            address: tokenAddress as `0x${string}`,
            abi: propertyTokenABI,
            functionName: "balanceOf",
            args: [tokenHolder],
          }).then(balance => {
            setHolderBalance(formatUnits(balance, 18));
          }),

          // Refresh total supply
          publicClient.readContract({
            address: tokenAddress as `0x${string}`,
            abi: propertyTokenABI,
            functionName: "totalSupply",
          }).then(supply => {
            setTotalSupply(formatUnits(supply, 18));
          })
        ]);

        // Clear input fields
        setTokenAmount("");
        setEurcAmount("");
      } catch (error) {
        console.error("Transaction failed:", error);
        if (error.message?.includes("nonce")) {
          throw new Error("Transaction nonce error. Please reset your MetaMask account: Settings -> Advanced -> Reset Account");
        }
        throw error;
      }

    } catch (error: any) {
      console.error("Error during purchase:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to purchase tokens",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      fetchOnChainDetails();
      fetchEURCBalance();
    }
  }, [isConnected, address, fetchOnChainDetails]);

  const formattedEURCBalance = useMemo(() => {
    if (!eurcBalance) return "0";
    // Format with 2 decimal places
    return Number(eurcBalance).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, [eurcBalance]);

  const formattedTokenBalance = useMemo(() => {
    // Format with 2 decimal places
    return formatUnits(tokenBalance, 18);
  }, [tokenBalance]);

  const remainingTokens = useMemo(() => {
    if (!holderBalance) return "0";
    return Number(holderBalance).toLocaleString();
  }, [holderBalance]);

  const maxPurchasableAmount = useMemo(() => {
    if (!eurcBalance || !onChainDetails?.price) return "0";
    const maxTokens =
      Number(eurcBalance) / Number(formatUnits(onChainDetails.price, 6));
    // Take the minimum between available balance and holder's balance
    return Math.min(maxTokens, Number(holderBalance)).toFixed(2);
  }, [eurcBalance, onChainDetails?.price, holderBalance]);

  const salesProgress = useMemo(() => {
    if (!holderBalance || !totalSupply) return 0;
    const soldTokens = Number(totalSupply) - Number(holderBalance);
    return (soldTokens / Number(totalSupply)) * 100;
  }, [holderBalance, totalSupply]);

  if (!tokenAddress) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column - Property Image and Details */}
          <div className="space-y-6">
            <div className="relative h-80 w-full">
              <Image
                src={onChainDetails.imageUrl || "/placeholder.jpg"}
                alt={onChainDetails.title}
                fill
                className="object-cover rounded-lg shadow-lg"
              />
            </div>
            
            {/* Property Overview */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-semibold mb-4">{onChainDetails.title}</h2>
              
              {/* Location with icon */}
              <div className="flex items-center space-x-2 mb-4">
                <MapPinIcon className="h-5 w-5 text-gray-500" />
                <span className="text-gray-700">{onChainDetails.location}</span>
              </div>
              
              {/* Description */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">About this property</h3>
                <p className="text-gray-600 whitespace-pre-wrap">{onChainDetails.description}</p>
              </div>

              {/* Property Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Sales Progress</p>
                  <div className="mt-1">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{ width: `${salesProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-sm mt-1 text-gray-600">{salesProgress.toFixed(1)}% Sold</p>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Available Tokens</p>
                  <p className="text-lg font-semibold">{remainingTokens}</p>
                </div>
              </div>

              {/* Investment Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-medium mb-3">Token Metrics</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Price per Token</p>
                      <p className="font-medium">
                        {onChainDetails?.price
                          ? `${Number(formatUnits(onChainDetails.price, 6)).toLocaleString()} EURC`
                          : "Loading..."}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Supply</p>
                      <p className="font-medium">{Number(totalSupply).toLocaleString()} Tokens</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Market Cap</p>
                      <p className="font-medium">
                        {onChainDetails?.price
                          ? `${(Number(formatUnits(onChainDetails.price, 6)) * Number(totalSupply)).toLocaleString()} EURC`
                          : "Loading..."}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Expected APR</p>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium">
                          {formattedApr}
                        </p>
                        {stakingContract && (
                          <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                            Staking Active
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-3">Your Position</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Your Token Balance</p>
                      <p className="font-medium">{Number(formattedTokenBalance).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })} Tokens</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Your EURC Balance</p>
                      <p className="font-medium">{formattedEURCBalance} EURC</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Max Purchasable</p>
                      <p className="font-medium">{maxPurchasableAmount} Tokens</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contract Details */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h3 className="text-lg font-medium mb-3">Contract Information</h3>
                <div className="space-y-3">
                  <AddressDisplay
                    address={tokenAddress as string}
                    label="Token Contract"
                  />
                  <AddressDisplay
                    address={tokenHolder || ""}
                    label="Token Holder"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Purchase Form */}
          <div className="space-y-6">
            <div className="bg-secondary/50 p-6 rounded-lg space-y-4">
              <h3 className="font-semibold text-lg">Purchase Tokens</h3>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="tokenAmount">Amount to Purchase</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="tokenAmount"
                      type="number"
                      min="0"
                      value={tokenAmount}
                      onChange={(e) => handleTokenAmountChange(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">
                      Price per token
                    </span>
                    <span>
                      {onChainDetails?.price
                        ? `${Number(
                            formatUnits(onChainDetails.price, 6)
                          ).toLocaleString()} EURC`
                        : "Loading..."}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Cost</span>
                    <span className="font-medium">{eurcAmount} EURC</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">
                      Your EURC Balance
                    </span>
                    <span>{formattedEURCBalance} EURC</span>
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    className="w-full"
                    onClick={handlePurchaseTokens}
                    disabled={
                      !isConnected ||
                      !tokenAmount ||
                      parseFloat(tokenAmount) <= 0
                    }
                  >
                    {isLoading ? (
                      <span>Processing...</span>
                    ) : !isConnected ? (
                      <span>Connect Wallet</span>
                    ) : (
                      <span>Purchase Tokens</span>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
