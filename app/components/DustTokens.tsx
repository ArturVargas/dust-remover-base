import { useState, useMemo, useEffect } from "react";
import { useAccount } from "wagmi";
import { Button, Card, Icon, Skeleton } from "./ui";
import { useTokenBalances } from "../hooks/useTokenBalances";
import { SelectedTokenInfo, TokenBalance } from "../types";

type DustTokensProps = {
  onSelectedTokensChange?: (tokens: SelectedTokenInfo[]) => void;
};

export function DustTokens({ onSelectedTokensChange }: DustTokensProps) {
  const { address } = useAccount();
  const { tokenBalances, tokenPrices, isLoading, totalValue, refreshBalances } = useTokenBalances();
  const [selectedTokens, setSelectedTokens] = useState<Set<string>>(new Set());

  // Notificar al padre cuando cambien las selecciones
  useEffect(() => {
    if (!onSelectedTokensChange) return;
    const selectedList: SelectedTokenInfo[] = tokenBalances
      .filter(t => selectedTokens.has(t.address) && !t.error && parseFloat(t.balance) > 0)
      .map(t => ({ 
        address: t.address, 
        symbol: t.symbol, 
        decimals: t.decimals, 
        balance: t.balance, 
        coinGeckoId: t.coinGeckoId 
      }));
    onSelectedTokensChange(selectedList);
  }, [selectedTokens, tokenBalances, onSelectedTokensChange]);

  // Función para manejar selección/deselección de tokens
  const toggleTokenSelection = (tokenAddress: string) => {
    const newSelected = new Set(selectedTokens);
    if (newSelected.has(tokenAddress)) {
      newSelected.delete(tokenAddress);
    } else {
      newSelected.add(tokenAddress);
    }
    setSelectedTokens(newSelected);
  };

  // Función para seleccionar todos los tokens
  const selectAllTokens = () => {
    const tokensWithBalance = tokenBalances
      .filter(token => !token.error && parseFloat(token.balance) > 0)
      .map(token => token.address);
    setSelectedTokens(new Set(tokensWithBalance));
  };

  // Función para deseleccionar todos los tokens
  const deselectAllTokens = () => {
    setSelectedTokens(new Set());
  };

  return (
    <Card title="Dust Tokens en Base">
      <div className="space-y-4">
        {!address ? (
          <div className="text-center py-8">
            <p className="text-[var(--app-foreground-muted)] mb-4">
              Conecta tu wallet para ver tus balances de tokens
            </p>
          </div>
        ) : (
          <>
            {/* Header con controles de selección y actualización */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {!isLoading && tokenBalances.filter(token => !token.error && parseFloat(token.balance) > 0).length > 0 && (
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={selectAllTokens}
                      className="text-xs"
                    >
                      Seleccionar Todos
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={deselectAllTokens}
                      className="text-xs"
                    >
                      Limpiar
                    </Button>
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshBalances}
                disabled={isLoading}
                icon={<Icon name="refresh" size="sm" />}
              >
                {isLoading ? "Actualizando..." : "Actualizar"}
              </Button>
            </div>

            {/* Valor total en USD */}
            {isLoading && tokenBalances.length === 0 ? (
              <div className="bg-[var(--app-accent)] bg-opacity-10 p-4 rounded-lg border border-[var(--app-accent)]">
                <div className="text-center">
                  <Skeleton className="h-4 w-48 mx-auto mb-2" />
                  <Skeleton className="h-8 w-32 mx-auto" />
                </div>
              </div>
            ) : totalValue > 0 ? (
              <div className="bg-[var(--app-accent)] bg-opacity-10 p-4 rounded-lg border border-[var(--app-accent)]">
                <div className="text-center">
                  <p className="text-sm text-[var(--app-foreground-muted)] mb-1">
                    Valor Total del Dust
                  </p>
                  <p className="text-2xl font-bold text-[var(--app-foreground-muted)]">
                    ${totalValue.toFixed(2)} USD
                  </p>
                </div>
              </div>
            ) : null}

            <div className="space-y-3">
              {/* Skeletons durante la carga inicial o actualización */}
              {isLoading && (
                <>
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-[var(--app-card-bg)] rounded-lg border border-[var(--app-card-border)]"
                    >
                      <div className="flex items-center space-x-3">
                        <Skeleton className="w-8 h-8 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-3 w-16" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-3 w-12" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* Tokens con balance - solo cuando no esté cargando */}
              {!isLoading && tokenBalances
                .filter(token => !token.error && parseFloat(token.balance) > 0)
                .map((token) => {
                  const price = tokenPrices.find(p => p.id === token.coinGeckoId)?.price || 0;
                  const priceChange24h = tokenPrices.find(p => p.id === token.coinGeckoId)?.priceChange24h || 0;
                  const balanceInUsd = parseFloat(token.balance) * price;
                  
                  return (
                    <div
                      key={token.address}
                      className={`flex items-center justify-between p-3 bg-[var(--app-card-bg)] rounded-lg border transition-all ${
                        selectedTokens.has(token.address) 
                          ? 'border-[var(--app-accent)] bg-[var(--app-accent-light)]' 
                          : 'border-[var(--app-card-border)]'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {/* Checkbox de selección */}
                        <input
                          type="checkbox"
                          checked={selectedTokens.has(token.address)}
                          onChange={() => toggleTokenSelection(token.address)}
                          className="w-4 h-4 text-[var(--app-accent)] bg-[var(--app-card-bg)] border-[var(--app-card-border)] rounded focus:ring-[var(--app-accent)] focus:ring-2"
                        />
                        
                        <div className="w-8 h-8 bg-[var(--app-accent)] rounded-full flex items-center justify-center">
                          <span className="text-[var(--app-background)] text-xs font-bold">
                            {token.symbol.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium text-[var(--app-foreground)]">
                            {token.name}
                          </h4>
                          <p className="text-xs text-[var(--app-foreground-muted)]">
                            {token.symbol}
                          </p>
                          {price > 0 && (
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-xs text-[var(--app-foreground-muted)]">
                                ${price.toFixed(6)}
                              </span>
                              <span className={`text-xs ${priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {priceChange24h >= 0 ? '+' : ''}{priceChange24h.toFixed(2)}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div>
                          <p className="font-mono text-[var(--app-foreground)]">
                            {parseFloat(token.balance).toFixed(6)}
                          </p>
                          <p className="text-xs text-[var(--app-foreground-muted)]">
                            {token.symbol}
                          </p>
                          {balanceInUsd > 0 && (
                            <p className="text-xs text-[var(--app-accent)] font-medium">
                              ${balanceInUsd.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              
              {/* Mensaje cuando no hay tokens con balance - solo cuando no esté cargando */}
              {!isLoading && tokenBalances.filter(token => !token.error && parseFloat(token.balance) > 0).length === 0 && (
                <div className="text-center py-8">
                  <p className="text-[var(--app-foreground-muted)]">
                    No tienes balances en ninguno de estos tokens
                  </p>
                  <p className="text-sm text-[var(--app-foreground-muted)] mt-2">
                    Los tokens aparecerán aquí cuando tengas balances mayores a 0
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
