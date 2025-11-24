import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import MonitorData from "./MonitorData";
import PaperTrade from "./PaperTrade";
import Orders from "./Orders";

const Index = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'monitor' | 'trade' | 'orders'>('trade');

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold text-foreground">Nifty 50 Options Tracker</h1>
            <nav className="flex gap-1">
              <button
                onClick={() => setActiveTab('trade')}
                className={cn(
                  "px-6 py-2 text-sm font-medium transition-colors relative",
                  activeTab === 'trade'
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Paper Trade
                {activeTab === 'trade' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={cn(
                  "px-6 py-2 text-sm font-medium transition-colors relative",
                  activeTab === 'orders'
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Orders & Positions
                {activeTab === 'orders' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('monitor')}
                className={cn(
                  "px-6 py-2 text-sm font-medium transition-colors relative",
                  activeTab === 'monitor'
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Monitor Data
                {activeTab === 'monitor' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {activeTab === 'monitor' && <MonitorData />}
        {activeTab === 'trade' && <PaperTrade />}
        {activeTab === 'orders' && <Orders />}
      </main>
    </div>
  );
};

export default Index;
