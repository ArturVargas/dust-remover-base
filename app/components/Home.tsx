import { useState } from "react";
import { DustTokens } from "./DustTokens";
import { TransactionCard } from "./TransactionCard";
import { SelectedTokenInfo } from "../types";

export function Home() {
  const [selectedDustTokens, setSelectedDustTokens] = useState<SelectedTokenInfo[]>([]);
  const [needsApproval, setNeedsApproval] = useState(false);

  return (
    <div className="space-y-6 animate-fade-in">
      <DustTokens 
        onSelectedTokensChange={setSelectedDustTokens}
        onApprovalChange={setNeedsApproval} // Pasa la función de callback
      />
      <TransactionCard 
        selectedTokens={selectedDustTokens}
        needsApproval={needsApproval} // Pasa el estado al componente hijo
      />
    </div>
  );
}
