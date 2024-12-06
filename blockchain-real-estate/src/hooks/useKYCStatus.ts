import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export function useKYCStatus(walletAddress: string | undefined) {
  const [hasSubmittedKYC, setHasSubmittedKYC] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function checkKYCStatus() {
      if (!walletAddress) {
        setHasSubmittedKYC(false);
        setIsLoading(false);
        return;
      }

      try {
        const { count, error } = await supabase
          .from('kyc_submissions')
          .select('*', { count: 'exact', head: true })
          .eq('wallet_address', walletAddress);

        if (error) {
          console.error('Error checking KYC status:', error);
          setHasSubmittedKYC(false);
        } else {
          setHasSubmittedKYC(count > 0);
        }
      } catch (error) {
        console.error('Error checking KYC status:', error);
        setHasSubmittedKYC(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkKYCStatus();
  }, [walletAddress]);

  return { hasSubmittedKYC, isLoading };
}
