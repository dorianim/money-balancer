# Repository Guidelines

## Project Structure & Module Organization

The Rust 2021/Rocket backend lives in `src/`. `main.rs` assembles the application; HTTP handlers are in `routes/`, persistence logic in `services/`, SeaORM entities in `model/`, and infrastructure in `guards/` and `fairings/`. Database migrations form a separate crate in `migration/`. The React/TypeScript client is under `client/src/`, organized into `components/`, `pages/`, `data/`, and `utils/`; static assets live in `client/public/`. API definitions are in `src/resources/api/`. Tests are colocated with code (`src/routes/user.rs` and `client/src/App.test.tsx`).

## Build, Test, and Development Commands

- `MONEYBALANCER_JWT_SECRET=dev-only cargo run` starts the API on port 8000 using the local SQLite database.
- `cargo build` creates a debug backend binary. `cargo build --release` also installs/builds the client and embeds it in the release binary.
- `cd client && npm ci && npm start` runs the client development server; it calls the API at `http://localhost:8000/api/v1`.
- `cd client && npm run build` creates the production client bundle.
- `cd migration && cargo run -- status` inspects migrations; replace `status` with `up` to apply them.

## Coding Style & Naming Conventions

Use standard `rustfmt`: four-space indentation, `snake_case` functions/modules, `PascalCase` types, and `SCREAMING_SNAKE_CASE` constants. Check Rust with `cargo fmt --all -- --check` and `cargo clippy --all-targets --all-features -- -D warnings`.

Client code follows `client/.prettierrc`: two spaces, semicolons, single quotes, trailing commas, and an 80-column target. Use PascalCase component filenames such as `HeaderMenu.tsx` and camelCase functions. Run `cd client && npm run format:check && npm run lint`.

## Testing Guidelines

Rust tests use the built-in harness, Rocket test clients, and `#[serial]` where environment or SQLite state is shared. Name them `test_*`. On a clean checkout, run `touch .money-balancer-test-tmp.sqlite && MONEYBALANCER_JWT_SECRET=test cargo test`. Frontend tests use Jest and React Testing Library; name files `*.test.tsx` and run `cd client && npm test -- --watchAll=false`. No coverage threshold is configured, but add focused tests for changed behavior.

## Commit & Pull Request Guidelines

Follow the history’s `Type: concise action` style (`Feat`, `Fix`, `Chore`, `Docs`, or `CI`), optionally scoped with `[client]` or `[server]`. Discuss substantial changes before implementation. PRs should explain behavior and verification, link relevant issues, and include screenshots for visible UI changes. Update README interface/configuration details and SemVer references when applicable, and obtain one developer sign-off before merging.

## Security & Configuration

Never commit `.env`, JWT secrets, generated databases, or tokens. Use disposable development values for `MONEYBALANCER_JWT_SECRET` and document any new environment variable in `README.md`.
