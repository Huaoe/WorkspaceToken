'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { getPropertyFactoryContract, getSigner } from '@/lib/ethereum';
import { supabase } from '@/lib/supabase/client';
import { PropertyRequestCard } from './components/PropertyRequestCard';
import { KYCSubmissionCard } from './components/KYCSubmissionCard';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from 'date-fns';
import { MapPin, Calendar, Percent, Clock, User, ExternalLink } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useWalletEvents } from '@/app/wallet-events-provider';
import { AdminCheck } from '../components/AdminCheck';

export default function AdminRequests() {
  const [mounted, setMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [kycSubmissions, setKYCSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  const { address, isConnected } = useWalletEvents();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if user is admin
  useEffect(() => {
    async function checkAdmin() {
      if (!mounted || !isConnected || !address) {
        console.log('Skipping admin check - prerequisites not met:', {
          mounted,
          isConnected,
          hasAddress: !!address
        });
        return;
      }

      console.log('Checking admin status for address:', address);
      try {
        const contract = await getPropertyFactoryContract();
        const owner = await contract.owner();
        console.log('Contract owner:', owner);
        console.log('Current address:', address);

        const isAdmin = address.toLowerCase() === owner.toLowerCase();
        console.log('Is admin?', isAdmin);
        
        setIsAdmin(isAdmin);

        if (!isAdmin) {
          console.log('Not admin, redirecting...');
          router.push('/');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        toast({
          title: "Error",
          description: "Failed to verify admin status. Please make sure you're connected to the correct network.",
          variant: "destructive",
        });
        router.push('/');
      }
    }

    checkAdmin();
  }, [mounted, address, isConnected, router, toast]);

  // Handle KYC validation
  const handleKYCValidation = async (kycId: string, status: 'approved' | 'rejected') => {
    if (!isAdmin || !isConnected) {
      toast({
        title: "Error",
        description: "You must be connected and have admin privileges",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get the KYC submission
      const { data: submission, error: kycError } = await supabase
        .from('kyc_submissions')
        .select('*')
        .eq('id', kycId)
        .single();

      if (kycError) throw kycError;

      let whitelistTxHash = null;

      // If approving, whitelist the address
      if (status === 'approved') {
        try {
          const contract = await getPropertyFactoryContract();
          const tx = await contract.whitelistAddress(submission.wallet_address);
          await tx.wait();
          whitelistTxHash = tx.hash;
          
          toast({
            title: "Address Whitelisted",
            description: "Successfully whitelisted the address on-chain",
          });
        } catch (error: any) {
          console.error('Error whitelisting address:', error);
          toast({
            title: "Error",
            description: "Failed to whitelist address on-chain. Please try again.",
            variant: "destructive",
          });
          throw new Error('Failed to whitelist address');
        }
      }

      // Update the submission status
      const { error: updateError } = await supabase
        .from('kyc_submissions')
        .update({ 
          status,
          validated_at: new Date().toISOString(),
          validator_address: address,
          whitelist_tx_hash: whitelistTxHash
        })
        .eq('id', kycId);

      if (updateError) throw updateError;

      // Refresh the submissions list
      await fetchKYCSubmissions();

      toast({
        title: "Success",
        description: `KYC submission ${status} successfully`,
      });
    } catch (error: any) {
      console.error('Error handling KYC validation:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process KYC validation",
        variant: "destructive",
      });
      throw error; // Re-throw to be caught by the component
    }
  };

  // Fetch KYC submissions
  const fetchKYCSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('kyc_submissions')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setKYCSubmissions(data || []);
    } catch (error) {
      console.error('Error fetching KYC submissions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch KYC submissions",
        variant: "destructive",
      });
    }
  };

  // Fetch property requests
  const fetchPropertyRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('property_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching property requests:', error);
      toast({
        title: "Error",
        description: "Failed to fetch property requests",
        variant: "destructive",
      });
    }
  };

  // Fetch all data
  useEffect(() => {
    if (!mounted || !isAdmin) return;

    async function fetchData() {
      setLoading(true);
      try {
        await Promise.all([
          fetchPropertyRequests(),
          fetchKYCSubmissions()
        ]);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [mounted, isAdmin]);

  if (!mounted || !isConnected || !isAdmin) return null;

  return (
    <AdminCheck>
      <div className="container py-8">
        {loading ? (
          <div className="text-center">Loading...</div>
        ) : (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
              <p className="text-muted-foreground">Manage property and KYC requests</p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Property Requests ({requests.length})</h2>
              {requests.length === 0 ? (
                <p className="text-muted-foreground">No pending property requests</p>
              ) : (
                <div className="grid gap-4">
                  {requests.map((request) => (
                    <PropertyRequestCard key={request.id} request={request} />
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">KYC Submissions ({kycSubmissions.length})</h2>
              {kycSubmissions.length === 0 ? (
                <p className="text-muted-foreground">No pending KYC submissions</p>
              ) : (
                <div className="grid gap-4">
                  {kycSubmissions.map((submission) => (
                    <KYCSubmissionCard key={submission.id} submission={submission} handleKYCValidation={handleKYCValidation} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminCheck>
  );
}
