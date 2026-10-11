import userBg from '@/assets/images/user-background.png';

/* Background stack: felt photo, darkening wash, and a warm spotlight. */
export function LayoutBackdrop() {
    return (
        <>
            <div className="fixed inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${userBg})` }} />
            <div className="fixed inset-0 bg-gradient-to-b from-felt-900/75 via-felt-900/80 to-felt-900/95" />
            <div
                className="fixed inset-0 animate-pulse-glow"
                style={{
                    background:
                        'radial-gradient(60% 45% at 50% 0%, oklch(0.84 0.15 88 / 0.16), transparent 70%), radial-gradient(45% 40% at 85% 90%, oklch(0.64 0.19 305 / 0.14), transparent 70%)',
                }}
            />
        </>
    );
}
