import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { createPublicClient, http, formatUnits, erc20Abi } from "viem";
import { base } from "viem/chains";
import { TOKENS, RPC_URLS } from "../constants/tokens";
import { TokenBalance, TokenPrice } from "../types";

// Función para crear cliente con RPC específico
const createClientWithRpc = (rpcUrl: string) => {
  return createPublicClient({
    chain: base,
    transport: http(rpcUrl)
  });
};

// Función para hacer delay entre requests
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function useTokenBalances() {
  const { address } = useAccount();
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [tokenPrices, setTokenPrices] = useState<TokenPrice[]>([]);
  const [totalValue, setTotalValue] = useState<number>(0);

  // Función para obtener precios de tokens desde CoinGecko
  const fetchTokenPrices = async () => {
    try {
      const response = await fetch('/api/token-prices');
      if (!response.ok) {
        throw new Error('Error al obtener precios');
      }
      
      const result = await response.json();
      if (result.success) {
        setTokenPrices(result.data);
      }
    } catch (error) {
      console.error('Error fetching token prices:', error);
    }
  };

  // Función para calcular el valor total en USD
  const calculateTotalValue = useCallback(() => {
    if (tokenBalances.length === 0 || tokenPrices.length === 0) return 0;
    
    return tokenBalances.reduce((total, token) => {
      if (token.error || token.balance === "0") return total;
      
      const price = tokenPrices.find(p => p.id === token.coinGeckoId)?.price || 0;
      const balanceInUsd = parseFloat(token.balance) * price;
      return total + balanceInUsd;
    }, 0);
  }, [tokenBalances, tokenPrices]);

  // Función para obtener balance de un token con retry y fallback
  const fetchTokenBalance = async (token: typeof TOKENS[0], rpcIndex = 0): Promise<TokenBalance> => {
    try {
      const rpcUrl = RPC_URLS[rpcIndex];
      const client = createClientWithRpc(rpcUrl);
      
      const [balance, decimals] = await Promise.all([
        client.readContract({
          address: token.address,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [address!]
        }),
        client.readContract({
          address: token.address,
          abi: erc20Abi,
          functionName: 'decimals',
          args: []
        })
      ]);

      return {
        name: token.name,
        symbol: token.symbol,
        address: token.address,
        balance: formatUnits(balance as bigint, decimals as number),
        decimals: decimals as number,
        loading: false,
        coinGeckoId: token.coinGeckoId
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      // Si es error de rate limit y hay más RPCs disponibles, intentar con el siguiente
      if ((errorMessage.includes('rate limit') || errorMessage.includes('429')) && rpcIndex < RPC_URLS.length - 1) {
        console.log(`Rate limit en ${RPC_URLS[rpcIndex]}, intentando con siguiente RPC...`);
        await delay(1000); // Esperar 1 segundo antes de reintentar
        return fetchTokenBalance(token, rpcIndex + 1);
      }
      
      console.error(`Error fetching ${token.name} from ${RPC_URLS[rpcIndex]}:`, error);
      return {
        name: token.name,
        symbol: token.symbol,
        address: token.address,
        balance: "0",
        decimals: 18,
        loading: false,
        error: errorMessage || "Error desconocido",
        coinGeckoId: token.coinGeckoId
      };
    }
  };

  const fetchTokenBalances = async () => {
    if (!address) return;

    setIsLoading(true);
    const balances: TokenBalance[] = [];

    // Procesar tokens en lotes pequeños para evitar rate limiting
    const batchSize = 2; // Solo 2 tokens por vez
    for (let i = 0; i < TOKENS.length; i += batchSize) {
      const batch = TOKENS.slice(i, i + batchSize);
      
      // Procesar lote en paralelo
      const batchPromises = batch.map(token => fetchTokenBalance(token));
      const batchResults = await Promise.all(batchPromises);
      
      balances.push(...batchResults);
      
      // Esperar entre lotes para evitar rate limiting
      if (i + batchSize < TOKENS.length) {
        await delay(2000); // 2 segundos entre lotes
      }
    }

    setTokenBalances(balances);
    setIsLoading(false);
  };

  useEffect(() => {
    if (address) {
      fetchTokenBalances();
      fetchTokenPrices();
    }
  }, [address]);

  useEffect(() => {
    const total = calculateTotalValue();
    setTotalValue(total);
  }, [calculateTotalValue]);

  const refreshBalances = () => {
    fetchTokenBalances();
    fetchTokenPrices();
  };

  return {
    tokenBalances,
    tokenPrices,
    isLoading,
    totalValue,
    refreshBalances,
    fetchTokenBalances
  };
}
