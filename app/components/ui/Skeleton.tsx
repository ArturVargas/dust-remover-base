// Componente Skeleton para estados de carga
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-300 dark:bg-gray-600 rounded ${className}`} />
  );
}
