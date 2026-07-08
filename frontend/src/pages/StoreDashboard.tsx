import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../api/client";
import { useMyStores } from "../hooks/useMyStores";
import type { Brand, StoreDashboard as StoreDashboardData } from "../types";

const emptyForm = {
  name_zh: "",
  name_en: "",
  website: "",
  note: "",
};

export function StoreDashboardPage() {
  const { stores, loading, currentStoreId, currentStore, reload } = useMyStores();
  const [productBrands, setProductBrands] = useState<Brand[]>([]);
  const [dashboard, setDashboard] = useState<StoreDashboardData | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    // 僅用於將門市已掛載的產品品牌 id 轉成名稱顯示；是否掛載由加盟主決定，此頁不可編輯
    api
      .get<Brand[]>("/products/brands/")
      .then(({ data }) => setProductBrands(data.filter((b) => b.brand_type === "product_brand")));
  }, []);

  useEffect(() => {
    if (!currentStoreId) {
      setDashboard(null);
      return;
    }
    api
      .get<StoreDashboardData>("/orders/store/dashboard/", { params: { store_id: currentStoreId } })
      .then(({ data }) => setDashboard(data))
      .catch(() => setDashboard(null));
  }, [currentStoreId]);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    await api.post("/products/stores/", form);
    setForm(emptyForm);
    await reload();
  }

  async function handleUpdate(event: FormEvent) {
    event.preventDefault();
    if (!currentStoreId) return;
    await api.patch(`/products/stores/${currentStoreId}/`, form);
    setEditing(false);
    await reload();
  }

  function startEditing() {
    if (!currentStore) return;
    setForm({
      name_zh: currentStore.name_zh,
      name_en: currentStore.name_en,
      website: currentStore.website,
      note: currentStore.note,
    });
    setEditing(true);
  }

  if (loading) return <p>載入中...</p>;

  if (stores.length === 0 || editing) {
    const isCreate = stores.length === 0;
    return (
      <form onSubmit={isCreate ? handleCreate : handleUpdate} className="auth-form">
        <h1>{isCreate ? "新增門市" : "編輯門市資料"}</h1>
        <input
          placeholder="門市中文名"
          value={form.name_zh}
          onChange={(e) => setForm({ ...form, name_zh: e.target.value })}
          required
        />
        <input
          placeholder="門市英文名"
          value={form.name_en}
          onChange={(e) => setForm({ ...form, name_en: e.target.value })}
        />
        <input
          placeholder="網址"
          value={form.website}
          onChange={(e) => setForm({ ...form, website: e.target.value })}
        />
        <input
          placeholder="備註"
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
        />
        <p>掛載的產品品牌由加盟主指定，請洽你的加盟主於「門市管理」頁面設定。</p>
        <div className="actions">
          <button type="submit">{isCreate ? "建立門市" : "儲存"}</button>
          {!isCreate && (
            <button type="button" onClick={() => setEditing(false)}>
              取消
            </button>
          )}
        </div>
      </form>
    );
  }

  return (
    <div>
      <h1>{currentStore?.name_zh} 門市後台</h1>
      <p>
        掛載的產品品牌:{" "}
        {currentStore?.carried_product_brands.length
          ? productBrands
              .filter((b) => currentStore.carried_product_brands.includes(b.id))
              .map((b) => b.name_zh || b.name_en)
              .join("、")
          : "尚未掛載"}
      </p>
      <p>{currentStore?.note}</p>
      <div className="actions">
        <button onClick={startEditing}>編輯此門市資料</button>
      </div>
      <p>
        <Link to={`/store/products?store_id=${currentStoreId}`}>管理我的商品上架</Link>
      </p>
      <h2>經營狀態</h2>
      {dashboard ? (
        <ul className="order-list">
          <li>累積營收: NT$ {dashboard.revenue}</li>
          <li>訂單數: {dashboard.order_count}</li>
          <li>
            熱銷商品:{" "}
            {dashboard.top_products.length === 0
              ? "尚無銷售紀錄"
              : dashboard.top_products
                  .map((p) => `${p.product_name} x ${p.quantity_sold}`)
                  .join("、")}
          </li>
        </ul>
      ) : (
        <p>尚無營收資料</p>
      )}
    </div>
  );
}
