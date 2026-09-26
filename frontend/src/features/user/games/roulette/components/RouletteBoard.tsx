import { colorOf } from '@/features/user/games/roulette/utils';
import { cn } from '@/lib/utils';

interface RouletteBoardProps {
    onBet: (betType: string, betValue: Record<string, unknown>, label: string) => void;
    disabled: boolean;
}

const ROWS = Array.from({ length: 12 }, (_, r) => [r * 3 + 1, r * 3 + 2, r * 3 + 3]);

function cellColorClasses(number: number) {
    const color = colorOf(number);
    if (color === 'red') return 'bg-red-600 hover:bg-red-500 text-white';
    if (color === 'black') return 'bg-neutral-900 hover:bg-neutral-800 text-white';
    return 'bg-green-700 hover:bg-green-600 text-white';
}

export function RouletteBoard({ onBet, disabled }: RouletteBoardProps) {
    return (
        <div className={cn('flex flex-col gap-2', disabled && 'pointer-events-none opacity-50')}>
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={() => onBet('straight', { numbers: [0] }, 'Straight 0')}
                    className={cn('flex h-14 w-14 shrink-0 items-center justify-center rounded font-bold', cellColorClasses(0))}>
                    0
                </button>

                <div className="grid flex-1 grid-cols-3 gap-1">
                    {ROWS.map((row) =>
                        row.map((number) => (
                            <button
                                key={number}
                                type="button"
                                onClick={() => onBet('straight', { numbers: [number] }, `Straight ${number}`)}
                                className={cn('flex h-10 items-center justify-center rounded font-semibold', cellColorClasses(number))}>
                                {number}
                            </button>
                        )),
                    )}
                </div>
            </div>

            <div className="grid grid-cols-3 gap-1">
                <OutsideBetButton onClick={() => onBet('column', { column: 1 }, 'Column 1')}>Column 1</OutsideBetButton>
                <OutsideBetButton onClick={() => onBet('column', { column: 2 }, 'Column 2')}>Column 2</OutsideBetButton>
                <OutsideBetButton onClick={() => onBet('column', { column: 3 }, 'Column 3')}>Column 3</OutsideBetButton>
            </div>

            <div className="grid grid-cols-3 gap-1">
                <OutsideBetButton onClick={() => onBet('dozen', { dozen: 1 }, '1st Dozen')}>1st 12</OutsideBetButton>
                <OutsideBetButton onClick={() => onBet('dozen', { dozen: 2 }, '2nd Dozen')}>2nd 12</OutsideBetButton>
                <OutsideBetButton onClick={() => onBet('dozen', { dozen: 3 }, '3rd Dozen')}>3rd 12</OutsideBetButton>
            </div>

            <div className="grid grid-cols-6 gap-1">
                <OutsideBetButton onClick={() => onBet('low', {}, '1-18')}>1-18</OutsideBetButton>
                <OutsideBetButton onClick={() => onBet('even', {}, 'Even')}>Even</OutsideBetButton>
                <OutsideBetButton onClick={() => onBet('red', {}, 'Red')} className="bg-red-600 text-white">
                    Red
                </OutsideBetButton>
                <OutsideBetButton onClick={() => onBet('black', {}, 'Black')} className="bg-neutral-900 text-white">
                    Black
                </OutsideBetButton>
                <OutsideBetButton onClick={() => onBet('odd', {}, 'Odd')}>Odd</OutsideBetButton>
                <OutsideBetButton onClick={() => onBet('high', {}, '19-36')}>19–36</OutsideBetButton>
            </div>
        </div>
    );
}

function OutsideBetButton({ onClick, children, className }: { onClick: () => void; children: React.ReactNode; className?: string }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn('rounded border bg-muted p-2 text-sm font-medium hover:bg-muted/70', className)}>
            {children}
        </button>
    );
}
