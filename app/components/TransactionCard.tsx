import { useState } from "react";
import { useAccount, useSignTypedData, useWriteContract, usePublicClient, useWalletClient } from "wagmi";
import { parseUnits } from "viem";
import { Card, Button } from "./ui";
import { SelectedTokenInfo } from "../types";
import { DUST_COLLECTOR_ADDRESS, UNISWAP_V2_ROUTER_ADDRESS, WETH_ADDRESS, PERMIT2_ADDRESS, SLIPPAGE_TOLERANCE_BPS } from "../constants/tokens";
import { dustCollectorAbi, uniswapV2RouterAbi } from "../constants/abis";

type TransactionCardProps = {
  selectedTokens: SelectedTokenInfo[];
  needsApproval: boolean;
};

const permit2Domain = {
  name: "Permit2",
  chainId: 8453, // Base Mainnet
  verifyingContract: PERMIT2_ADDRESS,
} as const;

const permit2Types = {
  PermitBatchTransferFrom: [
    { name: "permitted", type: "PermitTransferFrom[]" },
    { name: "signer", type: "address" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
  PermitTransferFrom: [
    { name: "permitted", type: "TokenPermissions" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
  TokenPermissions: [
    { name: "token", type: "address" },
    { name: "amount", type: "uint256" },
  ],
} as const;

export function TransactionCard({ selectedTokens, needsApproval }: TransactionCardProps) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { writeContractAsync } = useWriteContract();
  const { signTypedDataAsync } = useSignTypedData();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");


  const handleSwap = async () => {
    if (!address || !publicClient || !walletClient) {
      setError("Por favor, conecta tu wallet.");
      return;
    }
    if (selectedTokens.length === 0) {
      setError("No hay tokens seleccionados.");
      return;
    }
    if (selectedTokens.length > 5) {
      setError("Puedes seleccionar un máximo de 5 tokens.");
      return;
    }
    if (needsApproval) {
      setError("Algunos tokens necesitan ser aprobados primero.");
      return;
    }

    setIsLoading(true);
    setError("");
    setStatus("Preparando transacción...");

    try {
      // 1. Calcular minAmountsOut para cada token
      setStatus("Calculando precios...");
      const minAmountsOut = await Promise.all(
        selectedTokens.map(async (token) => {
          const amountIn = parseUnits(token.balance, token.decimals);
          if (amountIn === BigInt(0)) return BigInt(0);
          const amounts = await publicClient.readContract({
            address: UNISWAP_V2_ROUTER_ADDRESS,
            abi: uniswapV2RouterAbi,
            functionName: 'getAmountsOut',
            args: [amountIn, [token.address, WETH_ADDRESS]],
          });
          const amountOut = amounts[1];
          return (amountOut * BigInt(10000 - SLIPPAGE_TOLERANCE_BPS)) / BigInt(10000);
        })
      );

      // 2. Preparar datos para la firma y el contrato
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200); // 20 minutos
      const nonce = BigInt(Math.floor(Date.now() / 1000));
      
      const tokensToSwap = selectedTokens.map(token => ({
        permitted: {
          token: token.address,
          amount: parseUnits(token.balance, token.decimals),
        },
        nonce: nonce, // El nonce individual es ignorado, pero requerido por el struct
        deadline: deadline,
      }));
      
      const message = {
        permitted: tokensToSwap,
        signer: address,
        nonce: nonce,
        deadline: deadline,
      };

      // 3. Solicitar firma EIP-712 al usuario
      setStatus("Esperando firma...");
      const signature = await signTypedDataAsync({
        domain: permit2Domain,
        types: permit2Types,
        primaryType: 'PermitBatchTransferFrom',
        message,
      });

      // 4. Llamar a la función swapDust
      setStatus("Enviando transacción...");
      const txHash = await writeContractAsync({
        address: DUST_COLLECTOR_ADDRESS,
        abi: dustCollectorAbi,
        functionName: 'swapDust',
        args: [
          tokensToSwap,
          selectedTokens.map(t => t.address),
          minAmountsOut,
          nonce,
          signature,
          deadline,
        ],
      });

      setStatus(`Transacción enviada: ${txHash}. Esperando confirmación...`);
      await publicClient?.waitForTransactionReceipt({ hash: txHash });

      setStatus("¡Éxito! Tu dust ha sido removido.");
      
    } catch (e: unknown) {
      console.error(e);
      const errorMessage = (e as { shortMessage?: string; message?: string }).shortMessage || (e as { message?: string }).message || "La transacción falló.";
      setError(errorMessage);
      setStatus("");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <Card title="Remover tu Dust">
      <div className="space-y-4">
        <div className="grid grid-cols-12 gap-2 w-full max-w-sm mx-auto">
          <label className="col-span-12 text-sm text-[var(--app-foreground-muted)]">
            Cambiar a
          </label>
          {/* El select para elegir WETH (deshabilitado por ahora) */}
          <select
            value="WETH"
            disabled
            className="col-span-10 col-start-2 px-3 py-2 rounded-lg bg-[var(--app-card-bg)] border border-[var(--app-card-border)] text-[var(--app-foreground)]"
          >
            <option value="WETH">WETH</option>
          </select>
        </div>

        <div className="text-center text-[var(--app-foreground-muted)] text-sm">
          {selectedTokens.length > 0
            ? `${selectedTokens.length} token(s) seleccionados`
            : `No hay tokens seleccionados`}
        </div>

        {error && <p className="text-center text-xs text-red-400">{error}</p>}
        {status && <p className="text-center text-xs text-blue-400">{status}</p>}

        <div className="flex flex-col items-center pt-4">
          {address ? (
            <Button
              onClick={handleSwap}
              disabled={isLoading || needsApproval || selectedTokens.length === 0}
            >
              {isLoading ? "Procesando..." : "Remover tu Dust"}
            </Button>
          ) : (
            <p className="text-yellow-400 text-sm text-center">
              Conecta tu wallet para detectar y remover tu Dust
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
