import { cn } from 'cn';

export function Skeleton({ className }: { className?: string }) {
    return <div className={cn('shimmer-surface animate-shimmer rounded-lg bg-white/5', className)} />;
}

export function ChipSpinner({ className }: { className?: string }) {
    return (
        <span
            aria-hidden="true"
            className={cn(
                'inline-block size-5 animate-chip-spin rounded-full border-2 border-dashed border-gold/80 border-t-transparent',
                className,
            )}
        />
    );
}

export function LoadingPanel({ label = 'Loading', className }: { label?: string; className?: string }) {
    return (
        <div className={cn('flex flex-col items-center justify-center gap-3 py-10 text-center', className)}>
            <ChipSpinner className="size-8" />
            <p className="text-xs font-semibold tracking-[0.2em] text-white/40 uppercase">{label}</p>
        </div>
    );
}
