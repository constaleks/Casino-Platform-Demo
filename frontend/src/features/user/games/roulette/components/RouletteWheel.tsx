import { useEffect, useLayoutEffect, useRef } from 'react';
import { colorOf } from '@/features/user/games/roulette/utils';
import { cn } from '@/lib/utils';

/*
 * Real single-zero wheel order, clockwise starting from 0
 */
const WHEEL_ORDER = [
    0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28,
    12, 35, 3, 26,
];
const SEGMENT = 360 / WHEEL_ORDER.length;

const FREE_SPEED = 300; // deg/s while waiting for the server
const RAMP_UP_MS = 500; // time to reach FREE_SPEED from rest
const MIN_FREE_MS = 900; // spin at least this long even if the result is instant
const LANDING_MS = 4200; // target duration of the deceleration
const BALL_TRACK_R = 95;
const BALL_POCKET_R = 66;

const POCKET_FILL: Record<'red' | 'black' | 'green', string> = {
    red: 'oklch(0.52 0.2 25)',
    black: 'oklch(0.2 0.01 165)',
    green: 'oklch(0.5 0.13 155)',
};

interface RouletteWheelProps {
    spinning: boolean;
    /* Winning number once the server has answered; null while the spin is in flight */
    result: number | null;
    /* Number to highlight while idle (the last resolved result) */
    highlight?: number | null;
    onSettled: () => void;
    className?: string;
}

interface Landing {
    startedAt: number;
    duration: number;
    wheelFrom: number;
    wheelBy: number;
    ballFrom: number;
    ballBy: number;
}

/*
 * Ease-out cubic: f(0)=0, f(1)=1, f'(0)=3, f'(1)=0. Because the start slope is
 * known, the landing can begin at exactly the free-spin speed (no visible jerk).
 */
const easeOutCubic = (u: number) => 1 - (1 - u) ** 3;

function polar(r: number, deg: number) {
    const rad = (deg * Math.PI) / 180;
    return { x: r * Math.sin(rad), y: -r * Math.cos(rad) };
}

function pocketPath(index: number, inner: number, outer: number) {
    const from = index * SEGMENT - SEGMENT / 2;
    const to = index * SEGMENT + SEGMENT / 2;
    const a = polar(outer, from);
    const b = polar(outer, to);
    const c = polar(inner, to);
    const d = polar(inner, from);
    return `M ${a.x} ${a.y} A ${outer} ${outer} 0 0 1 ${b.x} ${b.y} L ${c.x} ${c.y} A ${inner} ${inner} 0 0 0 ${d.x} ${d.y} Z`;
}

/*
 * Picks a travel distance that ends exactly on `targetMod` (mod 360) and is the
 * whole-turn variant closest to `ideal`, never less than one full extra turn.
 */
function distanceTo(fromAngle: number, targetMod: number, ideal: number) {
    const remainder = (((targetMod - fromAngle) % 360) + 360) % 360;
    const turns = Math.max(1, Math.round((ideal - remainder) / 360));
    return remainder + turns * 360;
}

