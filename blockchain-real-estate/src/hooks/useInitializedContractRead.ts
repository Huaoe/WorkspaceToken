import { useEffect, useState } from 'react';
import { Contract, ContractInterface } from 'ethers';

interface UseInitializedContractReadConfig {
  contract: Contract;
  functionName: string;
  args?: any[];
  enabled?: boolean;
}

export function useInitializedContractRead<T = any>(
  config: UseInitializedContractReadConfig
) {
  const [data, setData] = useState<T | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!config.enabled || !config.contract) return;

      setIsLoading(true);
      setIsError(false);
      setError(null);

      try {
        const result = await config.contract[config.functionName](...(config.args || []));
        setData(result);
        setIsInitialized(true);
      } catch (err) {
        console.error('Contract read failed:', err);
        setIsError(true);
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setIsInitialized(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [config.enabled, config.contract, config.functionName, JSON.stringify(config.args)]);

  const refetch = async () => {
    if (!config.contract) return;

    setIsLoading(true);
    setIsError(false);
    setError(null);

    try {
      const result = await config.contract[config.functionName](...(config.args || []));
      setData(result);
      return { data: result };
    } catch (err) {
      console.error('Contract read failed:', err);
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      return { error: err };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    data,
    isLoading,
    isError,
    error,
    isInitialized,
    refetch,
  };
}
