import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { addHours, addDays, addWeeks, addMonths, isBefore } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const timeAgo = (timestamp: Date) => {
  const now = new Date();

  const diffInSeconds = Math.floor(
    (now.getTime() - new Date(timestamp).getTime()) / 1000
  );

  const intervals = [
    { label: "year", value: 60 * 60 * 24 * 365 },
    { label: "month", value: 60 * 60 * 24 * 30 },
    { label: "days", value: 60 * 60 * 24 },
    { label: "hours", value: 60 * 60 },
    { label: "mins", value: 60 },
    { label: "sec", value: 1 },
  ];

  for (let i=0; i < intervals.length; i++){
    const interval =intervals[i]
    const count = Math.floor(diffInSeconds/interval.value)

    if (count>=1) {
      return `${count} ${interval.label} ago`
    }
  }
  return 'just now'
};

export const getRunsInLastNDays = (lastRunAt: Date | null, runCount: number, days: number): number => {
  if (!lastRunAt) return 0; // If no last run, return 0

  const currentDate = new Date();
  const diffInTime = currentDate.getTime() - new Date(lastRunAt).getTime();
  const diffInDays = diffInTime / (1000 * 3600 * 24); // Convert milliseconds to days
  
  if (diffInDays <= days) {
    return runCount;
  }
  return 0;
};


export const getResultsInLastNDays = (lastRunAt: Date | null, runCount: number, days: number): number => {
  if (!lastRunAt) return 0; // If no last run, return 0

  const currentDate = new Date();
  const diffInTime = currentDate.getTime() - new Date(lastRunAt).getTime();
  const diffInDays = diffInTime / (1000 * 3600 * 24); // Convert milliseconds to days
  
  if (diffInDays <= days) {
    return runCount;
  }
  return 0;
}; 




export function shouldReset(lastReset: Date, period: string): boolean {
  const now = new Date();
  const nextReset = {
    hourly: addHours(lastReset, 1),
    daily: addDays(lastReset, 1),
    weekly: addWeeks(lastReset, 1),
    monthly: addMonths(lastReset, 1),
  }[period];

  return isBefore(nextReset as Date, now);
}