export function RouletteWheel({ spinning, result, highlight = null, onSettled, className }: RouletteWheelProps) {
    const wheelRef = useRef<SVGGElement>(null);
    const ballOrbitRef = useRef<SVGGElement>(null);
    const ballRef = useRef<SVGCircleElement>(null);

    /*
     * Animation state lives in refs and is written straight to the SVG, so a
     * 60fps loop never triggers a React render
     */
    const anim = useRef({
        mode: 'idle' as 'idle' | 'free' | 'landing',
        wheel: 0,
        ball: 0,
        ballR: BALL_POCKET_R,
        velocity: 0,
        freeStartedAt: 0,
        lastFrame: 0,
        target: null as number | null,
        landing: null as Landing | null,
        frame: 0,
    });
    const onSettledRef = useRef(onSettled);

    useEffect(() => {
        onSettledRef.current = onSettled;
    });

    const paint = () => {
        const a = anim.current;
        wheelRef.current?.setAttribute('transform', `rotate(${a.wheel})`);
        ballOrbitRef.current?.setAttribute('transform', `rotate(${a.ball})`);
        ballRef.current?.setAttribute('cy', String(-a.ballR));
    };

    useLayoutEffect(paint, []);

    useEffect(() => {
        const a = anim.current;
        a.target = result;

        if (!spinning) {
            /* Spin aborted (request failed) - freeze where we are */
            if (a.mode !== 'idle') {
                cancelAnimationFrame(a.frame);
                a.mode = 'idle';
            }
            return;
        }

        if (a.mode !== 'idle') return;

        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        a.mode = 'free';
        a.velocity = 0;
        a.freeStartedAt = performance.now();
        a.lastFrame = a.freeStartedAt;
        a.landing = null;

        const tick = (now: number) => {
            const dt = (now - a.lastFrame) / 1000;
            a.lastFrame = now;

            if (a.mode === 'free') {
                a.velocity = FREE_SPEED * Math.min(1, (now - a.freeStartedAt) / RAMP_UP_MS);
                a.wheel += a.velocity * dt;
                a.ball -= a.velocity * 1.4 * dt;
                a.ballR = BALL_TRACK_R;

                if (a.target !== null && now - a.freeStartedAt >= (reducedMotion ? 0 : MIN_FREE_MS)) {
                    const pocketIndex = WHEEL_ORDER.indexOf(a.target);
                    const duration = reducedMotion ? 900 : LANDING_MS;
                    /* f'(0)=3 → starting speed = 3 * distance / duration; solve for distance */
                    const ideal = (a.velocity * duration) / 1000 / 3;

                    /* Wheel stops with the winning pocket at 12 o'clock... */
                    const wheelBy = distanceTo(a.wheel, 360 - pocketIndex * SEGMENT, ideal);
                    /* ...and the ball (moving the other way) stops at 12 o'clock too */
                    const ballBy = -distanceTo(-a.ball, 0, ideal * 1.4);

                    a.landing = { startedAt: now, duration, wheelFrom: a.wheel, wheelBy, ballFrom: a.ball, ballBy };
                    a.mode = 'landing';
                }
            }

            if (a.mode === 'landing' && a.landing) {
                const l = a.landing;
                const u = Math.min(1, (now - l.startedAt) / l.duration);
                const eased = easeOutCubic(u);
                a.wheel = l.wheelFrom + l.wheelBy * eased;
                a.ball = l.ballFrom + l.ballBy * eased;
                /* Ball rides the outer track, then drops into the pocket over the last stretch */
                const drop = Math.min(1, Math.max(0, (u - 0.55) / 0.35));
                a.ballR = BALL_TRACK_R - (BALL_TRACK_R - BALL_POCKET_R) * easeOutCubic(drop);

                if (u >= 1) {
                    a.wheel %= 360;
                    a.ball %= 360;
                    a.mode = 'idle';
                    paint();
                    onSettledRef.current();
                    return;
                }
            }

            paint();
            a.frame = requestAnimationFrame(tick);
        };

        a.frame = requestAnimationFrame(tick);
    }, [spinning, result]);

    useEffect(() => () => cancelAnimationFrame(anim.current.frame), []);

    return (
        <div className={cn('relative mx-auto aspect-square w-full max-w-[22rem]', className)}>
            <div className="absolute inset-[6%] rounded-full shadow-[0_30px_70px_-15px_oklch(0_0_0/0.9),0_0_60px_-10px_oklch(0.84_0.15_88/0.25)]" />
            <svg viewBox="-110 -110 220 220" className="relative size-full" role="img" aria-label="Roulette wheel">
                <defs>
                    <radialGradient id="wheel-rim" cx="50%" cy="50%" r="50%">
                        <stop offset="88%" stopColor="oklch(0.32 0.06 55)" />
                        <stop offset="100%" stopColor="oklch(0.2 0.04 50)" />
                    </radialGradient>
                    <radialGradient id="wheel-cone" cx="50%" cy="45%" r="55%">
                        <stop offset="0%" stopColor="oklch(0.42 0.07 60)" />
                        <stop offset="100%" stopColor="oklch(0.22 0.04 50)" />
                    </radialGradient>
                    <radialGradient id="wheel-ball" cx="35%" cy="35%" r="65%">
                        <stop offset="0%" stopColor="white" />
                        <stop offset="100%" stopColor="oklch(0.78 0.01 90)" />
                    </radialGradient>
                </defs>

                {/* Static outer bowl + ball track */}
                <circle r="108" fill="url(#wheel-rim)" />
                <circle r="99" fill="oklch(0.17 0.03 165)" stroke="oklch(0.68 0.13 72 / 0.6)" strokeWidth="1" />

                <g ref={wheelRef}>
                    {WHEEL_ORDER.map((number, index) => {
                        const isHighlighted = !spinning && highlight === number;
                        const text = polar(81, index * SEGMENT);
                        return (
                            <g key={number}>
                                <path
                                    d={pocketPath(index, 60, 91)}
                                    fill={POCKET_FILL[colorOf(number)]}
                                    stroke="oklch(0.84 0.15 88 / 0.55)"
                                    strokeWidth="0.6"
                                />
                                <text
                                    x={text.x}
                                    y={text.y}
                                    transform={`rotate(${index * SEGMENT} ${text.x} ${text.y})`}
                                    textAnchor="middle"
                                    dominantBaseline="central"
                                    fontSize="7.5"
                                    fontWeight="700"
                                    fill="white">
                                    {number}
                                </text>
                                {isHighlighted && (
                                    <path
                                        d={pocketPath(index, 60, 91)}
                                        fill="oklch(0.84 0.15 88 / 0.25)"
                                        stroke="oklch(0.84 0.15 88)"
                                        strokeWidth="1.6"
                                    />
                                )}
                            </g>
                        );
                    })}

                    <circle r="60" fill="url(#wheel-cone)" stroke="oklch(0.84 0.15 88 / 0.7)" strokeWidth="1" />
                    {[0, 45, 90, 135].map((deg) => (
                        <rect
                            key={deg}
                            x="-1.6"
                            y="-44"
                            width="3.2"
                            height="88"
                            rx="1.6"
                            transform={`rotate(${deg})`}
                            fill="oklch(0.84 0.15 88 / 0.8)"
                        />
                    ))}
                    <circle r="12" fill="oklch(0.68 0.13 72)" stroke="oklch(0.9 0.1 90)" strokeWidth="1" />
                </g>

                <g ref={ballOrbitRef}>
                    <circle ref={ballRef} cx="0" r="3.6" fill="url(#wheel-ball)" />
                </g>

                {/* Fixed marker at 12 o'clock: the pocket under it is the result */}
                <path d="M -5 -108 L 5 -108 L 0 -99 Z" fill="oklch(0.84 0.15 88)" />
            </svg>
        </div>
    );
}
