export interface User {
    id: number;
    name: string;
    email: string;
    status: 'active' | 'blocked' | 'suspended';
    wallets?: Wallet[];
}

export interface Wallet {
    id: number;
    currency: 'USD' | 'EUR' | 'DEMO';
    balance: string;
    locked_balance: string;
}

export interface WalletTransaction {
    id: number;
    wallet_id: number;
    type: 'deposit' | 'withdrawal' | 'bet' | 'win' | 'refund' | 'bonus';
    amount: string;
    balance_before: string;
    balance_after: string;
    reference: string | null;
    created_at: string;
    wallet?: { id: number; currency: Wallet['currency'] };
}

export interface Game {
    id: number;
    slug: string;
    name: string;
    type: 'roulette' | 'blackjack' | 'slots';
    is_active: boolean;
    min_bet: string;
    max_bet: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
}
