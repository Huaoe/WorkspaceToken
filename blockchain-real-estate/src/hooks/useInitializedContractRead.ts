import { useEffect, useState } from 'react';
import { useReadContract } from 'wagmi';
import type { UseReadContractParameters } from 'wagmi';

export function useInitializedContractRead<
  TAbi extends readonly unknown[],
  TFunctionName extends string,
>(
  config: UseReadContractParameters<TAbi, TFunctionName>
) {
  const [isInitialized, setIsInitialized] = useState(false);
  const contractRead = useReadContract(config);

  useEffect(() => {
    const checkInitialization = async () => {
      try {
        // Try to read the owner - if it succeeds, the contract is initialized
        const result = await contractRead.refetch();
        setIsInitialized(!!result.data);
      } catch (error) {
        console.error('Contract initialization check failed:', error);
        setIsInitialized(false);
      }
    };

    if (config.enabled) {
      checkInitialization();
    }
  }, [config.enabled, contractRead]);

  return {
    ...contractRead,
    isInitialized,
  };
}
