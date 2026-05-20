# MeowTea Flask Migration Plan

> Scope: port PHP + HTML app sang Python Flask backend, giu toi da business logic hien co, doi DB tu MySQL sang SQLite. Thu muc migration duoc giu dung theo yeu cau: `mirgration`.

## Nguyen Tac

- [x] Tao code moi trong `mirgration/`, khong sua/xoa luong PHP hien tai khi chua can.
- [x] Giu ten bang/cot theo schema goc de giam rui ro lech business logic.
- [x] Tach business logic vao `services/`, endpoint chi validate request/response.
- [x] Giu response JSON gan voi API PHP hien tai de JS co the migrate tung endpoint.
- [ ] Moi thay doi khong chac ve nghiep vu phai hoi Charlie approve truoc khi lam.
- [ ] Khi port xong moi flow, cap nhat checklist va ghi note khac biet neu co.

## Phase 0 - Baseline & Mapping

- [x] Quet cau truc repo PHP hien tai.
- [x] Xac dinh domain chinh: auth, catalog/menu, cart, promotion, order, management, stores/news.
- [x] Xac dinh DB co 18 bang can giu: Role, User, Store, User_Store, Category, SanPham, Option_Group, Option_Value, Product_Option_Group, Cart, Cart_Item, Cart_Item_Option, Promotion, Payment_Method, Orders, Order_Item, Order_Item_Option, News.
- [x] Lap API parity matrix day du giua PHP endpoint va Flask endpoint. Xem `mirgration/parity.md`.
- [ ] Chay manual baseline tren app PHP neu can so sanh UI/API.

## Phase 1 - Flask Skeleton

- [x] Tao app factory Flask.
- [x] Tao config rieng cho SQLite.
- [x] Tao SQLAlchemy extension va enable SQLite foreign keys.
- [x] Tao blueprint modules theo domain.
- [x] Tao service layer theo domain.
- [x] Tao template shell toi thieu de kiem tra web routing.

## Phase 2 - SQLite Schema & Seed

- [x] Port schema MySQL sang SQLAlchemy models, giu ten bang/cot goc.
- [x] Tao CLI `init-db` de create SQLite DB.
- [x] Tao seed bootstrap bang Python dua tren `database/seed-data.sql`.
- [x] Viet script verify row counts voi seed goc. Chay bang `flask --app run.py verify-seed`.
- [x] Them migration note cho cac diem khac MySQL/SQLite: enum, datetime, cascade, collation. Xem `mirgration/parity.md`.

## Phase 3 - API Port 1: Read-Only Catalog

- [x] Port categories/products/product detail/options.
- [x] Port menu search JSON.
- [x] Port stores search JSON.
- [x] Port promotion validate.
- [x] Port news listing/detail with markdown rendering parity.
- [x] Compare response shape voi JS hien tai. Ghi tai `mirgration/parity.md`.

## Phase 4 - API Port 2: Auth & Session

- [x] Port login/logout/register.
- [x] Ho tro legacy plain text password nhu seed demo.
- [x] Ho tro bcrypt PHP `$2y$` neu dependency passlib co san.
- [x] Port update profile/change password/get users.
- [x] Them CSRF decision: Charlie da approve. Chua bat CSRF trong code de tranh doi flow AJAX giua chung migration.

## Phase 5 - API Port 3: Cart

- [x] Port add/get/update/delete/clear/count session cart.
- [x] Port save/load/merge cart voi DB.
- [x] Kiem tra lai viec client gui `base_price`/`total_price`; da chuyen sang tinh gia server-side tu SanPham/Option_Value.
- [x] Port selected store behavior ro rang. Checkout store duoc luu vao session truoc khi tao order; cart DB tiep tuc dung selected store khi merge/save.

## Phase 6 - API Port 4: Orders

- [x] Port create order, promotion revalidation, insert order items/options, clear cart.
- [x] Port customer/admin order listing co auto-progress status.
- [x] Port update status accept/cancel.
- [x] Port order detail customer/admin parity.
- [x] Verify SQLite datetime compare voi timezone Asia/Bangkok. App dung `meowtea.clock.local_now()` UTC+7 naive de so sanh DATETIME on SQLite.

## Phase 7 - Admin Management

- [x] Port list categories/products/toppings/promotions.
- [x] Port create/update/delete product, topping, promotion co role checks.
- [x] Kiem tra lai soft-delete behavior voi UI hien tai. Product/promotion soft-delete bang `TrangThai=0`; topping hard-delete theo endpoint PHP hien tai.
- [ ] Add audit/logging neu cong ty can.

