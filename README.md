# AIUMStore

線上商城專案。後端使用 Django REST Framework，前端使用 React (Vite + TypeScript)，資料庫使用 MySQL，整體以 Docker Compose 啟動。

## 技術架構

- **後端**：Django + Django REST Framework + MySQL，JWT 驗證 (djangorestframework-simplejwt)
- **前端**：React + TypeScript (Vite)，react-router-dom 處理路由，axios 處理 API 請求
- **資料庫**：MySQL 8
- **容器化**：Docker / Docker Compose
- **未來規劃**：React Native (iOS / Android App)、部署至 Google Cloud Run

## 目錄結構

```
AIUMStore/
├── docker-compose.yml
├── .env.example
├── backend/            # Django REST 後端
│   ├── config/         # 專案設定 (settings, urls)
│   ├── accounts/       # 會員：註冊 / 登入 / 登出
│   ├── products/       # 產品種類、商品、商品細項與價格
│   ├── cart/           # 購物車
│   └── orders/         # 結帳台、訂單、電子支付
└── frontend/           # React 前端
    └── src/
        ├── api/         # axios client
        ├── context/     # Auth / Cart context
        ├── components/  # Navbar、路由保護
        └── pages/       # 商品、登入、註冊、購物車、結帳、訂單
```

## 已實作功能（對應 note.txt 規劃）

- 會員登入 / 登出 / 註冊（JWT 驗證）
- 產品種類、產品細項與價格管理（含 Django Admin 後台）
- 購物車（加入 / 修改數量 / 移除）
- 結帳台（建立訂單，會員依等級套用折扣）
- 電子支付（已建立 Payment 資料模型與付款狀態流程，目前以模擬付款確認 API 呈現，待串接實際金流服務商）
- 會員分類與權限（superuser / firm / member / guest，詳見下節）

## 會員分類

| 角色 | 說明 |
| --- | --- |
| `superuser` | Django `is_superuser`，無使用限制，可透過 `/admin/` 管理所有資料 |
| `firm`（店家） | 多店家市集架構：每個 firm 帳號對應一間店面（`Firm` 資料表），只能在 `/api/products/my-products/`、`/api/products/my-variants/` 管理自己名下的商品上架狀態與優惠價格，並透過 `/api/orders/firm/dashboard/` 查看自己的營收/訂單數/熱銷商品。**建立方式**：先以一般帳號註冊，再由 superuser 於 Django Admin 將該帳號的 `role` 改為 `firm`，登入後呼叫 `POST /api/products/firms/me/` 建立店家資料 |
| `member`（會員 LV1~10） | 一般會員，註冊後自動建立 `MemberProfile`（等級/點數/累積消費），依累積消費自動升級（門檻可調，見 `accounts/models.py` 的 `LEVEL_THRESHOLDS`），等級對應結帳折扣（每級 +2%），並可自由編輯「喜好產品」(`/api/accounts/favorites/`)，購買記錄可由 `/api/orders/` 取得 |
| `guest`（訪客） | 免登入即可瀏覽所有上架商品；下單時透過 `/api/orders/guest-checkout/` 建立「到店取貨」訂單，不走線上金流，狀態為待到店付款，由店家(`firm`)或 superuser 於現場確認後呼叫 `/api/orders/<id>/pickup/confirm/` 完成付款與取貨 |

## 啟動方式

1. 複製環境變數設定：

   ```bash
   cp .env.example .env
   ```

2. 使用 Docker Compose 啟動所有服務：

   ```bash
   docker compose up --build
   ```

   - 前端：http://localhost:5173
   - 後端 API：http://localhost:8000/api/
   - 後端管理後台：http://localhost:8000/admin/

3. 建立後端管理員帳號（首次啟動後執行）：

   ```bash
   docker compose exec backend python manage.py createsuperuser
   ```

## 主要 API

| 功能 | Method | 路徑 |
| --- | --- | --- |
| 會員註冊 | POST | `/api/accounts/register/` |
| 會員登入 | POST | `/api/accounts/login/` |
| 刷新 Token | POST | `/api/accounts/login/refresh/` |
| 會員登出 | POST | `/api/accounts/logout/` |
| 取得個人資料(含角色/等級/點數) | GET | `/api/accounts/me/` |
| 喜好產品(收藏) | GET / POST / DELETE | `/api/accounts/favorites/`、`/api/accounts/favorites/<product_id>/` |
| 產品種類列表 | GET | `/api/products/categories/` |
| 商品列表 / 細項 | GET | `/api/products/`、`/api/products/<slug>/` |
| 店家自己的店面資料 | GET / POST / PATCH | `/api/products/firms/me/` |
| 店家管理自己的商品 | GET / POST / PATCH / DELETE | `/api/products/my-products/`、`/api/products/my-products/<id>/` |
| 店家管理自己商品的細項與價格 | GET / POST / PATCH / DELETE | `/api/products/my-variants/`、`/api/products/my-variants/<id>/` |
| 取得購物車 | GET | `/api/cart/` |
| 加入購物車 | POST | `/api/cart/items/` |
| 修改 / 移除購物車項目 | PATCH / DELETE | `/api/cart/items/<id>/` |
| 結帳(會員，套用等級折扣) | POST | `/api/orders/checkout/` |
| 訪客到店取貨結帳(免登入) | POST | `/api/orders/guest-checkout/` |
| 模擬會員線上付款完成 | POST | `/api/orders/<order_id>/payment/confirm/` |
| 店家確認訪客到店付款取貨 | POST | `/api/orders/<order_id>/pickup/confirm/` |
| 店家營收儀表板 | GET | `/api/orders/firm/dashboard/` |
| 我的訂單 | GET | `/api/orders/`、`/api/orders/<id>/` |

## 待辦事項

- 串接實際電子支付服務商（如綠界 / Stripe / LINE Pay）取代目前的模擬付款 API
- 補充商品搜尋、會員資料編輯、訂單狀態追蹤等前端頁面
- 建立 React Native 共用邏輯，擴充至 iOS / Android App
- 撰寫 Cloud Run 部署設定（後端、前端容器化部署、正式環境資料庫）
