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

        // Check if property is active
        console.log("Property status:", {
          isActive: details.isActive,
          title: details.title,
          price: details.price.toString(),
        });

        if (!details.isActive) {
          throw new Error("This property is not active for trading.");
        }

        setOnChainDetails({
          title: details.title,
          description: details.description,
          location: details.location,
          imageUrl: details.imageUrl,
          price: BigInt(details.price.toString()),
          owner: details.owner || "",
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
      // Get fresh contract instances with signer
      const propertyTokenWithSigner = await getPropertyTokenContract(
        tokenAddress as string,
        true
      );
      const eurcWithSigner = await getEURCContract(true);
      const details = await propertyTokenWithSigner.propertyDetails();

      // Get factory to find creator (current token holder)
      const factory = await getPropertyFactoryContract();
      const tokenHolder = await factory.owner();

      console.log("Contract details:", {
        propertyTokenAddress: propertyTokenWithSigner.target,
        propertyOwner: await propertyTokenWithSigner.owner(),
        tokenHolder, // Address holding tokens for sale (factory owner for now)
        currentSigner: address,
        price: formatUnits(details.price, 6),
        isActive: details.isActive,
      });

      // Check balances for all relevant parties
      const [tokenHolderBalance, buyerTokenBalance, buyerEurcBalance] =
        await Promise.all([
          propertyTokenWithSigner.balanceOf(tokenHolder), // Token holder's balance
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
        whitelistWithSigner.isWhitelisted(tokenHolder),
        whitelistWithSigner.isWhitelisted(address),
      ]);

      console.log("Whitelist status:", {
        tokenHolder,
        holderWhitelisted,
        buyerAddress: address,
        buyerWhitelisted,
      });

      // Verify network first
      const provider = await getProvider();
      const network = await provider.getNetwork();
      const feeData = await provider.getFeeData();
      console.log("Current network:", network.chainId);
      console.log("Gas price:", formatUnits(feeData.gasPrice || 0n, 'gwei'), "gwei");

      // Verify we're on localhost (hardhat)
      if (network.chainId !== 31337n) {
        throw new Error("Please connect to the Hardhat network (chainId: 31337)");
      }

      // Calculate amounts for purchase
      const tokenAmountWei = parseUnits(tokenAmount, 18);
      const eurcAmountWei = (tokenAmountWei * details.price) / parseUnits("1", 18);

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
        console.log("Approving property token contract to spend EURC:", propertyTokenWithSigner.target);
        
        // Check EURC balance
        const eurcBalance = await eurcWithSigner.balanceOf(address);
        console.log("EURC balance:", formatUnits(eurcBalance, 6));
        
        if (eurcBalance < eurcAmountWei) {
          throw new Error(`Insufficient EURC balance. Need ${formatUnits(eurcAmountWei, 6)} but have ${formatUnits(eurcBalance, 6)}`);
        }

        try {
          // Prepare legacy transaction
          const signer = await getSigner();
          const tx = {
            from: address,
            to: eurcWithSigner.target,
            data: eurcWithSigner.interface.encodeFunctionData("approve", [
              propertyTokenWithSigner.target,
              eurcAmountWei
            ]),
            gasLimit: 100000n,
            gasPrice: feeData.gasPrice,
            nonce: await provider.getTransactionCount(address),
            type: 0, // Legacy transaction type
          };

          console.log("Sending approval transaction:", tx);
          const approveTx = await signer.sendTransaction(tx);
          
          console.log("Waiting for approval confirmation...");
          const receipt = await approveTx.wait();
          console.log("Approval confirmed in block:", receipt?.blockNumber);
          
          // Verify approval
          const newAllowance = await eurcWithSigner.allowance(address, propertyTokenWithSigner.target);
          console.log("New allowance:", formatUnits(newAllowance, 6));
        } catch (error: any) {
          console.error("Approval error details:", {
            error,
            code: error.code,
            message: error.message,
            data: error.data,
          });
          throw error;
        }
      }

      // Purchase tokens
      console.log("Attempting to purchase tokens...");
      try {
        // Prepare legacy transaction
        const signer = await getSigner();
        const purchaseTx = {
          from: address,
          to: propertyTokenWithSigner.target,
          data: propertyTokenWithSigner.interface.encodeFunctionData("purchaseTokens", [
            tokenAmountWei
          ]),
          gasLimit: 500000n, // Higher gas limit for purchase
          gasPrice: feeData.gasPrice,
          nonce: await provider.getTransactionCount(address),
          type: 0, // Legacy transaction type
        };

        console.log("Sending purchase transaction:", purchaseTx);
        const tx = await signer.sendTransaction(purchaseTx);
        
        console.log("Waiting for purchase confirmation...");
        const receipt = await tx.wait();
        console.log("Purchase confirmed in block:", receipt?.blockNumber);

        // Verify balances after purchase
        const newBalance = await propertyTokenWithSigner.balanceOf(address);
        console.log("New token balance:", formatUnits(newBalance, 18));

        const newEurcBalance = await eurcWithSigner.balanceOf(address);
        console.log("New EURC balance:", formatUnits(newEurcBalance, 6));

        toast.success("Successfully purchased tokens!");
      } catch (error: any) {
        console.error("Purchase error details:", {
          error,
          code: error.code,
          message: error.message,
          data: error.data,
        });
        throw new Error(`Purchase failed: ${error.message}`);
      }
    } catch (error: any) {
      console.error("Purchase error:", error);
      if (error.message?.includes("user rejected")) {
        throw new Error("Transaction was rejected by user");
      } else {
        throw new Error(`Purchase failed: ${error.message}`);
      }
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
