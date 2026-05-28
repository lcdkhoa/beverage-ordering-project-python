## Quick Start

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
flask --app run.py seed-db
flask --app run.py run --debug
```

## Supabase Postgres

The app is Postgres-first and requires `DATABASE_URL` in `.env`.

```text
DATABASE_URL=postgresql+psycopg://postgres.<project-ref>:<database-password>@<host>:5432/postgres?sslmode=require
```

`.env` is ignored by git. Keep real Supabase credentials there only.

To recreate schema and seed demo data on the configured database:

```powershell
flask --app run.py seed-db --drop
flask --app run.py verify-seed
```

Use `seed-db` without `--drop` when the database may already contain data; it creates missing tables and skips seed rows if roles already exist.

## Structure

```text
run.py
requirements.txt
meowtea/
  __init__.py
  config.py
  extensions.py
  models.py
  security.py
  blueprints/
  services/
  templates/
  database/
    seed.py
```

## Notes

- Models keep the original table and column names to reduce business-logic drift.
- Services own business logic; blueprints stay close to the HTTP boundary.
- Static assets are served from `meowtea/assets`.
- Demo accounts: `admin/admin`, `staff/staff`, `cust/cust`.
