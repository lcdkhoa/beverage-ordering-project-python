# MeowTea PHP to Flask Parity Notes

## API Matrix

| PHP endpoint | Flask endpoint | Status | Notes |
| --- | --- | --- | --- |
| `/api/auth/login.php` | `/api/auth/login` | Ported | Legacy `.php` alias still exists for compatibility. |
| `/api/auth/logout.php` | `/api/auth/logout` | Ported | Supports GET and POST like the PHP flow. |
| `/api/auth/register.php` | `/api/auth/register` | Ported | Creates Customer users with hashed passwords. |
| `/api/auth/update-profile.php` | `/api/auth/update-profile` | Ported | Keeps the PHP JSON success/message shape. |
| `/api/auth/change-password.php` | `/api/auth/change-password` | Ported | Verifies current password before update. |
| `/api/auth/get-users.php` | `/api/auth/get-users` | Ported | Admin/Staff only. |
| `/api/product/get.php` | `/api/product/get` | Ported | Includes product, option groups, and option values used by modal JS. |
| `/api/menu/search.php` | `/api/menu/search` | Ported | Keeps paginated product response. |
| `/api/stores/search.php` | `/api/stores/search` | Ported | Keeps store search response fields. |
| `/api/promotion/validate.php` | `/api/promotion/validate` | Ported | Revalidates active date range and max discount server-side. |
| `/api/cart/add.php` | `/api/cart/add` | Ported | Server recalculates product and option prices. |
| `/api/cart/get.php` | `/api/cart/get` | Ported | Session cart response. |
| `/api/cart/count.php` | `/api/cart/count` | Ported | Used by shared header JS. |
| `/api/cart/update.php` | `/api/cart/update` | Ported | Supports `index`, `cart_index`, and `item_index`. |
| `/api/cart/delete.php` | `/api/cart/delete` | Ported | Supports `index`, `cart_index`, and `item_index`. |
| `/api/cart/clear.php` | `/api/cart/clear` | Ported | Clears session cart. |
| `/api/order/create.php` | `/api/order/create` | Ported | Stores selected checkout store in session before creating order. |
| `/api/order/get.php` | `/api/order/get` | Ported | Customer listing with status/date filters. |
| `/api/order/get-all.php` | `/api/order/get-all` | Ported | Admin/Staff listing. |
| `/api/order/get_one.php` | `/api/order/get_one` | Ported | Customer detail. |
| `/api/order/get-one-admin.php` | `/api/order/get-one-admin` | Ported | Admin/Staff detail. |
| `/api/order/update-status.php` | `/api/order/update-status` | Ported | Accept/cancel behavior preserved. |
| `/api/management/categories.php` | `/api/management/categories` | Ported | Admin/Staff only. |
| `/api/management/products.php` | `/api/management/products` | Ported | Admin/Staff only. |
| `/api/management/toppings.php` | `/api/management/toppings` | Ported | Admin/Staff only. |
| `/api/management/promotions.php` | `/api/management/promotions` | Ported | Admin only for mutations. |
| `/api/management/create-product.php` | `/api/management/create-product` | Ported | Admin/Staff only. |
| `/api/management/update-price.php` | `/api/management/update-price` | Ported | Admin/Staff only. |
| `/api/management/delete-product.php` | `/api/management/delete-product` | Ported | Soft-deletes by `TrangThai = 0`. |
| `/api/management/create-topping.php` | `/api/management/create-topping` | Ported | Admin/Staff only. |
| `/api/management/update-topping-price.php` | `/api/management/update-topping-price` | Ported | Admin/Staff only. |
| `/api/management/delete-topping.php` | `/api/management/delete-topping` | Ported | Hard delete, matching current PHP behavior. |
| `/api/management/create-promotion.php` | `/api/management/create-promotion` | Ported | Admin only. |
| `/api/management/update-promotion.php` | `/api/management/update-promotion` | Ported | Admin only. |
| `/api/management/delete-promotion.php` | `/api/management/delete-promotion` | Ported | Soft-deletes by `TrangThai = 0`. |

## SQLite Notes

- Enums: legacy MySQL enum-like values are stored as strings. Flask validates important values in services instead of relying on DB enum constraints.
- Datetime: application writes naive `DATETIME` values in UTC+7 using `meowtea.clock.local_now()` to match Vietnam-local legacy behavior.
- Cascade: SQLite foreign keys are enabled on connect with `PRAGMA foreign_keys=ON`; cascade behavior is declared on cart/order child rows.
- Collation: SQLite default collation is not identical to MySQL. Current search uses SQL `LIKE` and should be manually checked for Vietnamese accent/case expectations if production search quality matters.
- Soft delete: products and promotions keep the PHP-style `TrangThai = 0` soft-delete behavior; toppings are physically deleted because the current PHP endpoint does the same.

## Response Shape Checks

- Shared JS now uses root-relative `/api/...` endpoints via `getApiPath()` and strips `.php`.
- Cart/order/profile/management JS still expects `{ success, message }` on mutations; Flask returns that shape.
- List APIs keep domain arrays under the same keys used by the existing JS: `products`, `categories`, `toppings`, `promotions`, `orders`, or `data` depending on the legacy endpoint.
- Product detail keeps nested options for modal rendering and server-side add-to-cart recalculates price from IDs instead of trusting client totals.
