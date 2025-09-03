import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { TokenBalance } from "../types";

export function useTokenBalances() {
  const { address } = useAccount();
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalValue, setTotalValue] = useState<number>(0);

  const fetchDustData = useCallback(async () => {
    if (!address) {
      setTokenBalances([]);
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('/api/get-dust-data', { // Llama a tu API
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });
      const result = await response.json();

      if (result.success) {
        setTokenBalances(result.data);
        const total = result.data.reduce((sum: number, token: TokenBalance) => sum + (token.usdValue || 0), 0);
        setTotalValue(total);
      } else {
        throw new Error(result.error || 'Failed to fetch token data');
      }
    } catch (error) {
      console.error(error);
      setTokenBalances([]);
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchDustData();
  }, [address, fetchDustData]);

  return { 
    tokenBalances, 
    isLoading, 
    totalValue,
    refreshBalances: fetchDustData,
  };
}
