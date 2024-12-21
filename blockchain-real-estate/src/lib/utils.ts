import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatEURCAmount = (amount: bigint) => {
  const EURC_DECIMALS = 6;
  const amountStr = amount.toString();
  if (amountStr.length <= EURC_DECIMALS) {
    return `0.${amountStr.padStart(EURC_DECIMALS, '0')}`;
  }
  const integerPart = amountStr.slice(0, -EURC_DECIMALS);
  const decimalPart = amountStr.slice(-EURC_DECIMALS);
  return `${integerPart}.${decimalPart}`;
};