## Phase 8 - Templates/UI Migration

- [x] Tao trang web shell toi thieu.
- [x] Convert `components/header.php` -> Jinja partial.
- [x] Convert `components/footer.php` -> Jinja partial.
- [x] Convert homepage `index.php` -> Jinja.
- [x] Convert menu page `pages/menu/index.php` -> Jinja.
- [x] Convert stores page `pages/stores/index.php` -> Jinja.
- [x] Convert static about/career pages `pages/about/index.php`, `pages/career/index.php` -> Jinja.
- [x] Convert auth pages `pages/auth/login.php`, `pages/auth/register.php` -> Jinja.
- [x] Convert cart page `pages/cart/index.php` -> Jinja.
- [x] Convert checkout/profile/management pages.
- [x] Cap nhat JS endpoint tu `.php` sang Flask routes hoac them compatibility aliases. Da cap nhat stores/auth/cart/menu add-to-cart/checkout/profile/management/order-management.

## Phase 9 - Verification

- [x] `python -m compileall mirgration`.
- [x] `flask --app run.py init-db`.
- [x] Run Flask local va smoke test API.
- [ ] Browser smoke test cac flow: guest menu, register, login, add cart, checkout, admin order.
- [ ] Ghi nhan behavior khac voi PHP.

## Current Runtime Notes

- [x] Tao venv local tai `mirgration/.venv` va da ignore bang `.gitignore`.
- [x] Dev server da chay duoc tai `http://127.0.0.1:5000`.
- [x] Smoke test da pass: `/health`, `/api/product/get?id=1`, `/api/menu/search`, login `cust/cust`, add cart.
- [x] Server dev dang chay tai `http://127.0.0.1:5000`.
- [x] Homepage va menu render bang Flask test client.
- [x] Smoke test moi pass: `/news`, `/news/1`, login `cust/cust`, update profile, add cart voi gia client bi override boi server, order detail invalid route.
- [x] Smoke test UI moi pass: `/stores`, `/login`, `/register`, `/cart` empty/filled, cart note/quantity/delete.
- [x] UI moi convert: `/checkout`, `/order-result`, `/profile`, `/orders`, `/management/products`, `/management/promotions`, `/management/orders`.
- [x] Flask test client pass customer smoke: login `cust/cust`, add cart, create order, render `/order-result?order_id=1`, render `/order-detail-view?id=1`.
- [x] Flask test client pass admin smoke: login `admin/admin`, render management pages, call management/list/order APIs.
- [x] Browser smoke tren dev server moi `http://127.0.0.1:5001`: protected pages redirect login dung, khong con 404 cho `/checkout`, `/profile`, `/orders`, `/management/products`.
- [x] Backend/test-client smoke moi pass tren code hien tai: health, product detail, customer login, add cart, checkout render, create order store 2, order result, admin list/accept/detail, DB order store selected = 2, cart DB cleared.
- [x] Browser smoke tren `http://127.0.0.1:5002`: login page render, login `cust/cust` thanh cong, `/menu` render voi user session va modal product hien thi.
- [x] Static page parity moi them: `/about`, `/career`; header/footer Flask khong con link `#` cho hai trang nay.
- [x] Fix menu AJAX product-card parity: `/api/menu/search` dung chung Jinja partial voi trang `/menu`, khong con card HTML rut gon bi be layout sau khi click category/search.
- [x] Quet va fix AJAX legacy con sot: `assets/js/menu.js` da doi tu `../../api/menu/search.php` sang `getApiPath("menu/search")`; scan hien khong con relative `.php` API trong JS migrated.
- [ ] Browser smoke add-to-cart bang click trong in-app browser can test lai tay/Playwright ngoai neu can; in-app browser click vao modal action bi loi toa do, nhung API/test-client full flow da pass.
- [ ] Browser smoke test full interactive flow van can chay tay: register/login, add cart, checkout, admin accept/cancel.

## Open Decisions Can Charlie Approve Later

- [x] Co chap nhan doi endpoint URL bo `.php` khong, hay can compatibility alias `/api/cart/add.php`? Bỏ .php
- [x] Cart price nen tiep tuc tin client de parity, hay sua thanh server-authoritative? tính lại price ở server
- [x] SQLite chi dung dev/demo hay production? Neu production, can xem lai concurrency/backup. dev/demo 
- [x] Co bat CSRF cho form/AJAX khong? Tot cho security nhung can sua JS. Có
