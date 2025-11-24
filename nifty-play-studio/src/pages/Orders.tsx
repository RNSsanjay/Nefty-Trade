import { useState, useEffect } from "react";
import { IndexDisplay } from "@/components/IndexDisplay";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BasketItem } from "@/utils/mockData";
import { useRealtimeMarketData } from "@/hooks/useRealtimeMarketData";
import { apiService } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Radio } from "lucide-react";

interface Order extends BasketItem {
  orderId: string;
  orderTime: string;
  status: 'Executed' | 'Pending' | 'Cancelled';
  totalValue: number;
  shares: number;
}

interface Position {
  id: string;
  strike: number;
  optionType: 'CE' | 'PE';
  action: 'BUY' | 'SELL';
  quantity: number;
  entryPrice: number;
  currentLTP: number;
  shares: number;
  pnl: number;
  pnlPercent: number;
  expiryDate: string;
}

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const { niftyData, optionChain, lastUpdate } = useRealtimeMarketData(3000);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await apiService.getOrders();
        if (response.success && response.data) {
          setOrders(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      }
    };

    const fetchPortfolio = async () => {
      try {
        const response = await apiService.getPortfolio();
        if (response.success && response.data) {
          setPositions(response.data.positions || []);
        }
      } catch (error) {
        console.error('Failed to fetch portfolio:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
    fetchPortfolio();
  }, []);

  // Update positions with real-time LTP
  useEffect(() => {
    if (positions.length > 0) {
      const updatedPositions = positions.map(position => {
        const currentLTP = optionChain.find(opt => opt.strike === position.strike)?.[position.optionType.toLowerCase() as 'ce' | 'pe']?.ltp || position.currentLTP;
        const pnl = position.action === 'BUY'
          ? (currentLTP - position.entryPrice) * position.shares
          : (position.entryPrice - currentLTP) * position.shares;
        const pnlPercent = ((currentLTP - position.entryPrice) / position.entryPrice) * 100;

        return {
          ...position,
          currentLTP,
          pnl,
          pnlPercent: position.action === 'BUY' ? pnlPercent : -pnlPercent,
        };
      });
      setPositions(updatedPositions);
    }
  }, [optionChain, positions.length]);

  const totalPnL = positions.reduce((sum, pos) => sum + pos.pnl, 0);
  const totalInvested = positions.reduce((sum, pos) => sum + (pos.entryPrice * pos.shares), 0);

  const exitPosition = async (positionId: string) => {
    const position = positions.find(p => p.id === positionId);
    if (!position) return;

    try {
      // For now, we'll just remove from local state since the API might not have an exit endpoint
      // In a real implementation, you'd call an API to close the position
      setPositions(positions.filter(p => p.id !== positionId));
      toast.success('Position closed successfully');
    } catch (error) {
      console.error('Failed to exit position:', error);
      toast.error('Failed to exit position');
    }
  };

  const exitAllPositions = () => {
    setPositions([]);
    toast.success(`All positions closed. Total P&L: ₹${totalPnL.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`);
  };

  return (
    <div>
      <IndexDisplay {...niftyData} />

      <Tabs defaultValue="positions" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="positions">Positions ({positions.length})</TabsTrigger>
          <TabsTrigger value="orders">Order History ({orders.length})</TabsTrigger>
        </TabsList>

        {/* Positions Tab */}
        <TabsContent value="positions" className="space-y-4">
          {positions.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No active positions</p>
              <p className="text-sm text-muted-foreground mt-2">
                Place orders from Paper Trade to see positions here
              </p>
            </Card>
          ) : (
            <>
              {/* Overall P&L Card */}
              <Card className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Radio className="h-4 w-4 text-success animate-pulse" />
                      <Badge variant="secondary" className="text-xs">
                        Live · {lastUpdate.toLocaleTimeString()}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total P&L</p>
                      <p className={cn("text-2xl font-bold", totalPnL >= 0 ? "text-success-text" : "text-destructive-text")}>
                        {totalPnL >= 0 ? '+' : ''}₹{totalPnL.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Active Positions</p>
                      <p className="text-2xl font-bold text-foreground">{positions.length}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <div>
                      <p className="text-xs text-muted-foreground">Invested</p>
                      <p className="text-sm font-semibold text-foreground">₹{totalInvested.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Current Value</p>
                      <p className="text-sm font-semibold text-foreground">₹{(totalInvested + totalPnL).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={exitAllPositions}
                    >
                      Exit All
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Positions List */}
              <div className="space-y-3">
                {positions.map((position) => (
                  <Card key={position.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={position.action === 'BUY' ? 'default' : 'destructive'} className="text-xs">
                              {position.action}
                            </Badge>
                            <span className="text-sm font-semibold text-foreground">
                              NIFTY {position.expiryDate} {position.strike} {position.optionType === 'CE' ? 'Call' : 'Put'}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {position.quantity} Lot{position.quantity > 1 ? 's' : ''} • {position.shares} Shares
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={cn("text-lg font-bold", position.pnl >= 0 ? "text-success-text" : "text-destructive-text")}>
                            {position.pnl >= 0 ? '+' : ''}₹{Math.abs(position.pnl).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          </div>
                          <div className={cn("text-xs", position.pnl >= 0 ? "text-success-text" : "text-destructive-text")}>
                            ({position.pnlPercent >= 0 ? '+' : ''}{position.pnlPercent.toFixed(2)}%)
                          </div>
                        </div>
                      </div>

                      {/* Price Details */}
                      <div className="grid grid-cols-4 gap-3 pt-3 border-t border-border">
                        <div>
                          <p className="text-xs text-muted-foreground">Entry Price</p>
                          <p className="text-sm font-semibold text-foreground">₹{position.entryPrice.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Current LTP</p>
                          <p className="text-sm font-semibold text-foreground">₹{position.currentLTP.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Invested</p>
                          <p className="text-sm font-semibold text-foreground">
                            ₹{(position.entryPrice * position.shares).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Current Value</p>
                          <p className="text-sm font-semibold text-foreground">
                            ₹{(position.currentLTP * position.shares).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>

                      {/* Exit Button */}
                      <div className="pt-3 border-t border-border">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => exitPosition(position.id)}
                        >
                          Exit Position
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        {/* Order History Tab */}
        <TabsContent value="orders" className="space-y-4">
          {orders.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No orders yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Your executed orders will appear here
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <Card key={order.orderId} className="p-4">
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant={order.action === 'BUY' ? 'default' : 'destructive'}
                            className="text-xs"
                          >
                            {order.action}
                          </Badge>
                          <span className="text-sm font-semibold text-foreground">
                            NIFTY {order.expiryDate} {order.strike} {order.optionType === 'CE' ? 'Call' : 'Put'}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Order ID: {order.orderId}
                        </div>
                      </div>
                      <Badge
                        variant={order.status === 'Executed' ? 'default' : 'secondary'}
                        className={cn(
                          order.status === 'Executed' && "bg-success text-success-foreground"
                        )}
                      >
                        {order.status}
                      </Badge>
                    </div>

                    {/* Order Details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-border">
                      <div>
                        <p className="text-xs text-muted-foreground">Quantity</p>
                        <p className="text-sm font-semibold text-foreground">
                          {order.quantity} Lot{order.quantity > 1 ? 's' : ''}
                        </p>
                        <p className="text-xs text-muted-foreground">{order.shares} Shares</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Price</p>
                        <p className="text-sm font-semibold text-foreground">₹{order.price.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Total Value</p>
                        <p className="text-sm font-semibold text-foreground">
                          ₹{order.totalValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="text-left md:text-right">
                        <p className="text-xs text-muted-foreground">Order Time</p>
                        <p className="text-sm font-semibold text-foreground">{order.orderTime}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Orders;
