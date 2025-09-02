import { NextRequest, NextResponse } from "next/server";
import { generateJwt } from "@coinbase/cdp-sdk/auth";

type SwapQuoteResponse = {
  minToAmount?: string;
  transaction?: {
    to?: string;
    data?: string;
    value?: string;
    gas?: string;
    gasPrice?: string;
  };
  allowanceTarget?: string;
  permit2?: {
    eip712: {
      domain: {
        name: string;
        chainId: number;
        verifyingContract: `0x${string}`;
      };
      types: Record<string, Array<{ name: string; type: string }>>;
      message: {
        permitted: {
          token: `0x${string}`;
          amount: string;
        };
        spender: `0x${string}`;
        nonce: string;
        deadline: string;
      };
      primaryType: string;
    };
    hash: `0x${string}`;
  };
  errorMessage?: string;
  error?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { network, toToken, fromToken, fromAmount, taker, signerAddress, slippageBps } =
      body || {};

    const KEY_NAME = process.env.KEY_NAME;
    const KEY_SECRET = process.env.KEY_SECRET;

    if (!KEY_NAME || !KEY_SECRET) {
      return NextResponse.json(
        { error: "Server missing KEY_NAME/KEY_SECRET" },
        { status: 500 },
      );
    }
    if (
      !network ||
      !toToken ||
      !fromToken ||
      !fromAmount ||
      !taker ||
      !signerAddress ||
      !slippageBps
    ) {
      return NextResponse.json(
        { error: "Missing required params" },
        { status: 400 },
      );
    }

    const REQUEST_METHOD = "POST";
    const REQUEST_HOST = "api.cdp.coinbase.com";
    const REQUEST_PATH = "/platform/v2/evm/swaps";

    const jwt = await generateJwt({
      apiKeyId: KEY_NAME,
      apiKeySecret: KEY_SECRET,
      requestMethod: REQUEST_METHOD,
      requestHost: REQUEST_HOST,
      requestPath: REQUEST_PATH,
      expiresIn: 120,
    });

    const resp = await fetch(`https://${REQUEST_HOST}${REQUEST_PATH}`, {
      method: REQUEST_METHOD,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({
        network,
        toToken,
        fromToken,
        fromAmount,
        taker,
        signerAddress,
        slippageBps
      }),
    });

    const raw = await resp.text();
    console.log("raw --->> ", raw);
    let parsed: SwapQuoteResponse | null = null;
    try {
      parsed = raw ? JSON.parse(raw) : null;
    } catch {
      parsed = null;
    }

    if (!resp.ok) {
      const message =
        parsed?.errorMessage || parsed?.error || raw || "Quote failed";
      return NextResponse.json({ error: message }, { status: resp.status });
    }

    const data = parsed || {};
    console.log("data --->> ", data);
    const tx = data.transaction || {};
    return NextResponse.json({
      success: true,
      minToAmount: data.minToAmount,
      transaction: {
        to: tx.to || null,
        data: tx.data || null,
        value: tx.value || "0",
        gas: tx.gas || undefined,
        gasPrice: tx.gasPrice || undefined,
      },
      allowanceTarget: data.allowanceTarget || null,
      permit2: data.permit2 || null,
      taker,
      signerAddress,
    });
  } catch (e: unknown) {
    const error = e instanceof Error ? e : new Error("Unknown error");
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
