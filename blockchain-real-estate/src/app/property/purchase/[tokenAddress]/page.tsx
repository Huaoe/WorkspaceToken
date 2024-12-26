"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { AddressDisplay } from "@/components/ui/address-display";
import { useAccount } from "wagmi";
import {
  getPropertyTokenContract,
  getPropertyFactoryContract,
  getEURCContract,
  getWhitelistContract,
  getProvider,
  getSigner,
} from "@/lib/ethereum";
import { formatUnits, parseUnits, formatEther } from "viem";
import { PROPERTY_FACTORY_ADDRESS } from "@/lib/contracts";
import { EURC_TOKEN_ADDRESS } from "@/lib/contracts";
import { formatEURCAmount } from "@/lib/utils";
import { MapPin as MapPinIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { PropertyRequest } from "@/types/property";
import { ethers } from "ethers";

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
  const [isLoading, setIsLoading] = useState(false);
  const [propertyTokenContract, setPropertyTokenContract] = useState<any>(null);
  const [eurcContract, setEurcContract] = useState<any>(null);
  const [whitelistContract, setWhitelistContract] = useState<any>(null);
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
    if (!address || !eurcContract) return;

    try {
      const balance = await eurcContract.balanceOf(address);
      // EURC has 6 decimals
      const formattedBalance = formatUnits(balance, 6);
      setEurcBalance(formattedBalance);
    } catch (error) {
      console.error("Error fetching EURC balance:", error);
    }
  };

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
    const maxTokens = Number(eurcBalance) / Number(formatUnits(onChainDetails.price, 6));
    // Take the minimum between available balance and holder's balance
    return Math.min(maxTokens, Number(holderBalance)).toFixed(2);
  }, [eurcBalance, onChainDetails?.price, holderBalance]);

  useEffect(() => {
    const initializeContracts = async () => {
      if (!tokenAddress || !isConnected || !address) {
        return;
      }

      try {
        const propertyToken = await getPropertyTokenContract(
          tokenAddress as string
        );
        const eurc = await getEURCContract(EURC_TOKEN_ADDRESS);
        const whitelist = await getWhitelistContract();

        setPropertyTokenContract(propertyToken);
        setEurcContract(eurc);
        setWhitelistContract(whitelist);

        // Fetch initial balances and details
        fetchOnChainDetails();
        fetchEURCBalance();
      } catch (error) {
        console.error("Error initializing contracts:", error);
      }
    };
    initializeContracts();
  }, [tokenAddress, isConnected, address]);

  useEffect(() => {
    if (address && eurcContract) {
      fetchEURCBalance();
      fetchOnChainDetails();
    }
  }, [address, eurcContract]);

  const fetchOnChainDetails = useCallback(async () => {
    if (!propertyTokenContract || !address) return;

    try {
      console.log("Fetching on-chain details...");
      
      // Get token holder
      const factory = await getPropertyFactoryContract();
      const currentHolder = await factory.owner();
      console.log("Token holder (factory owner):", currentHolder);
      setTokenHolder(currentHolder);

      // Get holder balance
      const holderTokenBalance = await propertyTokenContract.balanceOf(currentHolder);
      console.log("Holder balance (raw):", holderTokenBalance.toString());
      console.log("Holder balance (formatted):", formatUnits(holderTokenBalance, 18));
      setHolderBalance(formatUnits(holderTokenBalance, 18));

      // Get property details for price
      const details = await propertyTokenContract.propertyDetails();
      console.log("Property details:", {
        price: formatUnits(details.price, 6),
        isActive: details.isActive
      });
      
      setOnChainDetails({
        title: details.title,
        description: details.description,
        location: details.location,
        imageUrl: details.imageUrl,
        price: BigInt(details.price.toString()),
        isActive: details.isActive
      });

      // Get total supply
      const supply = await propertyTokenContract.totalSupply();
      console.log("Total supply:", formatUnits(supply, 18));
      setTotalSupply(formatUnits(supply, 18));

      // Get user balance
      const balance = await propertyTokenContract.balanceOf(address);
      console.log("User balance:", formatUnits(balance, 18));
      setTokenBalance(formatUnits(balance, 18));

    } catch (error) {
      console.error("Error fetching on-chain details:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch token details",
      });
    }
  }, [propertyTokenContract, address, toast]);

  const handlePurchaseTokens = async () => {
    if (
      !address ||
      !propertyTokenContract ||
      !eurcContract ||
      !tokenAmount ||
      !eurcAmount
    ) {
      return;
    }

    setIsLoading(true);

    try {
      // Get fresh contract instances with signer
      const signer = await getSigner();
      const propertyTokenWithSigner = propertyTokenContract.connect(signer);
      const eurcWithSigner = eurcContract.connect(signer);

      // Get token holder from PropertyToken contract
      const currentHolder = await propertyTokenWithSigner.tokenHolder();
      console.log("Token holder for purchase:", currentHolder);

      console.log("Contract details:", {
        propertyTokenAddress: propertyTokenWithSigner.target,
        eurcAddress: eurcWithSigner.target,
        tokenHolder: currentHolder,
        currentSigner: address,
        price: formatUnits(onChainDetails.price, 6),
        isActive: onChainDetails.isActive,
      });

      // Check balances for all relevant parties
      const [tokenHolderBalance, buyerTokenBalance, buyerEurcBalance] =
        await Promise.all([
          propertyTokenWithSigner.balanceOf(currentHolder), // Token holder's balance
          propertyTokenWithSigner.balanceOf(address), // Buyer's token balance
          eurcWithSigner.balanceOf(address), // Buyer's EURC balance
        ]);

      console.log("Token balances:", {
        tokenHolderBalance: formatUnits(tokenHolderBalance, 18),
        buyerBalance: formatUnits(buyerTokenBalance, 18),
      });

      console.log("EURC balances:", {
        buyerBalance: formatUnits(buyerEurcBalance, 6),
      });

      // Check whitelist status
      const whitelistWithSigner = await getWhitelistContract(true);
      const [holderWhitelisted, buyerWhitelisted] = await Promise.all([
        whitelistWithSigner.isWhitelisted(currentHolder),
        whitelistWithSigner.isWhitelisted(address),
      ]);

      console.log("Whitelist status:", {
        tokenHolder,
        holderWhitelisted,
        buyerAddress: address,
        buyerWhitelisted,
      });

      // Calculate amounts for purchase
      const tokenAmountWei = parseUnits(tokenAmount, 18);
      const eurcAmountWei = (tokenAmountWei * onChainDetails.price) / parseUnits("1", 18);

      console.log("Purchase amounts:", {
        tokenAmount: formatUnits(tokenAmountWei, 18),
        eurcAmount: formatUnits(eurcAmountWei, 6),
        rawEurcAmount: eurcAmountWei.toString(),
      });

      // Verify token holder has enough tokens
      if (tokenHolderBalance < tokenAmountWei) {
        throw new Error(
          `Token holder has insufficient tokens. Available: ${formatUnits(
            tokenHolderBalance,
            18
          )}`
        );
      }

      // Verify buyer has enough EURC
      if (buyerEurcBalance < eurcAmountWei) {
        throw new Error(
          `You have insufficient EURC. Need: ${formatUnits(
            eurcAmountWei,
            6
          )}, Have: ${formatUnits(buyerEurcBalance, 6)}`
        );
      }

      // Check if parties are whitelisted
      if (!holderWhitelisted) {
        throw new Error("Token holder is not whitelisted");
      }
      if (!buyerWhitelisted) {
        throw new Error("Buyer is not whitelisted");
      }

      // Check and set EURC allowance
      const allowance = await eurcWithSigner.allowance(
        address,
        propertyTokenWithSigner.target
      );
      console.log("EURC allowance:", formatUnits(allowance, 6));

      if (allowance < eurcAmountWei) {
        console.log("Approving EURC...");
        const approveTx = await eurcWithSigner.approve(
          propertyTokenWithSigner.target,
          eurcAmountWei,
          {
            gasLimit: 100000,
          }
        );
        await approveTx.wait();
        console.log("EURC approved");
      }

      // Purchase tokens
      console.log("Attempting to purchase tokens...");
      
      // Log transaction details
      const gasEstimate = await propertyTokenWithSigner.purchaseTokens.estimateGas(tokenAmountWei);
      console.log("Gas estimate:", gasEstimate.toString());
      
      // Get current nonce
      const nonce = await signer.getNonce();
      console.log("Current nonce:", nonce);
      
      // Log all parameters
      console.log("Purchase parameters:", {
        tokenAmount: formatUnits(tokenAmountWei, 18),
        from: address,
        to: propertyTokenWithSigner.target,
        tokenHolder: currentHolder,
        allowance: formatUnits(allowance, 6),
        nonce
      });

      const purchaseTx = await propertyTokenWithSigner.purchaseTokens(tokenAmountWei, {
        gasLimit: 500000, // Increased gas limit
        nonce
      });

      console.log("Waiting for purchase confirmation...");
      const receipt = await purchaseTx.wait();
      console.log("Purchase confirmed in block:", receipt?.blockNumber);

      // Get updated balances after purchase
      console.log("Fetching updated balances after purchase...");
      
      // Get new token balance
      const newBalance = await propertyTokenWithSigner.balanceOf(address);
      console.log("New user token balance:", formatUnits(newBalance, 18));
      setTokenBalance(formatUnits(newBalance, 18));

      // Get new EURC balance
      const newEurcBalance = await eurcWithSigner.balanceOf(address);
      console.log("New EURC balance:", formatUnits(newEurcBalance, 6));
      setEurcBalance(formatUnits(newEurcBalance, 6));

      // Get new holder balance
      if (currentHolder) {
        const newHolderBalance = await propertyTokenWithSigner.balanceOf(currentHolder);
        console.log("New holder balance (raw):", newHolderBalance.toString());
        console.log("New holder balance (formatted):", formatUnits(newHolderBalance, 18));
        setHolderBalance(formatUnits(newHolderBalance, 18));
      }

      // Refresh all balances
      await Promise.all([fetchEURCBalance(), fetchOnChainDetails()]);

      toast({
        title: "Success",
        description: `Purchased ${tokenAmount} property tokens`,
      });

      // Reset form
      setTokenAmount("");
      setEurcAmount("");
    } catch (error: any) {
      console.error("Purchase error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to purchase tokens",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
                        ? `${Number(formatUnits(onChainDetails.price, 6)).toLocaleString()} EURC`
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
                    <p className="font-medium">{Number(holderBalance).toLocaleString()} Tokens</p>
                  </div>
                  <div className="bg-secondary/50 p-3 rounded-lg">
                    <p className="text-sm text-gray-500">Available for Purchase</p>
                    <p className="font-medium text-primary">{remainingTokens} Tokens</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Max you can buy with current EURC balance: {maxPurchasableAmount} Tokens
                    </p>
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
                        ? `${Number(formatUnits(onChainDetails.price, 6)).toLocaleString()} EURC`
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
