const RED_NUMBERS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);

export function colorOf(number: number): 'red' | 'black' | 'green' {
    if (number === 0) return 'green';
    return RED_NUMBERS.has(number) ? 'red' : 'black';
}

export interface PendingBet {
    key: string;
    bet_type: string;
    bet_value: Record<string, unknown>;
    amount: number;
    label: string;
}

export function betKey(betType: string, betValue: Record<string, unknown>): string {
    return `${betType}:${JSON.stringify(betValue)}`;
}
