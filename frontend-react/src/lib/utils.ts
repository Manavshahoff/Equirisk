import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getNextTradeId(trades: { trade_id: string }[]): string {
  const maxNumber = trades.reduce((max, trade) => {
    const match = trade.trade_id.match(/^T(\d+)$/);

    if (!match) {
      return max;
    }

    const number = Number(match[1]);
    return number > max ? number : max;
  }, 0);

  const nextNumber = maxNumber + 1;

  return `T${String(nextNumber).padStart(3, "0")}`;
}