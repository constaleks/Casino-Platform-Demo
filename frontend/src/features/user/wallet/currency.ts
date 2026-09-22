import type { Wallet } from '@/types/model';

export type Currency = Wallet['currency'];

interface CurrencyMeta {
    symbol: string;
    label: string;
    coin: string;
    accent: string;
}

export const CURRENCY_META: Record<Currency, CurrencyMeta> = {
    USD: {
        symbol: '$',
        label: 'US Dollar',
        coin: 'from-gold to-gold-deep',
        accent: 'text-gold',
    },
    EUR: {
        symbol: '€',
        label: 'Euro',
        coin: 'from-chip-blue to-chip-purple',
        accent: 'text-chip-blue',
    },
    DEMO: {
        symbol: '🍀',
        label: 'Demo balance',
        coin: 'from-win to-felt-600',
        accent: 'text-win',
    },
};

export function formatAmount(value: string | number): string {
    const parsed = typeof value === 'string' ? parseFloat(value) : value;

    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number.isNaN(parsed) ? 0 : parsed);
}
