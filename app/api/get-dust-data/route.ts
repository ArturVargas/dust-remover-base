import { NextRequest, NextResponse } from "next/server";
import {
  createPublicClient,
  http,
  erc20Abi,
  formatUnits,
  type Address,
} from "viem";
import { base } from "viem/chains";
import { TOKENS, PERMIT2_ADDRESS } from "@/app/constants/tokens";

const viemClient = createPublicClient({
  chain: base,
  transport: http("https://base-mainnet.public.blastapi.io"),
});

type TokenPriceMap = { [key: string]: { usd: number } };

async function fetchPricesFromCoinGecko(): Promise<TokenPriceMap> {
  const ids = TOKENS.map((t) => t.coinGeckoId).join(",");
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch prices from CoinGecko");
  }
  return response.json();
}

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json(
        { error: "A valid address is required" },
        { status: 400 },
      );
    }

    const prices = await fetchPricesFromCoinGecko();

    const allCalls = TOKENS.flatMap((token) => [
      {
        address: token.address,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [address as Address],
      },
      {
        address: token.address,
        abi: erc20Abi,
        functionName: "allowance",
        args: [address as Address, PERMIT2_ADDRESS],
      },
    ]);

    const results = await viemClient.multicall({
      contracts: allCalls,
      allowFailure: true,
    });

    const dustTokens = TOKENS.map((token, index) => {
      const balanceResult = results[index * 2];
      const allowanceResult = results[index * 2 + 1];

      if (
        balanceResult.status === "failure" ||
        (balanceResult.result as bigint) === BigInt(0)
      ) {
        return null;
      }

      const balance = balanceResult.result as bigint;
      const formattedBalance = formatUnits(balance, token.decimals);
      const price = prices[token.coinGeckoId]?.usd || 0;
      const usdValue = parseFloat(formattedBalance) * price;

      if (usdValue < 0.01 || usdValue > 2) {
        // Condición de Dust
        return null;
      }

      const allowance =
        allowanceResult.status === "success"
          ? (allowanceResult.result as bigint).toString()
          : "0";

      return {
        ...token,
        balance: formattedBalance,
        allowance,
        usdValue,
      };
    }).filter(Boolean);

    return NextResponse.json({ success: true, data: dustTokens });
  } catch (error) {
    console.error("Error in get-dust-data API:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}
