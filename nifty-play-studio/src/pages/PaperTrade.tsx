import { useState, useEffect } from "react";
import { IndexDisplay } from "@/components/IndexDisplay";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Minus, Plus, X, Radio } from "lucide-react";
import { BasketItem } from "@/utils/mockData";
import { useRealtimeMarketData } from "@/hooks/useRealtimeMarketData";
import { apiService } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PaperTrade = () => {
  const [selectedIndex, setSelectedIndex] = useState("NIFTY");
  const [selectedExpiry, setSelectedExpiry] = useState("25 Nov");
  const [basket, setBasket] = useState<BasketItem[]>([]);
  const [sameQty, setSameQty] = useState(true);
  const [defaultQty, setDefaultQty] = useState(1);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [expiryDates, setExpiryDates] = useState<{ label: string; value: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const { niftyData, optionChain, lastUpdate } = useRealtimeMarketData(3000);

  // Fetch expiry dates on component mount
  useEffect(() => {
    const fetchExpiryDates = async () => {
      try {
        const response = await apiService.getAvailableExpiries();
        if (response.success && response.data) {
          setExpiryDates(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch expiry dates:', error);
        // Fallback to mock data if API fails
        setExpiryDates([
          { label: '25 Nov', value: '2025-11-25' },
          { label: '02 Dec', value: '2025-12-02' },
          { label: '09 Dec', value: '2025-12-09' },
          { label: '16 Dec', value: '2025-12-16' },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchExpiryDates();
  }, []);

  const addToBasket = (strike: number, optionType: 'CE' | 'PE', action: 'BUY' | 'SELL', price: number) => {
    const newItem: BasketItem = {
      id: Date.now().toString(),
      strike,
      optionType,
      action,
      quantity: defaultQty,
      price,
      expiryDate: selectedExpiry,
      orderType: 'MARKET',
      limitPrice: price,
    };
    setBasket([...basket, newItem]);
    toast.success(`Added ${strike} ${optionType} to basket`);
  };

  const removeFromBasket = (id: string) => {
    setBasket(basket.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setBasket(basket.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const updateOrderType = (id: string, orderType: 'MARKET' | 'LIMIT') => {
    setBasket(basket.map(item =>
      item.id === id ? { ...item, orderType } : item
    ));
  };

  const updateLimitPrice = (id: string, limitPrice: number) => {
    setBasket(basket.map(item =>
      item.id === id ? { ...item, limitPrice } : item
    ));
  };

  const clearBasket = () => {
    setBasket([]);
    toast.info("Basket cleared");
  };

  const calculateRequirement = () => {
    return basket.reduce((sum, item) => sum + (item.price * item.quantity * 75), 0);
  };

  const initiateOrder = () => {
    if (basket.length === 0) {
      toast.error("Basket is empty");
      return;
    }
    setShowConfirmDialog(true);
  };

  const confirmOrder = async () => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const isMarketHours = (hour > 9 || (hour === 9 && minute >= 15)) && (hour < 15 || (hour === 15 && minute <= 30));

    if (!isMarketHours) {
      toast.error("Orders can only be placed during market hours (9:15 AM - 3:30 PM)");
      setShowConfirmDialog(false);
      return;
    }

    try {
      // Place orders via API
      for (const item of basket) {
        const orderData = {
          symbol: selectedIndex,
          strike: item.strike,
          type: item.optionType,
          expiry: item.expiryDate,
          side: item.action,
          quantity: item.quantity,
          orderType: item.orderType,
          limitPrice: item.limitPrice,
        };

        await apiService.placeOrder(orderData);
      }

      toast.success(`Order placed successfully! ${basket.length} items executed.`);
      setBasket([]);
      setShowConfirmDialog(false);
    } catch (error) {
      console.error('Failed to place order:', error);
      toast.error('Failed to place order. Please try again.');
    }
  };

  return (
    <div>
      <IndexDisplay {...niftyData} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Option Chain */}
        <div className="lg:col-span-2 bg-card rounded-lg border border-border overflow-hidden">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Select value={selectedIndex} onValueChange={setSelectedIndex}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NIFTY">NIFTY</SelectItem>
                    <SelectItem value="BANKNIFTY">BANKNIFTY</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedExpiry} onValueChange={setSelectedExpiry}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {expiryDates.map((date) => (
                      <SelectItem key={date.value} value={date.label}>
                        {date.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-success animate-pulse" />
                <Badge variant="secondary" className="text-xs">
                  Live · {lastUpdate.toLocaleTimeString()}
                </Badge>
              </div>
            </div>
          </div>

          <div className="overflow-y-auto max-h-[600px]">
            <table className="w-full">
              <thead className="bg-table-header sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-foreground uppercase tracking-wider">Actions</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-foreground uppercase tracking-wider">Call LTP</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-foreground uppercase tracking-wider">Strike</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Put LTP</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {optionChain.map((option) => {
                  const isATM = Math.abs(option.strike - niftyData.value) < 25;
                  return (
                    <tr key={option.strike} className={cn("hover:bg-table-hover", isATM && "bg-accent")}>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 w-7 p-0 text-xs font-semibold text-buy hover:bg-success-light"
                            onClick={() => addToBasket(option.strike, 'CE', 'BUY', option.ce?.ltp || 0)}
                          >
                            B
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 w-7 p-0 text-xs font-semibold text-sell hover:bg-destructive-light"
                            onClick={() => addToBasket(option.strike, 'CE', 'SELL', option.ce?.ltp || 0)}
                          >
                            S
                          </Button>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="text-sm font-semibold text-foreground">{option.ce?.ltp?.toFixed(2) || 'N/A'}</div>
                        <div className={cn("text-xs", option.ce?.change >= 0 ? "text-success-text" : "text-destructive-text")}>
                          {option.ce?.change >= 0 ? '+' : ''}{option.ce?.changePercent?.toFixed(2) || 'N/A'}%
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <div className={cn("text-sm font-bold", isATM ? "text-primary" : "text-foreground")}>
                          {option.strike}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-left">
                        <div className="text-sm font-semibold text-foreground">{option.pe?.ltp?.toFixed(2) || 'N/A'}</div>
                        <div className={cn("text-xs", option.pe?.change >= 0 ? "text-success-text" : "text-destructive-text")}>
                          {option.pe?.change >= 0 ? '+' : ''}{option.pe?.changePercent?.toFixed(2) || 'N/A'}%
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 w-7 p-0 text-xs font-semibold text-buy hover:bg-success-light"
                            onClick={() => addToBasket(option.strike, 'PE', 'BUY', option.pe?.ltp || 0)}
                          >
                            B
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 w-7 p-0 text-xs font-semibold text-sell hover:bg-destructive-light"
                            onClick={() => addToBasket(option.strike, 'PE', 'SELL', option.pe?.ltp || 0)}
                          >
                            S
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Trading Basket */}
        <div className="bg-card rounded-lg border border-border h-fit sticky top-4">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-foreground">
                {selectedIndex} Basket ({basket.length})
              </h3>
              {basket.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearBasket}>
                  Clear all
                </Button>
              )}
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="sameQty"
                  checked={sameQty}
                  onCheckedChange={(checked) => setSameQty(checked as boolean)}
                />
                <label htmlFor="sameQty" className="text-sm text-foreground cursor-pointer">
                  Same quantity for all
                </label>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground">Default Lots:</label>
                <Input
                  type="number"
                  min="1"
                  value={defaultQty}
                  onChange={(e) => setDefaultQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 h-8"
                />
              </div>
            </div>
          </div>

          <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
            {basket.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Add options to basket to start trading
              </div>
            ) : (
              basket.map((item) => (
                <div key={item.id} className="p-3 bg-card border border-border rounded-lg space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${item.action === 'BUY' ? 'bg-primary text-primary-foreground' : 'bg-destructive text-destructive-foreground'
                          }`}>
                          {item.action}
                        </span>
                        <span className="text-sm font-medium text-foreground">
                          NIFTY {item.expiryDate} {item.strike} {item.optionType === 'CE' ? 'Call' : 'Put'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Market Price: ₹{item.price.toFixed(2)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => removeFromBasket(item.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Order Type Selection */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant={item.orderType === 'MARKET' ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1 h-8"
                      onClick={() => updateOrderType(item.id, 'MARKET')}
                    >
                      MARKET
                    </Button>
                    <Button
                      variant={item.orderType === 'LIMIT' ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1 h-8"
                      onClick={() => updateOrderType(item.id, 'LIMIT')}
                    >
                      LIMIT
                    </Button>
                  </div>

                  {/* Limit Price Input */}
                  {item.orderType === 'LIMIT' && (
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-muted-foreground whitespace-nowrap">Limit Price:</label>
                      <Input
                        type="number"
                        step="0.05"
                        value={item.limitPrice || item.price}
                        onChange={(e) => updateLimitPrice(item.id, parseFloat(e.target.value) || item.price)}
                        className="h-8 text-sm"
                      />
                    </div>
                  )}

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.id, -1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-sm font-semibold text-foreground w-12 text-center">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.id, 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Lot{item.quantity > 1 ? 's' : ''} ({item.quantity * 75} shares)
                    </span>
                  </div>

                  {/* Total Value */}
                  <div className="pt-2 border-t border-border">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Total Value:</span>
                      <span className="font-semibold text-foreground">
                        ₹{((item.orderType === 'MARKET' ? item.price : (item.limitPrice || item.price)) * item.quantity * 75).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {basket.length > 0 && (
            <div className="p-4 border-t border-border space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Balance</span>
                <span className="font-semibold text-foreground">Unlimited</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Approx requirement</span>
                <span className="font-semibold text-foreground">
                  ₹{calculateRequirement().toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </span>
              </div>
              <Button
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                size="lg"
                onClick={initiateOrder}
              >
                Place Order
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Basket orders are allowed only during market hours
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Order Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Order</DialogTitle>
            <DialogDescription>
              Review your order details before placing
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4">
            {basket.map((item) => {
              const executionPrice = item.orderType === 'MARKET' ? item.price : (item.limitPrice || item.price);
              const totalValue = executionPrice * item.quantity * 75;

              return (
                <div key={item.id} className="p-3 bg-muted/50 rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={item.action === 'BUY' ? 'default' : 'destructive'} className="text-xs">
                      {item.action}
                    </Badge>
                    <span className="text-sm font-medium">
                      {item.strike} {item.optionType}
                    </span>
                    <Badge variant="outline" className="text-xs ml-auto">
                      {item.orderType}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Quantity:</span>
                      <span className="ml-1 font-semibold">{item.quantity} Lot{item.quantity > 1 ? 's' : ''}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Shares:</span>
                      <span className="ml-1 font-semibold">{item.quantity * 75}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Price:</span>
                      <span className="ml-1 font-semibold">₹{executionPrice.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total:</span>
                      <span className="ml-1 font-semibold">₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="pt-3 border-t border-border">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Requirement:</span>
                <span className="text-lg font-bold text-primary">
                  ₹{calculateRequirement().toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmOrder} className="bg-success hover:bg-success/90">
              Confirm & Place Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaperTrade;
