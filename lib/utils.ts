import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'VND'): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  // Show "Today", "Yesterday", or relative time for recent dates
  if (days === 0) {
    return `Today at ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
  } else if (days === 1) {
    return `Yesterday at ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
  } else if (days < 7) {
    return `${days} days ago`
  }

  // For older dates, show compact format
  return new Intl.DateTimeFormat('vi-VN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}
