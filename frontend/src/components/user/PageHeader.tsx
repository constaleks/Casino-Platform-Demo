import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export function PageHeader({
    eyebrow,
    title,
    description,
    backTo = '/dashboard',
    backLabel = 'Back to dashboard',
    children,
}: {
    eyebrow?: string;
    title: string;
    description?: string;
    backTo?: string;
    backLabel?: string;
    children?: ReactNode;
}) {
    return (
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/5 pb-5">
            <div className="min-w-0">
                {eyebrow && <p className="mb-1 text-[11px] font-bold tracking-[0.22em] text-gold/80 uppercase">{eyebrow}</p>}
                <h1 className="text-gold-gradient text-2xl font-black tracking-tight sm:text-3xl">{title}</h1>
                {description && <p className="mt-1.5 max-w-prose text-sm text-white/50">{description}</p>}
            </div>

            <div className="flex items-center gap-3">
                {children}
                <Link
                    to={backTo}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/70 transition-colors hover:border-gold/30 hover:bg-gold/10 hover:text-gold">
                    {backLabel}
                </Link>
            </div>
        </div>
    );
}
