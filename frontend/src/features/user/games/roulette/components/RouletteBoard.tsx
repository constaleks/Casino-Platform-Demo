import { colorOf } from '@/features/user/games/roulette/utils';
import { cn } from '@/lib/utils';

interface RouletteBoardProps {
    onBet: (betType: string, betValue: Record<string, unknown>, label: string) => void;
    disabled: boolean;
}

/* Vertical layout (phones): 12 rows of 1-2-3 */
const ROWS = Array.from({ length: 12 }, (_, r) => [r * 3 + 1, r * 3 + 2, r * 3 + 3]);

/*
 * Horizontal layout (md+), the way a real table reads: 3 rows x 12 columns,
 * top row 3,6,...,36 (column 3), bottom row 1,4,...,34 (column 1)
 */
const TABLE_ROWS = [3, 2, 1].map((offset) => ({
    column: offset,
    numbers: Array.from({ length: 12 }, (_, c) => c * 3 + offset),
}));

const EVEN_MONEY_BETS = [
    { betType: 'low', label: '1-18', text: '1–18' },
    { betType: 'even', label: 'Even', text: 'Even' },
    { betType: 'red', label: 'Red', text: 'Red', className: 'bg-red-600 text-white hover:bg-red-500' },
    { betType: 'black', label: 'Black', text: 'Black', className: 'bg-neutral-900 text-white hover:bg-neutral-800' },
    { betType: 'odd', label: 'Odd', text: 'Odd' },
    { betType: 'high', label: '19-36', text: '19–36' },
];

const DOZEN_BETS = [
    { dozen: 1, label: '1st Dozen', text: '1st 12' },
    { dozen: 2, label: '2nd Dozen', text: '2nd 12' },
    { dozen: 3, label: '3rd Dozen', text: '3rd 12' },
];

function cellColorClasses(number: number) {
    const color = colorOf(number);
    if (color === 'red') return 'bg-red-600 hover:bg-red-500 text-white';
    if (color === 'black') return 'bg-neutral-900 hover:bg-neutral-800 text-white';
    return 'bg-green-700 hover:bg-green-600 text-white';
}

export function RouletteBoard({ onBet, disabled }: RouletteBoardProps) {
    const betStraight = (number: number) => onBet('straight', { numbers: [number] }, `Straight ${number}`);

    return (
        <div className={cn(disabled && 'pointer-events-none opacity-50')}>
            <div className="hidden grid-cols-[3rem_repeat(12,minmax(0,1fr))_3.5rem] gap-1 md:grid">
                <button
                    type="button"
                    onClick={() => betStraight(0)}
                    style={{ gridRow: '1 / span 3' }}
                    className={cn('flex items-center justify-center rounded font-bold', cellColorClasses(0))}>
                    0
                </button>

                {TABLE_ROWS.map((row, r) => (
                    <div key={row.column} className="contents">
                        {row.numbers.map((number, c) => (
                            <button
                                key={number}
                                type="button"
                                onClick={() => betStraight(number)}
                                style={{ gridRow: r + 1, gridColumn: c + 2 }}
                                className={cn('flex h-11 items-center justify-center rounded font-semibold', cellColorClasses(number))}>
                                {number}
                            </button>
                        ))}
                        <OutsideBetButton
                            onClick={() => onBet('column', { column: row.column }, `Column ${row.column}`)}
                            style={{ gridRow: r + 1, gridColumn: 14 }}
                            className="px-1 text-xs">
                            2 to 1
                        </OutsideBetButton>
                    </div>
                ))}

                {DOZEN_BETS.map((bet, i) => (
                    <OutsideBetButton
                        key={bet.dozen}
                        onClick={() => onBet('dozen', { dozen: bet.dozen }, bet.label)}
                        style={{ gridRow: 4, gridColumn: `${i * 4 + 2} / span 4` }}>
                        {bet.text}
                    </OutsideBetButton>
                ))}

                {EVEN_MONEY_BETS.map((bet, i) => (
                    <OutsideBetButton
                        key={bet.betType}
                        onClick={() => onBet(bet.betType, {}, bet.label)}
                        style={{ gridRow: 5, gridColumn: `${i * 2 + 2} / span 2` }}
                        className={bet.className}>
                        {bet.text}
                    </OutsideBetButton>
                ))}
            </div>

            <div className="flex flex-col gap-2 md:hidden">
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => betStraight(0)}
                        className={cn('flex h-14 w-14 shrink-0 items-center justify-center rounded font-bold', cellColorClasses(0))}>
                        0
                    </button>

                    <div className="grid flex-1 grid-cols-3 gap-1">
                        {ROWS.map((row) =>
                            row.map((number) => (
                                <button
                                    key={number}
                                    type="button"
                                    onClick={() => betStraight(number)}
                                    className={cn('flex h-10 items-center justify-center rounded font-semibold', cellColorClasses(number))}>
                                    {number}
                                </button>
                            )),
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-1">
                    {[1, 2, 3].map((column) => (
                        <OutsideBetButton key={column} onClick={() => onBet('column', { column }, `Column ${column}`)}>
                            Column {column}
                        </OutsideBetButton>
                    ))}
                </div>

                <div className="grid grid-cols-3 gap-1">
                    {DOZEN_BETS.map((bet) => (
                        <OutsideBetButton key={bet.dozen} onClick={() => onBet('dozen', { dozen: bet.dozen }, bet.label)}>
                            {bet.text}
                        </OutsideBetButton>
                    ))}
                </div>

                <div className="grid grid-cols-6 gap-1">
                    {EVEN_MONEY_BETS.map((bet) => (
                        <OutsideBetButton key={bet.betType} onClick={() => onBet(bet.betType, {}, bet.label)} className={bet.className}>
                            {bet.text}
                        </OutsideBetButton>
                    ))}
                </div>
            </div>
        </div>
    );
}

function OutsideBetButton({
    onClick,
    children,
    className,
    style,
}: {
    onClick: () => void;
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            style={style}
            className={cn('rounded border bg-muted p-2 text-sm font-medium hover:bg-muted/70', className)}>
            {children}
        </button>
    );
}
