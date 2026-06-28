import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../api/client";
import { FirmSwitcher } from "../components/FirmSwitcher";
import { useMyFirms } from "../hooks/useMyFirms";
import type { BrandOption, FirmDashboard as FirmDashboardData } from "../types";

const emptyForm = {
  name: "",
  branch_name: "",
  address: "",
  phone: "",
  brand: "",
  description: "",
};

export function FirmDashboardPage() {
  const { firms, loading, currentFirmId, setCurrentFirmId, currentFirm, reload } = useMyFirms();
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [dashboard, setDashboard] = useState<FirmDashboardData | null>(null);
  const [editing, setEditing] = useState(false);
  const [addingBranch, setAddingBranch] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    api.get<BrandOption[]>("/products/brands/").then(({ data }) => setBrands(data));
  }, []);

  useEffect(() => {
    if (!currentFirmId) {
      setDashboard(null);
      return;
    }
    api
      .get<FirmDashboardData>("/orders/firm/dashboard/", { params: { firm_id: currentFirmId } })
      .then(({ data }) => setDashboard(data))
      .catch(() => setDashboard(null));
  }, [currentFirmId]);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    const { data: newFirm } = await api.post("/products/firms/", {
      ...form,
      brand: form.brand || null,
    });
    setForm(emptyForm);
    setAddingBranch(false);
    await reload();
    setCurrentFirmId(newFirm.id);
  }

  async function handleUpdate(event: FormEvent) {
    event.preventDefault();
    if (!currentFirmId) return;
    await api.patch(`/products/firms/${currentFirmId}/`, { ...form, brand: form.brand || null });
    setEditing(false);
    await reload();
  }

  function startEditing() {
    if (!currentFirm) return;
    setForm({
      name: currentFirm.name,
      branch_name: currentFirm.branch_name,
      address: currentFirm.address,
      phone: currentFirm.phone,
      brand: currentFirm.brand ? String(currentFirm.brand) : "",
      description: currentFirm.description,
    });
    setEditing(true);
  }

  function startAddingBranch() {
    setForm(emptyForm);
    setAddingBranch(true);
  }

  const brandName = brands.find((b) => b.id === currentFirm?.brand)?.name;

  if (loading) return <p>載入中...</p>;

  if (firms.length === 0 || addingBranch || editing) {
    const isCreate = firms.length === 0 || addingBranch;
    return (
      <form onSubmit={isCreate ? handleCreate : handleUpdate} className="auth-form">
        <h1>{isCreate ? "新增分店" : "編輯分店資料"}</h1>
        <input
          placeholder="店家名稱"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          placeholder="分店名"
          value={form.branch_name}
          onChange={(e) => setForm({ ...form, branch_name: e.target.value })}
        />
        <label>
          商店分類
          <select value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })}>
            <option value="">不指定</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
        <input
          placeholder="地址"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
        />
        <input
          placeholder="電話"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        <input
          placeholder="店家簡介"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <div className="actions">
          <button type="submit">{isCreate ? "建立分店" : "儲存"}</button>
          {firms.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setAddingBranch(false);
              }}
            >
              取消
            </button>
          )}
        </div>
      </form>
    );
  }

  return (
    <div>
      <FirmSwitcher firms={firms} currentFirmId={currentFirmId} onChange={setCurrentFirmId} />
      <h1>
        {currentFirm?.name}
        {currentFirm?.branch_name && ` ${currentFirm.branch_name}`} 店家後台
      </h1>
      <p>商店分類: {brandName ?? "尚未設定"}</p>
      {currentFirm?.address && <p>地址: {currentFirm.address}</p>}
      {currentFirm?.phone && <p>電話: {currentFirm.phone}</p>}
      <p>{currentFirm?.description}</p>
      <div className="actions">
        <button onClick={startEditing}>編輯此分店資料</button>
        <button onClick={startAddingBranch}>新增分店</button>
      </div>
      <p>
        <Link to={`/firm/products?firm_id=${currentFirmId}`}>管理我的商品</Link>
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
        <p>尚未設定商店分類，無法檢視營收</p>
      )}
    </div>
  );
}
