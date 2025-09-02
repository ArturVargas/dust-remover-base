// Direcciones y configuración
export const PERMIT2_ADDRESS = "0x000000000022D473030F116dDEE9F6B43aC78BA3" as const;
export const UNISWAP_ROUTER = "0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD" as const; // Universal Router
export const SWAP_ROUTER = "0xE592427A0AEce92De3Edee1F18E0157C05861564" as const; // Legacy SwapRouter V3
export const QUOTER_ADDRESS = "0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a" as const; // Quoter v3 Base
export const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const;
export const WETH_ADDRESS = "0x4200000000000000000000000000000000000006" as const;
export const FEE_COLLECTOR = (process.env.NEXT_PUBLIC_FEE_COLLECTOR || "") as `0x${string}`;
export const SLIPPAGE_TOLERANCE_BPS = 50; // 0.5%
export const DEFAULT_POOL_FEE = 500; // 0.05%
export const FEE_TIERS: number[] = [500, 3000, 10000];

// Configuración de tokens
export const TOKENS = [
  {
    name: "Build",
    address: "0x3c281a39944a2319aa653d81cfd93ca10983d234" as `0x${string}`,
    symbol: "BUILD",
    coinGeckoId: "build-2"
  },
  {
    name: "Apu",
    address: "0x7a2c5e7788e55ec0a7ba4aeec5b3da322718fb5e" as `0x${string}`,
    symbol: "APU",
    coinGeckoId: "apu-2"
  },
  {
    name: "Based",
    address: "0x07d15798a67253d76cea61f0ea6f57aedc59dffb" as `0x${string}`,
    symbol: "BASED",
    coinGeckoId: "based-2"
  },
  {
    name: "Vain",
    address: "0x6c7ebb64e258f5712eeec83ceaf41c3dcbb534b1" as `0x${string}`,
    symbol: "VAIN",
    coinGeckoId: "vainguard"
  },
  {
    name: "Nogs",
    address: "0x13741c5df9ab03e7aa9fb3bf1f714551dd5a5f8a" as `0x${string}`,
    symbol: "NOGS",
    coinGeckoId: "noggles"
  }
];

// Múltiples RPCs para Base mainnet con fallback
export const RPC_URLS = [
  'https://base-mainnet.public.blastapi.io'
];
