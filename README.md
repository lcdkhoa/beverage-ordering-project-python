## Quick Start

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
flask --app run.py init-db
flask --app run.py run --debug
```

SQLite database mac dinh nam tai:

```text
mirgration/instance/meowtea.sqlite3
```

## Structure

```text
mirgration/
  plan.md
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
```

Nguyen tac port:

- Models giu ten bang/cot goc de giam rui ro lech logic.
- Services giu business logic, blueprints chi lam HTTP boundary.
- Static assets van dung thu muc `../assets` cua repo goc.
