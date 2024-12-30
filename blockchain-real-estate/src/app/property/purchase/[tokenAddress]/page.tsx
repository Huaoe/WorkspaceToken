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

      // Try a test approval first
      console.log("Testing EURC approval with small amount...");
      const testAmount = parseUnits("1", 6); // 1 EURC
      
      try {
        // Get the current nonce
        const nonce = await publicClient.getTransactionCount({
          address: address as `0x${string}`
        });
        
        console.log("Current nonce:", nonce);

        const { request: testApproveRequest } = await publicClient.simulateContract({
          account: address,
          address: EURC_TOKEN_ADDRESS as `0x${string}`,
          abi: eurcABI,
          functionName: "approve",
          args: [tokenAddress as `0x${string}`, testAmount],
          nonce: nonce // Explicitly set the nonce
        });

        const testApproveHash = await walletClient.writeContract({
          ...testApproveRequest,
          nonce: nonce // Explicitly set the nonce
        });
        console.log("Test approval transaction sent:", testApproveHash);

        const testApproveReceipt = await publicClient.waitForTransactionReceipt({ 
          hash: testApproveHash,
          timeout: 30_000
        });
        console.log("Test approval confirmed:", testApproveReceipt);

        // Verify test approval
        const testAllowance = await publicClient.readContract({
          address: EURC_TOKEN_ADDRESS as `0x${string}`,
          abi: eurcABI,
          functionName: "allowance",
          args: [address, tokenAddress as `0x${string}`],
        });
        console.log("Test approval successful. New allowance:", formatUnits(testAllowance, 6));

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

      } catch (error) {
        console.error("Transaction failed:", error);
        if (error.message?.includes("nonce")) {
          throw new Error("Transaction nonce error. Please reset your MetaMask account: Settings -> Advanced -> Reset Account");
        }
        throw error;
      }

      // Verify the purchase
      const newBalance = await publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: propertyTokenABI,
        functionName: "balanceOf",
        args: [address],
      });

      console.log("New token balance:", formatUnits(newBalance, 18));

      if (newBalance < tokenAmountWei) {
        throw new Error("Purchase verification failed - token balance not updated correctly");
      }

      toast({
        title: "Success",
        description: "Successfully purchased property tokens!"
      });
      router.refresh();
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
          <div>
            <div className="relative h-64 w-full mb-4">
              <Image
                src={onChainDetails.imageUrl || "/placeholder.jpg"}
                alt={onChainDetails.title}
                fill
                className="object-cover rounded-lg"
              />
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Location</h3>
                <p className="text-gray-600">{onChainDetails.location}</p>
              </div>
              <div>
                <h3 className="font-semibold">Investment Details</h3>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <p className="text-sm text-gray-500">Price per Token</p>
                    <p className="font-medium">
                      {onChainDetails?.price
                        ? `${Number(
                            formatUnits(onChainDetails.price, 6)
                          ).toLocaleString()} EURC`
                        : "Loading..."}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Supply</p>
                    <p className="font-medium">
                      {Number(totalSupply).toLocaleString()} Tokens
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Your Balance</p>
                    <p className="font-medium">{tokenBalance} Tokens</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">EURC Balance</p>
                    <p className="font-medium">{formattedEURCBalance} EURC</p>
                  </div>
                  <AddressDisplay
                    address={tokenAddress as string}
                    label="Token Address"
                  />
                  <AddressDisplay
                    address={tokenHolder || ""}
                    label="Token Holder"
                  />
                  <div>
                    <p className="text-sm text-gray-500">Holder Balance</p>
                    <p className="font-medium">
                      {Number(holderBalance).toLocaleString()} Tokens
                    </p>
                  </div>
                  <div className="bg-secondary/50 p-3 rounded-lg">
                    <p className="text-sm text-gray-500">
                      Available for Purchase
                    </p>
                    <p className="font-medium text-primary">
                      {remainingTokens} Tokens
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Max you can buy with current EURC balance:{" "}
                      {maxPurchasableAmount} Tokens
                    </p>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${salesProgress}%` }}
                    ></div>
                  </div>
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
