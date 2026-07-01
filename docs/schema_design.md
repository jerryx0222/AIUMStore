# AIUMStore 類別及資料庫重新設計 (v2)

依 [note.txt](../note.txt) 第 17~27 行設計，經以下決議調整（相對 v1 的變更見文末）：

- **取消 guest**：不再有匿名訪客結帳，`Order` 不再保留 `guest_name`/`guest_phone`，結帳一律需要 `人員`（至少是會員）帳號。
- **取消子類別**：不使用 Django multi-table inheritance。`人員`與`品牌`各自都只有「一張表」，角色/類型用欄位（`level` / `brand_type`）區分，角色專屬欄位直接攤平放在同一張表上（nullable）。
- **備註一律存文字**：`note` 欄位單純存文字，不做結構化解析；其實際用途之後再定義。
- **庫存與上架與否由店主決定**：這兩個屬性不放在 `產品`（HQ 主檔）上，而是放在「門市（加盟品牌）× 產品」的關聯表上，由店主維護。

---

## 1. 人員 Person（單表，對應 `AbstractUser`，無子類別）

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | PK 流水號 | Django 內建自增主鍵 |
| level | choice | `superuser` / `brand_owner`(品牌主) / `store_owner`(店主) / `store_clerk`(店員) / `member`(會員)。`guest` 已取消 |
| name | string | 可重複 |
| mobile / phone | string | |
| email | email | 沿用 `AbstractUser.email` |
| line_id | string | |
| address | string | |
| note | text | 純文字，意義後續再解析 |
| employer_brand | FK → 品牌 (nullable) | 僅 `level=store_clerk` 時使用，指向所屬的加盟品牌門市（已確認保留） |
| member_level | int 1~10 (nullable) | 僅 `level=member` 使用，沿用現行等級邏輯 |
| points | int (nullable) | 僅會員使用，累積點數 |
| total_spent | decimal (nullable) | 僅會員使用，累積消費金額 |
| favorite_products | M2M → 產品 | 僅會員使用，喜好清單 |

角色與品牌的關係不再用不同 model 表達單/多筆，而是單純看 `品牌.owner` 這個 FK 指向誰、指向了幾筆：
- 一個人被幾筆「加盟品牌」的 `owner` 指到，就代表他管理幾間門市（`store_owner` 通常多筆，`brand_owner` 通常單筆），純粹是資料上的差異，不再由 schema 強制。

> Guest 取消後，note.txt 頂部「會員分類」第 4 點（guest）需要另外更新，尚未修改該檔案，待您確認後再處理。

---

## 2. 品牌 Brand（單表，無子類別）

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | PK 流水號 | |
| brand_type | choice | `product_brand`(產品品牌/連鎖總部) / `franchise_brand`(加盟品牌/店主整合門市) |
| name_en / name_zh | string | |
| icon | image | |
| contact | FK → 人員 | 品牌聯絡人 |
| website | url | |
| note | text | 純文字 |
| owner | FK → 人員 (nullable) | 僅 `brand_type=franchise_brand` 使用，指向該門市的品牌主/店主 |
| carried_product_brands | M2M → 品牌 (self, 非對稱) | 僅 `brand_type=franchise_brand` 使用，指向數筆 `brand_type=product_brand` 的品牌，代表此門市掛了哪些連鎖總部的產品線 |

---

## 3. 產品 Product（HQ 主檔，不含庫存/上架）

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | PK 流水號 | |
| product_brand | FK → 品牌 (`brand_type=product_brand`) | 產品歸屬的連鎖總部 |
| category | FK → Category | 沿用現有多層子分類 `Category` model（已確認保留） |
| images | 一對多 → ProductImage | WebP，可存多張 |
| suggested_price | decimal | 建議價格 |
| selling_price | decimal | 實售價格，預設 = 建議價格（HQ 層級的參考售價） |
| spec | string | 規格 |
| process | text | 製程 |

**ProductImage**
- `product`：FK → 產品
- `image`：ImageField (.webp)
- `sort_order`：int

---

## 4. 門市商品上架 StoreProductListing（新增，取代原本開放問題 3、4）

由「加盟品牌」（門市）與「產品」的關聯表承載店主決定的庫存與上架狀態：

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | PK 流水號 | |
| franchise_brand | FK → 品牌 (`brand_type=franchise_brand`) | 哪個門市 |
| product | FK → 產品 | 賣哪個 HQ 產品 |
| stock | int | 庫存，店主維護 |
| is_active | bool | 是否上架，店主維護 |

`unique_together = (franchise_brand, product)`。同一 HQ 產品在不同門市可以有不同庫存/上架狀態；售價目前仍統一沿用 `Product.selling_price`（未要求做門市級價格覆寫）。

---

## 5. 對現有程式碼的影響

| 現有 | 新設計 | 差異 |
|---|---|---|
| `accounts.User`(role) + `MemberProfile` | 單一 `Person`，角色欄位攤平 | 不再拆表，會員相關欄位直接放在 Person 上（nullable） |
| `products.Firm` | 併入 `Brand`(`brand_type=franchise_brand`) | 地址等資訊併入品牌本體 |
| `products.Brand` | `Brand`（單表，`brand_type` 區分） | 不再拆 ProductBrand / FranchiseBrand 兩個 model |
| `products.Product` + `ProductVariant` | `Product` + `ProductImage` + `StoreProductListing` | 規格改為 Product 上的文字欄位；庫存/上架搬到 `StoreProductListing` |
| `Order.guest_name/guest_phone` | 移除 | 結帳需登入，不再支援匿名訪客 |
| `cart.CartItem` / `orders.OrderItem` | FK 改指向 `StoreProductListing` | 購買行為綁定「哪個門市＋哪個產品」，庫存扣減也在該表上 |

---

## 決議紀錄

1. `店員` 需要 `employer_brand` 欄位，限定其後台操作範圍在自己門市。
2. `產品類別` 保留現有多層子分類 `Category` model。

設計已無待確認項目，可進入 Django models 實作階段。
