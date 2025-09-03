import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { createPublicClient, http, formatUnits, erc20Abi } from "viem";
import { base } from "viem/chains";
import { TOKENS, RPC_URLS } from "../constants/tokens";
import { TokenBalance, TokenPrice } from "../types";

// Función para crear cliente con RPC específico
const viemClient = createPublicClient({
  chain: base,
  transport: http(RPC_URLS[0]),
});

export function useTokenBalances() {
  const { address } = useAccount();
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tokenPrices, setTokenPrices] = useState<TokenPrice[]>([]);
  const [totalValue, setTotalValue] = useState<number>(0);

  const fetchTokenPrices = useCallback(async () => {
    try {
      const response = await fetch('/api/token-prices');
      if (!response.ok) throw new Error('Error al obtener precios');
      const result = await response.json();
      if (result.success) {
        setTokenPrices(result.data);
      }
    } catch (error) {
      console.error('Error fetching token prices:', error);
    }
  }, []);

  const fetchTokenBalances = useCallback(async () => {
    if (!address) {
      setTokenBalances([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    const balances = await Promise.all(TOKENS.map(async (token) => {
      try {
        const [balance, decimals] = await Promise.all([
          viemClient.readContract({
            address: token.address,
            abi: erc20Abi,
            functionName: 'balanceOf',
            args: [address]
          }),
          viemClient.readContract({
            address: token.address,
            abi: erc20Abi,
            functionName: 'decimals',
          })
        ]);
        return {
          ...token,
          balance: formatUnits(balance, decimals),
          decimals,
          loading: false,
        };
      } catch (error) {
        console.error(`Error fetching balance for ${token.symbol}:`, error);
        return { ...token, balance: "0", decimals: 18, loading: false, error: (error as Error).message };
      }
    }));

    setTokenBalances(balances);
    setIsLoading(false);
  }, [address]);
  
  useEffect(() => {
    const total = tokenBalances.reduce((acc, token) => {
      if(token.error || !token.coinGeckoId) return acc;
      const price = tokenPrices.find(p => p.id === token.coinGeckoId)?.price || 0;
      return acc + (parseFloat(token.balance) * price);
    }, 0);
    setTotalValue(total);
  }, [tokenBalances, tokenPrices]);
  
  useEffect(() => {
    // Se asegura de que se carguen tanto precios como balances al conectar la wallet
    if (address) {
        fetchTokenPrices();
        fetchTokenBalances();
    }
  }, [address, fetchTokenBalances, fetchTokenPrices]);

  const refreshBalances = useCallback(() => {
    fetchTokenPrices();
    fetchTokenBalances();
  }, [fetchTokenBalances, fetchTokenPrices]);

  return { tokenBalances, tokenPrices, isLoading, totalValue, refreshBalances };
}