// Direcciones y configuración
export const DUST_COLLECTOR_ADDRESS = "0xD4A1D399158cC4B2F18bcBb0a4eee9082b66a335" as const;

export const PERMIT2_ADDRESS = "0x000000000022D473030F116dDEE9F6B43aC78BA3" as const;
export const UNISWAP_V2_ROUTER_ADDRESS = "0x2626664c2603336E57B271c5C0b26F421741e481" as const; // BaseSwap Router
export const WETH_ADDRESS = "0x4200000000000000000000000000000000000006" as const;

export const SLIPPAGE_TOLERANCE_BPS = 50; // 0.5%

// Configuración de tokens
export const TOKENS = [
  {
    name: "Build",
    address: "0x3c281a39944a2319aa653d81cfd93ca10983d234" as `0x${string}`,
    symbol: "BUILD",
    coinGeckoId: "build-2",
    decimals: 18
  },
  {
    name: "Apu",
    address: "0x7a2c5e7788e55ec0a7ba4aeec5b3da322718fb5e" as `0x${string}`,
    symbol: "APU",
    coinGeckoId: "apu-2",
    decimals: 18
  },
  {
    name: "Based",
    address: "0x07d15798a67253d76cea61f0ea6f57aedc59dffb" as `0x${string}`,
    symbol: "BASED",
    coinGeckoId: "based-2",
    decimals: 18
  },
  {
    name: "Vain",
    address: "0x6c7ebb64e258f5712eeec83ceaf41c3dcbb534b1" as `0x${string}`,
    symbol: "VAIN",
    coinGeckoId: "vainguard",
    decimals: 18
  },
  {
    name: "Nogs",
    address: "0x13741c5df9ab03e7aa9fb3bf1f714551dd5a5f8a" as `0x${string}`,
    symbol: "NOGS",
    coinGeckoId: "noggles",
    decimals: 18
  }
];

// RPC público de Blast API solo para lectura (balances, allowances, etc.)
// OnchainKit se usa para transacciones y paymaster
export const RPC_URLS = [
  'https://base-mainnet.public.blastapi.io'
];
