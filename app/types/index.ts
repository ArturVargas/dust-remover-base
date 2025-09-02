export type SelectedTokenInfo = {
  address: `0x${string}`;
  symbol: string;
  decimals: number;
  balance: string;
  coinGeckoId?: string;
};

export type TokenBalance = {
  name: string;
  symbol: string;
  address: `0x${string}`;
  balance: string;
  decimals: number;
  loading: boolean;
  error?: string;
  coinGeckoId: string;
  price?: number;
  priceChange24h?: number;
  marketCap?: number;
};

export type TokenPrice = {
  id: string;
  price: number;
  priceChange24h: number;
  marketCap: number;
};

export type SwapQuoteTx = {
  to: `0x${string}` | null;
  data: `0x${string}` | null;
  value?: string;
};

export type SwapItem = {
  t: SelectedTokenInfo;
  amountIn: bigint;
  minOut: bigint;
  spender: `0x${string}`;
  swapTx?: SwapQuoteTx;
};

export type TransactionCall = {
  to: `0x${string}`;
  data: `0x${string}`;
  value?: bigint;
};
