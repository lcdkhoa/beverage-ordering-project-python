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

## Recent UI Update - Management Product Modal

Trang quan ly san pham da duoc tinh chinh modal `Chinh sua san pham` de de thao tac hon:

- Modal duoc can lai chieu rong, padding, header, tab va footer; khong con bi tran ngang khi mo chi tiet san pham.
- Tab `Thong tin` hien thi anh san pham va form ten/gia ro rang hon, khoang cach giua cac khoi dong deu hon.
- Tab `Tuy chon` dung collapsible moi gon hon cho `Muc duong`, `Muc da`, `Topping`; cac nut `Tat ca` va `Bo chon` nam dung hang, de bam.
- Cac chip tuy chon co trang thai chon ro hon, body collapsible khi mo co padding thoang va de doc hon.
- Collapsible da duoc sua cau truc HTML de tranh long button trong button, giup layout on dinh va van ho tro Enter/Space khi dung ban phim.

Kiem tra nhanh:

```powershell
flask --app run.py run --debug
```

Dang nhap bang tai khoan demo `admin/admin`, vao `/management/products`, bam `Sua san pham`, sau do kiem tra hai tab `Thong tin` va `Tuy chon`.
