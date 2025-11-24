import { TrendingUp, TrendingDown } from "lucide-react";

interface IndexDisplayProps {
  value: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
}

export const IndexDisplay = ({ value, change, changePercent, open, high, low }: IndexDisplayProps) => {
  const isPositive = change >= 0;

  return (
    <div className="bg-card rounded-lg border border-border p-6 mb-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-2">NIFTY 50</h2>
          <div className="flex items-baseline gap-4">
            <span className="text-4xl font-bold text-foreground">{value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <div className={`flex items-center gap-1 ${isPositive ? 'text-success-text' : 'text-destructive-text'}`}>
              {isPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              <span className="text-lg font-semibold">
                {isPositive ? '+' : ''}{change.toFixed(2)} ({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-8">
          <div>
            <div className="text-xs text-muted-foreground mb-1">OPEN</div>
            <div className="text-sm font-semibold text-foreground">{open.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">HIGH</div>
            <div className="text-sm font-semibold text-foreground">{high.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">LOW</div>
            <div className="text-sm font-semibold text-foreground">{low.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
