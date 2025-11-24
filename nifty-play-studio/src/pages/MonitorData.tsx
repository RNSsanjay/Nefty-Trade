import { useState } from "react";
import { IndexDisplay } from "@/components/IndexDisplay";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Plus, ChevronDown, Radio } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { generateTimeIntervals } from "@/utils/mockData";
import { useRealtimeMarketData } from "@/hooks/useRealtimeMarketData";

interface StrikeColumn {
  id: string;
  strike: number;
  optionType: 'CE' | 'PE';
}

const MonitorData = () => {
  const [date, setDate] = useState<Date>(new Date(2025, 10, 19));
  const [interval, setInterval] = useState("15min");
  const [strikeColumns, setStrikeColumns] = useState<StrikeColumn[]>([
    { id: '1', strike: 25850, optionType: 'CE' },
    { id: '2', strike: 25950, optionType: 'PE' },
    { id: '3', strike: 26000, optionType: 'CE' },
    { id: '4', strike: 25800, optionType: 'PE' },
  ]);

  const { niftyData, getLTP, lastUpdate } = useRealtimeMarketData(3000);
  const timeIntervals = generateTimeIntervals(parseInt(interval));

  const addColumn = () => {
    const newColumn: StrikeColumn = {
      id: Date.now().toString(),
      strike: 26000,
      optionType: 'CE',
    };
    setStrikeColumns([...strikeColumns, newColumn]);
  };

  const updateColumn = (id: string, strike: number, optionType: 'CE' | 'PE') => {
    setStrikeColumns(strikeColumns.map(col => 
      col.id === id ? { ...col, strike, optionType } : col
    ));
  };

  const removeColumn = (id: string) => {
    setStrikeColumns(strikeColumns.filter(col => col.id !== id));
  };

  const generateStrikes = () => {
    const strikes: number[] = [];
    for (let i = 25500; i <= 26500; i += 50) {
      strikes.push(i);
    }
    return strikes;
  };

  const intervalMinutes = interval === '1min' ? 1 : interval === '5min' ? 5 : interval === '15min' ? 15 : interval === '30min' ? 30 : interval === '1h' ? 60 : 375;

  return (
    <div>
      <IndexDisplay {...niftyData} />

      <div className="bg-card rounded-lg border border-border p-4 mb-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">Date:</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[200px] justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "dd MMM yyyy") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(newDate) => newDate && setDate(newDate)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">Interval:</span>
            <Select value={interval} onValueChange={setInterval}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1min">1 min</SelectItem>
                <SelectItem value="5min">5 min</SelectItem>
                <SelectItem value="15min">15 min</SelectItem>
                <SelectItem value="30min">30 min</SelectItem>
                <SelectItem value="1h">1 hour</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
              </SelectContent>
            </Select>
          </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-success animate-pulse" />
            <Badge variant="secondary" className="text-xs">
              Live · {lastUpdate.toLocaleTimeString()}
            </Badge>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-table-header border-b border-table-border">
              <tr>
                <th className="sticky left-0 z-20 bg-table-header px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                  Time
                </th>
                {strikeColumns.map((column) => (
                  <th key={column.id} className="px-4 py-3 text-center text-xs font-semibold text-foreground uppercase tracking-wider min-w-[140px]">
                    <div className="flex items-center justify-center gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-auto p-0 hover:bg-transparent">
                            <span>{column.strike} {column.optionType.toLowerCase()}</span>
                            <ChevronDown className="ml-1 h-3 w-3" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2">
                          <div className="space-y-2">
                            <Select
                              value={column.strike.toString()}
                              onValueChange={(value) => updateColumn(column.id, parseInt(value), column.optionType)}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {generateStrikes().map((strike) => (
                                  <SelectItem key={strike} value={strike.toString()}>
                                    {strike}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Select
                              value={column.optionType}
                              onValueChange={(value: 'CE' | 'PE') => updateColumn(column.id, column.strike, value)}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="CE">Call (CE)</SelectItem>
                                <SelectItem value="PE">Put (PE)</SelectItem>
                              </SelectContent>
                            </Select>
                            {strikeColumns.length > 1 && (
                              <Button
                                variant="destructive"
                                size="sm"
                                className="w-full"
                                onClick={() => removeColumn(column.id)}
                              >
                                Remove
                              </Button>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={addColumn}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {timeIntervals.map((time, idx) => (
                <tr key={time} className="hover:bg-table-hover">
                  <td className="sticky left-0 z-10 bg-card px-4 py-3 text-sm font-medium text-foreground whitespace-nowrap">
                    {time}
                  </td>
                  {strikeColumns.map((column) => {
                    const ltp = getLTP(column.strike, column.optionType);
                    return (
                      <td key={column.id} className="px-4 py-3 text-sm text-center text-foreground font-mono">
                        {ltp > 0 ? ltp.toFixed(2) : '-'}
                      </td>
                    );
                  })}
                  <td></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MonitorData;
