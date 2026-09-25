<?php

namespace App\Domain\Games\Roulette;

class RouletteEngine
{
    private const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

    /*
     * Payout multiplier (profit ratio, "X to 1") per supported bet type
     */
    private const MULTIPLIERS = [
        'straight' => 35,
        'red' => 1,
        'black' => 1,
        'even' => 1,
        'odd' => 1,
        'low' => 1,
        'high' => 1,
        'dozen' => 2,
        'column' => 2,
    ];

    public static function colorOf(int $number): string
    {
        if ($number === 0) {
            return 'green';
        }

        return in_array($number, self::RED_NUMBERS, true) ? 'red' : 'black';
    }

    /*
     * Casino convention: 0 loses on every even-money outside bet
     * (even, odd, low, high, red, black) - not mathematically "even" here
     */
    public static function isEven(int $number): bool
    {
        return $number !== 0 && $number % 2 === 0;
    }

    public static function isOdd(int $number): bool
    {
        return $number !== 0 && $number % 2 === 1;
    }

    public static function isLow(int $number): bool
    {
        return $number >= 1 && $number <= 18;
    }

    public static function isHigh(int $number): bool
    {
        return $number >= 19 && $number <= 36;
    }

    public static function dozenOf(int $number): ?int
    {
        return $number === 0 ? null : (int) ceil($number / 12);
    }

    public static function columnOf(int $number): ?int
    {
        if ($number === 0) {
            return null;
        }

        $mod = $number % 3;

        return $mod === 0 ? 3 : $mod;
    }

    /*
     * Full description of a winning number, stored on game_rounds.result
     */
    public static function describeResult(int $number): array
    {
        return [
            'number' => $number,
            'color' => self::colorOf($number),
            'parity' => $number === 0 ? null : (self::isEven($number) ? 'even' : 'odd'),
            'dozen' => self::dozenOf($number),
            'column' => self::columnOf($number),
            'range' => $number === 0 ? null : (self::isLow($number) ? 'low' : 'high'),
        ];
    }

    public static function supportedBetTypes(): array
    {
        return array_keys(self::MULTIPLIERS);
    }

    public static function multiplierFor(string $betType): float
    {
        return self::MULTIPLIERS[$betType];
    }

    public static function isWinningBet(string $betType, array $betValue, int $winningNumber): bool
    {
        return match ($betType) {
            'straight' => in_array($winningNumber, $betValue['numbers'] ?? [], true),
            'red' => self::colorOf($winningNumber) === 'red',
            'black' => self::colorOf($winningNumber) === 'black',
            'even' => self::isEven($winningNumber),
            'odd' => self::isOdd($winningNumber),
            'low' => self::isLow($winningNumber),
            'high' => self::isHigh($winningNumber),
            'dozen' => self::dozenOf($winningNumber) === ($betValue['dozen'] ?? null),
            'column' => self::columnOf($winningNumber) === ($betValue['column'] ?? null),
            default => false,
        };
    }
}