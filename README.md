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
- 結帳台（建立訂單）
- 電子支付（已建立 Payment 資料模型與付款狀態流程，目前以模擬付款確認 API 呈現，待串接實際金流服務商）

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
| 取得個人資料 | GET | `/api/accounts/me/` |
| 產品種類列表 | GET | `/api/products/categories/` |
| 商品列表 / 細項 | GET | `/api/products/`、`/api/products/<slug>/` |
| 取得購物車 | GET | `/api/cart/` |
| 加入購物車 | POST | `/api/cart/items/` |
| 修改 / 移除購物車項目 | PATCH / DELETE | `/api/cart/items/<id>/` |
| 結帳 | POST | `/api/orders/checkout/` |
| 模擬付款完成 | POST | `/api/orders/<order_id>/payment/confirm/` |
| 我的訂單 | GET | `/api/orders/`、`/api/orders/<id>/` |

## 待辦事項

- 串接實際電子支付服務商（如綠界 / Stripe / LINE Pay）取代目前的模擬付款 API
- 補充商品搜尋、會員資料編輯、訂單狀態追蹤等前端頁面
- 建立 React Native 共用邏輯，擴充至 iOS / Android App
- 撰寫 Cloud Run 部署設定（後端、前端容器化部署、正式環境資料庫）
