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
