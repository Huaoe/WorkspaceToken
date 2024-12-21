"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
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
import { PROPERTY_FACTORY_ADDRESS, EURC_TOKEN_ADDRESS } from "@/lib/constants";
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
    isActive: false,
  });
  const [ownerBalance, setOwnerBalance] = useState("0");
  const [propertyDetails, setPropertyDetails] =
    useState<PropertyRequest | null>(null);
  const [totalSupply, setTotalSupply] = useState<string>("0");

  const [owner, setOwner] = useState<string | null>(null);

  const handleTokenAmountChange = (value: string) => {
    setTokenAmount(value);
    if (value && onChainDetails.price) {
      try {
        const amount = Number(value);
        const pricePerToken = Number(formatUnits(onChainDetails.price, 6));
        const totalCost = amount * pricePerToken;
        setEurcAmount(totalCost.toString());
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

  useEffect(() => {
    const fetchSupabaseDetails = async () => {
      if (!tokenAddress) return;

      try {
        // Get property details from Supabase
        const { data, error } = await supabase
          .from("property_requests")
          .select("*")
          .eq("token_address", tokenAddress)
          .single();

        if (error) throw error;
        setPropertyDetails(data);
      } catch (error) {
        console.error("Error fetching property details from Supabase:", error);
        toast({
          title: "Error",
          description: "Failed to fetch property details",
          variant: "destructive",
        });
      }
    };

    fetchSupabaseDetails();
  }, [tokenAddress, toast]);

  const fetchOnChainDetails = async () => {
    if (!address || !propertyTokenContract || !eurcContract) {
      return;
    }

    try {
      // Get token balance
      const balance = await propertyTokenContract.balanceOf(address);
      console.log("User balance:", balance.toString());
      setTokenBalance(formatEther(balance));

      // Get contract owner
      try {
        const contractOwner = await propertyTokenContract.owner();
        console.log("Contract owner:", contractOwner);
        setOwner(contractOwner);

        // Get owner's balance
        const ownerBal = await propertyTokenContract.balanceOf(contractOwner);
        console.log("Owner balance:", ownerBal.toString());
        setOwnerBalance(formatEther(ownerBal));
      } catch (error) {
        console.error("Error fetching owner details:", error);
      }

      // Get total supply
      try {
        const supply = await propertyTokenContract.totalSupply();
        console.log("Total supply fetched:", supply.toString());
        setTotalSupply(formatEther(supply));
      } catch (error) {
        console.error("Error fetching total supply:", error);
      }

      // Get EURC balance
      const eurcBal = await eurcContract.balanceOf(address);
      const formattedBalance = formatUnits(BigInt(eurcBal.toString()), 6);
      setEurcBalance(formattedBalance);

      // Get property details
      try {
        console.log("Fetching property details...");
        const details = await propertyTokenContract.propertyDetails();
        console.log("Raw property details:", details);

        setOnChainDetails({
          title: details.title || "",
          description: details.description || "",
          location: details.location || "",
          imageUrl: details.imageUrl || "",
          price: BigInt(details.price.toString()),
          isActive: details.isActive,
        });
      } catch (error) {
        console.error("Error getting property details:", error);
      }
    } catch (error) {
      console.error("Error fetching on-chain details:", error);
    }
  };

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
      console.log("Starting purchase process...");
      console.log("User address:", address);
      console.log("Property token address:", tokenAddress);

      // Get signer first
      const signer = await getSigner();
      if (!signer) {
        throw new Error("No signer available");
      }
      console.log("Got signer");

      // Get fresh contract instances with signer
      const propertyTokenWithSigner = await getPropertyTokenContract(tokenAddress as string, true);
      const eurcWithSigner = await getEURCContract(EURC_TOKEN_ADDRESS, true);
      console.log("Got contracts with signer");

      // Check if property is active
      const propertyDetails = await propertyTokenWithSigner.propertyDetails();
      if (!propertyDetails.isActive) {
        throw new Error("Property is not active for trading");
      }

      // Calculate amounts in proper decimals
      const amountInWei = parseUnits(tokenAmount, 18); // Convert to 18 decimals for ERC20
      const eurcAmountNeeded = (amountInWei * price) / parseUnits("1", 18);
      console.log("EURC amount needed:", eurcAmountNeeded.toString());

      // Check EURC balance
      const eurcBalance = await eurcWithSigner.balanceOf(address);
      if (eurcBalance < eurcAmountNeeded) {
        throw new Error("Insufficient EURC balance");
      }

      // Check if owner has enough tokens
      const ownerAddress = await propertyTokenWithSigner.owner();
      const ownerBalance = await propertyTokenWithSigner.balanceOf(ownerAddress);
      if (ownerBalance < amountInWei) {
        throw new Error("Owner does not have enough tokens to sell");
      }

      // Get the current nonce
      const provider = await getProvider();
      const currentNonce = await provider.getTransactionCount(address);
      console.log("Current nonce:", currentNonce);

      // First approve EURC spending to the property token contract
      console.log("Approving EURC spend:", eurcAmountNeeded.toString());
      const approveTx = await eurcWithSigner.approve(
        tokenAddress as string,
        eurcAmountNeeded,
        {
          nonce: currentNonce,
        }
      );
      await approveTx.wait();
      console.log("EURC approved");

      // Purchase tokens directly from the property token contract
      console.log("Purchasing tokens:", amountInWei.toString());
      const purchaseTx = await propertyTokenWithSigner.purchaseTokens(
        amountInWei,
        {
          nonce: currentNonce + 1,
        }
      );

      await purchaseTx.wait();
      console.log("Purchase complete");

      toast({
        title: "Success",
        description: `Successfully purchased ${tokenAmount} tokens`,
      });

      // Refresh balances
      await fetchEURCBalance();
      await fetchOnChainDetails();

      // Reset amount inputs
      setTokenAmount("");
      setEurcAmount("");
    } catch (error: any) {
      console.error("Error purchasing tokens:", error);

      // Try to get more detailed error message
      let errorMessage = "Failed to purchase tokens";

      // Handle known error types from the contract
      if (error.message?.includes("NotWhitelisted")) {
        errorMessage =
          "Your address is not whitelisted. Please complete KYC first.";
      } else if (error.message?.includes("InsufficientBalance")) {
        errorMessage = "Insufficient EURC balance for purchase";
      } else if (error.message?.includes("PropertyInactive")) {
        errorMessage = "Property token is not currently active";
      } else if (error.message?.includes("InsufficientAllowance")) {
        errorMessage = "Not enough EURC allowance for purchase";
      } else if (error.message?.includes("TransferFailed")) {
        errorMessage = "EURC transfer failed";
      } else if (error.reason) {
        errorMessage = error.reason;
      } else if (error.message) {
        errorMessage = error.message;
      }

      if (error.data?.message) {
        errorMessage = error.data.message;
      }
      if (error.error?.message) {
        errorMessage = error.error.message;
      }

      toast({
        title: "Error",
        description: errorMessage,
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
                      {Number(formatUnits(onChainDetails.price, 6)).toFixed(2)}{" "}
                      EURC
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
                      {Number(formatUnits(onChainDetails.price, 6)).toFixed(2)}{" "}
                      EURC
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
