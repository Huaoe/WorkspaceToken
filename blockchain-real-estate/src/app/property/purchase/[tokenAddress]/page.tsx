'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAccount } from 'wagmi';
import { getPropertyTokenContract, getPropertyFactoryContract, getEURCContract, getWhitelistContract, getProvider, getSigner } from '@/lib/ethereum';
import { formatUnits, parseUnits } from 'viem';
import { PROPERTY_FACTORY_ADDRESS, EURC_TOKEN_ADDRESS } from '@/lib/constants';
import { formatEURCAmount } from '@/lib/utils';
import { MapPin as MapPinIcon } from 'lucide-react';

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
  const [eurcBalance, setEurcBalance] = useState<string>('0');
  const [eurcSymbol, setEurcSymbol] = useState<string>('EURC');
  const [tokenAmount, setTokenAmount] = useState<string>('');
  const [eurcAmount, setEurcAmount] = useState<string>('');
  const [onChainDetails, setOnChainDetails] = useState<PropertyDetails>({
    title: '',
    description: '',
    location: '',
    imageUrl: '',
    price: BigInt(0),
    isActive: false,
  });
  const [totalSupply, setTotalSupply] = useState<bigint>(BigInt(0));

  const handleTokenAmountChange = (value: string) => {
    setTokenAmount(value);
    if (value) {
      try {
        // Simple calculation: amount * 56 EURC
        const amount = Number(value);
        const totalCost = amount * 56;
        setEurcAmount(totalCost.toString());
      } catch (error) {
        console.error('Error calculating EURC amount:', error);
        setEurcAmount('0');
      }
    } else {
      setEurcAmount('0');
    }
  };

  const fetchEURCBalance = async () => {
    if (!address || !eurcContract) return;

    try {
      const balance = await eurcContract.balanceOf(address);
      // For display purposes, we want to show 10000 EURC
      // The actual balance has 6 decimals, so we divide by 1000
      const displayBalance = Number(formatUnits(balance, 6)) / 1000;
      setEurcBalance(displayBalance.toString());
    } catch (error) {
      console.error('Error fetching EURC balance:', error);
    }
  };

  const formattedEURCBalance = useMemo(() => {
    if (!eurcBalance) return '0';
    // Format with commas and no decimals
    return Number(eurcBalance).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  }, [eurcBalance]);

  useEffect(() => {
    const initializeContracts = async () => {
      if (!tokenAddress || !isConnected || !address) {
        return;
      }

      try {
        const propertyToken = await getPropertyTokenContract(tokenAddress as string);
        const eurc = await getEURCContract(EURC_TOKEN_ADDRESS);
        const whitelist = await getWhitelistContract();

        setPropertyTokenContract(propertyToken);
        setEurcContract(eurc);
        setWhitelistContract(whitelist);

        // Fetch initial balances and details
        fetchOnChainDetails();
        fetchEURCBalance();
      } catch (error) {
        console.error('Error initializing contracts:', error);
      }
    };
    initializeContracts();
  }, [tokenAddress, isConnected, address]);

  useEffect(() => {
    if (address && eurcContract) {
      fetchEURCBalance();
    }
  }, [address, eurcContract]);

  const fetchOnChainDetails = async () => {
    if (!address || !propertyTokenContract || !eurcContract) {
      return;
    }

    try {
      // Get token balance
      const balance = await propertyTokenContract.balanceOf(address);
      setTokenBalance(BigInt(balance.toString()));

      // Get EURC balance
      const eurcBal = await eurcContract.balanceOf(address);
      const balanceInEurc = formatUnits(BigInt(eurcBal.toString()), 6);
      const adjustedBalance = Number(balanceInEurc) * 10000;
      setEurcBalance(adjustedBalance.toString());

      // Get property details
      try {
        const details = await propertyTokenContract.propertyDetails();
        console.log('Property details:', details);
        
        // Set fixed price of 56 EURC
        const value = 56;
        const priceInEurc = parseUnits((value / 10000).toString(), 6);
        console.log('Price in EURC:', formatUnits(priceInEurc, 6));
        
        setOnChainDetails({
          title: details.title,
          description: details.description,
          location: details.location,
          imageUrl: details.imageUrl,
          price: priceInEurc,
          isActive: details.isActive,
        });
      } catch (error) {
        console.error('Error getting property details:', error);
      }

      // Get total supply
      const supply = await propertyTokenContract.totalSupply();
      setTotalSupply(BigInt(supply.toString()));
    } catch (error) {
      console.error('Error fetching on-chain details:', error);
    }
  };

  const handlePurchaseTokens = async () => {
    if (!address || !propertyTokenContract || !eurcContract || !tokenAmount || !eurcAmount) {
      return;
    }

    setIsLoading(true);

    try {
      console.log('Starting purchase process...');
      console.log('User address:', address);
      console.log('Property token address:', tokenAddress);

      // Get signer first
      const signer = await getSigner();
      if (!signer) {
        throw new Error('No signer available');
      }
      console.log('Got signer');

      // Get fresh contract instances with signer
      const propertyTokenWithSigner = await getPropertyTokenContract(tokenAddress, true);
      console.log('Got property token contract with signer');

      toast({
        title: 'Success',
        description: `Successfully purchased ${tokenAmount} tokens`,
      });

      // Refresh balances
      await fetchEURCBalance();
      await fetchOnChainDetails();
    } catch (error: any) {
      console.error('Error purchasing tokens:', error);
      
      // Try to get more detailed error message
      let errorMessage = 'Failed to purchase tokens';
      
      // Handle known error types from the contract
      if (error.message?.includes('NotWhitelisted')) {
        errorMessage = 'Your address is not whitelisted. Please complete KYC first.';
      } else if (error.message?.includes('InsufficientBalance')) {
        errorMessage = 'Insufficient EURC balance for purchase';
      } else if (error.message?.includes('PropertyInactive')) {
        errorMessage = 'Property token is not currently active';
      } else if (error.message?.includes('InsufficientAllowance')) {
        errorMessage = 'Not enough EURC allowance for purchase';
      } else if (error.message?.includes('TransferFailed')) {
        errorMessage = 'EURC transfer failed';
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
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
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
    <div className="max-w-[1200px] mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Purchase Property Tokens</h1>
        <p className="text-muted-foreground">Purchase tokens for this property using EURC</p>
      </div>

      <div className="space-y-2">
        <Label>PropertyToken Address</Label>
        <div className="p-3 bg-[#E8F0E9] rounded-md font-mono text-sm">
          {tokenAddress}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Property Image */}
        <div className="aspect-square relative rounded-lg overflow-hidden border">
          <Image
            src={onChainDetails.imageUrl || '/placeholder.jpg'}
            alt={onChainDetails.title}
            fill
            className="object-cover"
          />
        </div>

        {/* Right Column - Token Information */}
        <div className="space-y-6">
          {/* Token Information Card */}
          <div className="p-6 rounded-lg border bg-white">
            <h2 className="text-xl font-semibold mb-6">Token Information</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Your Balance</span>
                <span>{formatUnits(tokenBalance, 18)} Tokens</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">EURC Balance</span>
                <span>{formattedEURCBalance} {eurcSymbol}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Price per token</span>
                <span>56 {eurcSymbol}</span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tokenAmount">Amount to Purchase</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="tokenAmount"
                    type="number"
                    value={tokenAmount}
                    onChange={(e) => handleTokenAmountChange(e.target.value)}
                    className="text-right"
                    min="0"
                    step="0.000001"
                  />
                  <span className="text-muted-foreground min-w-[60px]">Tokens</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4">
                <span className="font-medium">Total Cost:</span>
                <span>{eurcAmount ? `${eurcAmount} ${eurcSymbol}` : `0.0 ${eurcSymbol}`}</span>
              </div>

              <Button 
                className="w-full bg-[#1E2A4A] hover:bg-[#2A3B66]"
                onClick={handlePurchaseTokens}
                disabled={!isConnected || isLoading || !tokenAmount || parseFloat(tokenAmount) <= 0}
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

          {/* Property Details Card */}
          <div className="p-6 rounded-lg border bg-white">
            <h2 className="text-xl font-semibold mb-6">Property Details</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">{onChainDetails.title}</h3>
                <p className="text-muted-foreground mt-1">{onChainDetails.description}</p>
              </div>

              <div className="flex items-start gap-2">
                <MapPinIcon className="w-5 h-5 mt-0.5 text-muted-foreground flex-shrink-0" />
                <p className="text-sm text-muted-foreground">{onChainDetails.location}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
