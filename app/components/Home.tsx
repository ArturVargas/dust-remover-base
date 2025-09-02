import { useState } from "react";
import { DustTokens } from "./DustTokens";
import { TransactionCard } from "./TransactionCard";
import { SelectedTokenInfo } from "../types";

type HomeProps = {
  setActiveTab: (tab: string) => void;
};

export function Home({ setActiveTab }: HomeProps) {
  const [selectedDustTokens, setSelectedDustTokens] = useState<SelectedTokenInfo[]>([]);

  return (
    <div className="space-y-6 animate-fade-in">
      <DustTokens onSelectedTokensChange={setSelectedDustTokens} />
      <TransactionCard selectedTokens={selectedDustTokens} />
    </div>
  );
}
