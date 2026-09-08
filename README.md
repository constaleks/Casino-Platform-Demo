# Casino Platform Demo

A pet project of an online casino platform built with Laravel and React. The goal is to practice full-stack development: authentication, user dashboard, working with money (virtual balance), real-time updates via WebSocket and building an extensible architecture for multiple games.

> ⚠️ **Disclaimer:** this is a learning project with no real money involved. Only a demo balance is used. The project is not intended or licensed for real-money gambling.

## Tech Stack

**Backend**

- Laravel 13
- PostgreSQL - primary database
- Laravel Sanctum - SPA authentication (cookie-based)
- Laravel Reverb - WebSocket, real-time updates
- Laravel Telescope - debugging (local/staging)

**Frontend**

- React 19
- TypeScript
- Vite
- React Router
- Tailwind CSS
- shadcn/ui
- Laravel Echo

**Infrastructure**

- Docker - Containerized development environment
- Docker Compose - Multi-container orchestration

## Architecture

The app runs entirely in Docker: backend, frontend, database and WebSocket server each run in their own container:

| Service | Container        | Purpose                           | Port        |
| ------- | ---------------- | --------------------------------- | ----------- |
| nginx   | `casino_nginx`   | Web server                        | 8876 → 80   |
| app     | `casino_app`     | PHP-FPM (Laravel)                 | –           |
| db      | `casino_db`      | PostgreSQL                        | 8101 → 5432 |
| pgadmin | `casino_pgadmin` | Database GUI                      | 8102 → 80   |
| reverb  | `casino_reverb`  | WebSocket server (Laravel Reverb) | 8080 → 8080 |
| node    | `casino_node`    | Vite dev server (React frontend)  | 5173 → 5173 |

The React SPA communicates with the Laravel API over HTTP and subscribes to Reverb over WebSocket for real-time updates.

## Core Principles

- **Money:** the wallet balance is never mutated directly. Every change goes through a transaction ledger recording `balance_before`/`balance_after`. Debits/credits are atomic operations using row-level locking.
- **Fairness:** game results are generated using a provably fair scheme (server seed + client seed + nonce). The seed hash is published before the round and the seed itself is revealed afterward, so the result can be independently verified.
- **Extensibility:** the core structure is designed to support adding new games (blackjack, slots, whatever else...) without changing the base schema.

### Why PostgreSQL

PostgreSQL was chosen over MySQL/SQLite for a few reasons that matter specifically for handling money and game fairness:

- **Strict typing and predictable numeric behavior** - `NUMERIC`/`DECIMAL` arithmetic is stricter and more predictable than in MySQL, which matters for wallet balances and payouts where floating-point rounding errors are unacceptable.
- **Reliable row-level locking** - `SELECT ... FOR UPDATE` behaves predictably under concurrent access, which is required for safely handling simultaneous bets against the same wallet (see below).
- **JSONB** - efficient, indexable storage for semi-structured data such as round results and bet details, without needing a separate table per game type.
- **CHECK constraints** - used as a last line of defense (for example, ensuring a wallet balance can never go negative at the database level, regardless of application-level bugs).

### Concurrency: race conditions and pessimistic locking

Betting is a concurrency-sensitive operation: if a user could fire two simultaneous bet requests, both could pass a balance check before either deducts funds, letting the user bet more than their actual balance. This is a classic race condition.

This project handles it with **pessimistic locking** (`SELECT ... FOR UPDATE`) rather than optimistic locking:

- When a bet is placed, the relevant wallet row is locked for the duration of the database transaction. Any concurrent request touching the same wallet has to wait until the lock is released.
- This was chosen over optimistic locking (versioning + retry-on-conflict) because financial operations here are short-lived and contention is expected to be low. The simplicity and correctness guarantees of pessimistic locking outweigh the throughput benefits optimistic locking offers at a much larger scale.

## Roadmap

- [x]   1. **Docker & architecture setup** — containerize the stack, configure services, environment
- [x]   2. **Database design & implementation** — schema design, migrations for core entities (users, wallets, transactions, games, rounds, bets)
- [ ]   3. **Authentication** — Laravel Sanctum, SPA cookie-based auth, registration/login flow
- [ ]   4. **User dashboard** — profile, wallet balance, transaction history
- [ ]   5. **Roulette game** — provably fair result generation, bet placement, round resolution
- [ ]   6. **Real-time updates** — Laravel Reverb + Echo integration for live balance/result updates
- [ ]   7. **Polish & extensibility pass** — refactor for adding future games without core schema changes

## Contributing

This is a study project. Feel free to fork and experiment with the codebase.
