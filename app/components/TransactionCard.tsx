import { useCallback, useEffect, useState } from "react";
import { useAccount, useSignTypedData } from "wagmi";
import { parseUnits } from "viem";
import {
  Transaction,
  TransactionButton,
  TransactionToast,
  TransactionToastAction,
  TransactionToastIcon,
  TransactionToastLabel,
  TransactionError,
  TransactionResponse,
  TransactionStatusAction,
  TransactionStatusLabel,
  TransactionStatus,
} from "@coinbase/onchainkit/transaction";
import { useNotification } from "@coinbase/onchainkit/minikit";

import { Card } from "./ui";
import { SelectedTokenInfo } from "../types";
import {
  USDC_ADDRESS,
  WETH_ADDRESS,
  SLIPPAGE_TOLERANCE_BPS,
} from "../constants/tokens";

type TransactionCardProps = {
  selectedTokens?: SelectedTokenInfo[];
  signerAddress?: `0x${string}`;
};

const isHexAddress = (s: unknown): s is `0x${string}` =>
  typeof s === "string" && /^0x[a-fA-F0-9]{40}$/.test(s);

export function TransactionCard({
  selectedTokens = [],
  signerAddress,
}: TransactionCardProps) {
  const { address } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();
  const [destToken, setDestToken] = useState<"USDC" | "WETH">("USDC");
  const [error, setError] = useState<string>("");
  const [priceMap, setPriceMap] = useState<Record<string, number>>({});

  useEffect(() => {
    const loadPrices = async () => {
      try {
        const resp = await fetch("/api/token-prices");
        const data = await resp.json();
        if (data?.success) {
          const map: Record<string, number> = {};
          for (const p of data.data) map[p.id] = p.price;
          setPriceMap(map);
        }
      } catch {
        // Silently handle error
      }
    };
    loadPrices();
  }, []);

  const sendNotification = useNotification();

  const handleSuccess = useCallback(
    async (response: TransactionResponse) => {
      const transactionHash = response.transactionReceipts[0].transactionHash;
      console.log(`Transaction successful: ${transactionHash}`);
      await sendNotification({
        title: "¡Felicidades!",
        body: `Has enviado tu transacción, ${transactionHash}!`,
      });
    },
    [sendNotification],
  );

  const fetchCalls = useCallback(async () => {
    setError("");

    if (!address || selectedTokens.length === 0) {
      setError("Conecta tu wallet y selecciona tokens.");
      return [];
    }

    const destAddress = destToken === "USDC" ? USDC_ADDRESS : WETH_ADDRESS;

    // Filtrar dust <= $2
    const dustOnly = selectedTokens.filter((t) => {
      const price = t.coinGeckoId ? (priceMap[t.coinGeckoId] ?? 0) : 0;
      const usd = parseFloat(t.balance) * price;
      return usd > 0 && usd <= 2;
    });

    if (dustOnly.length === 0) {
      setError("No hay tokens con valor <= $2 USD para limpiar");
      return [];
    }

    // Pedir quotes y construir calls válidos
    const validCalls: {
      to: `0x${string}`;
      data: `0x${string}`;
      value?: bigint;
    }[] = [];

    for (const t of dustOnly) {
      try {
        const amountIn = parseUnits(t.balance, t.decimals);
        if (amountIn <= BigInt(0)) continue;

        const resp = await fetch("/api/swap-quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            network: "base",
            toToken: destAddress,
            fromToken: t.address,
            fromAmount: amountIn.toString(),
            taker: address,
            signerAddress: signerAddress,
            slippageBps: SLIPPAGE_TOLERANCE_BPS,
          }),
        });

        const data = await resp.json();

        // Errores del backend
        if (!resp.ok) {
          console.warn("Quote error:", data);
          continue;
        }

        if (data.permit2?.eip712) {
          const { domain, types, message, primaryType } = data.permit2.eip712;
          await signTypedDataAsync({
            account: signerAddress, // EOA firma
            domain,
            types,
            message,
            primaryType, // "PermitTransferFrom"
          });
          // La firma es verificada por el router (via Permit2). No hace falta adjuntarla aquí.
        }
        const to = data?.transaction?.to;
        const callData = data?.transaction?.data;
        const valueStr = data?.transaction?.value;

        // Validaciones estrictas para evitar "to is required"
        if (
          !isHexAddress(to) ||
          typeof callData !== "string" ||
          !callData.startsWith("0x")
        ) {
          console.warn("Quote sin 'to'/'data' válidos, se omite:", {
            to,
            callData,
          });
          continue;
        }

        const value =
          typeof valueStr === "string" ? BigInt(valueStr) : undefined;

        validCalls.push({
          to,
          data: callData as `0x${string}`,
          value,
        });
      } catch (e) {
        console.warn(`Quote falló para ${t.symbol}:`, e);
        // seguimos con los demás
      }
    }

    if (validCalls.length === 0) {
      setError("No se pudieron preparar swaps válidos (falta 'to'/'data').");
      return [];
    }

    // Opcional: limitar a 1–3 llamadas por UX
    return validCalls.slice(0, 3);
  }, [
    address,
    signerAddress,
    selectedTokens,
    destToken,
    priceMap,
    signTypedDataAsync,
  ]);

  return (
    <Card title="Remove your dust">
      <div className="space-y-4">
        <div className="grid grid-cols-12 gap-2 w-full max-w-sm mx-auto">
          <label className="col-span-12 text-sm text-[var(--app-foreground-muted)]">
            Swap to
          </label>
          <select
            value={destToken}
            onChange={(e) => setDestToken(e.target.value as "USDC" | "WETH")}
            className="col-span-10 col-start-2 px-3 py-2 rounded-lg bg-[var(--app-card-bg)] border border-[var(--app-card-border)] text-[var(--app-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--app-accent)]"
          >
            <option value="USDC">USDC</option>
            <option value="WETH">WETH</option>
          </select>
        </div>

        <div className="text-center text-[var(--app-foreground-muted)] text-sm">
          {selectedTokens.length > 0
            ? `${selectedTokens.length} token(s) selected`
            : `No tokens selected`}
        </div>

        {error && <p className="text-center text-xs text-red-400">{error}</p>}

        <div className="flex flex-col items-center">
          {address ? (
            <Transaction
              isSponsored
              calls={fetchCalls}
              capabilities={{
                paymasterService: {
                  url: process.env
                    .NEXT_PUBLIC_PAYMASTER_AND_BUNDLER_ENDPOINT as string,
                },
              }}
              onSuccess={handleSuccess}
              onError={(error: TransactionError) =>
                console.error("Transaction failed:", error)
              }
            >
              <TransactionButton className="text-white text-md" />
              <TransactionStatus>
                <TransactionStatusAction />
                <TransactionStatusLabel />
              </TransactionStatus>
              <TransactionToast className="mb-4">
                <TransactionToastIcon />
                <TransactionToastLabel />
                <TransactionToastAction />
              </TransactionToast>
            </Transaction>
          ) : (
            <p className="text-yellow-400 text-sm text-center mt-2">
              Connect your wallet to send a transaction
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
