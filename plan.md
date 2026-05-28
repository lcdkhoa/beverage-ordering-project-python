# MeowTea Flask Postgres Plan

> Current scope: Flask app backed by Supabase Postgres from the start. No local DB fallback and no data-copy scripts.

## Runtime

- [x] App reads `DATABASE_URL` from `.env`.
- [x] SQLAlchemy uses the Postgres driver from `psycopg`.
- [x] Missing `DATABASE_URL` fails fast during app startup.
- [x] Real credentials stay in `.env`, which is ignored by git.

## Database Bootstrap

- [x] `flask --app run.py seed-db` creates schema and seeds demo data when the database is empty.
- [x] `flask --app run.py seed-db --drop` recreates schema and seed data from scratch.
- [x] `flask --app run.py verify-seed` checks expected seed table counts.
- [x] Seed data lives in `meowtea/database/seed.py`.

## Verification

- [x] Python compile check passes.
- [x] Flask CLI exposes `seed-db` and does not expose data-copy commands.
- [x] Smoke routes against Supabase Postgres passed: `/health`, product detail, menu search, customer login, admin login, and user listing.

## Operating Notes

- Use `seed-db --drop` only when a full database reset is intended.
- Demo accounts are `admin/admin`, `staff/staff`, and `cust/cust`.
- Business logic stays in services; blueprints remain request/response boundaries.
