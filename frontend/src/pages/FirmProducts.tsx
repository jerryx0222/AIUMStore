import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { api } from "../api/client";
import { FirmSwitcher } from "../components/FirmSwitcher";
import { useCategoryCascade } from "../hooks/useCategoryCascade";
import { useMyFirms } from "../hooks/useMyFirms";
import type { Category, ManagedProduct } from "../types";

export function FirmProductsPage() {
  const [searchParams] = useSearchParams();
  const initialFirmId = searchParams.get("firm_id");
  const { firms, currentFirmId, setCurrentFirmId } = useMyFirms(
    initialFirmId ? Number(initialFirmId) : null
  );

  const [products, setProducts] = useState<ManagedProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newProduct, setNewProduct] = useState({ name: "", description: "" });
  const cascade = useCategoryCascade(categories);
  const [variantForms, setVariantForms] = useState<Record<number, { sku: string; name: string; price: string; stock: string }>>({});

  async function loadProducts() {
    if (!currentFirmId) {
      setProducts([]);
      return;
    }
    const { data } = await api.get<ManagedProduct[]>("/products/my-products/", {
      params: { firm_id: currentFirmId },
    });
    setProducts(data);
  }

  useEffect(() => {
    loadProducts();
  }, [currentFirmId]);

  useEffect(() => {
    api.get<Category[]>("/products/categories/").then(({ data }) => setCategories(data));
  }, []);

  async function handleCreateProduct(event: FormEvent) {
    event.preventDefault();
    if (!cascade.resolved || !currentFirmId) return;
    await api.post(
      "/products/my-products/",
      {
        category: cascade.resolved.id,
        name: newProduct.name,
        description: newProduct.description,
        is_active: true,
      },
      { params: { firm_id: currentFirmId } }
    );
    setNewProduct({ name: "", description: "" });
    cascade.reset();
    await loadProducts();
  }

  async function toggleActive(product: ManagedProduct) {
    await api.patch(`/products/my-products/${product.id}/`, { is_active: !product.is_active });
    await loadProducts();
  }

  function getVariantForm(productId: number) {
    return variantForms[productId] ?? { sku: "", name: "", price: "", stock: "" };
  }

  async function handleAddVariant(productId: number, event: FormEvent) {
    event.preventDefault();
    const form = getVariantForm(productId);
    await api.post("/products/my-variants/", {
      product: productId,
      sku: form.sku,
      name: form.name,
      price: Number(form.price),
      stock: Number(form.stock),
    });
    setVariantForms((prev) => ({ ...prev, [productId]: { sku: "", name: "", price: "", stock: "" } }));
    await loadProducts();
  }

  if (firms.length === 0) {
    return <p>尚未建立任何分店，請先到店家後台建立分店資料。</p>;
  }

  return (
    <div>
      <h1>我的商品管理</h1>
      <FirmSwitcher firms={firms} currentFirmId={currentFirmId} onChange={setCurrentFirmId} />

      <form onSubmit={handleCreateProduct} className="checkout-form">
        <h2>新增商品</h2>
        <label>
          種類
          <select value={cascade.name} onChange={(e) => cascade.selectName(e.target.value)} required>
            <option value="">請選擇</option>
            {cascade.names.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        {cascade.levels.map(({ level, options }) => (
          <label key={level}>
            子種類{level}
            <select
              value={cascade.subSelections[level - 1]}
              onChange={(e) => cascade.selectSubLevel(level, e.target.value)}
              required
            >
              <option value="">請選擇</option>
              {options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>
        ))}
        {cascade.name && !cascade.resolved && cascade.levels.length === 0 && (
          <p className="error">找不到符合的種類，請確認該種類設定</p>
        )}
        <input
          placeholder="商品名稱"
          value={newProduct.name}
          onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
          required
        />
        <input
          placeholder="商品說明"
          value={newProduct.description}
          onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
        />
        <button type="submit" disabled={!cascade.resolved}>
          新增商品
        </button>
      </form>

      <h2>商品列表</h2>
      {products.map((product) => (
        <div key={product.id} className="product-card" style={{ marginBottom: "1rem" }}>
          <h3>
            {product.name} {product.is_active ? "(上架中)" : "(已下架)"}
          </h3>
          <button onClick={() => toggleActive(product)}>
            {product.is_active ? "下架" : "上架"}
          </button>
          <ul>
            {product.variants.map((variant) => (
              <li key={variant.id}>
                {variant.name} - NT$ {variant.price} (庫存 {variant.stock})
              </li>
            ))}
          </ul>
          <form
            onSubmit={(e) => handleAddVariant(product.id, e)}
            className="checkout-form"
          >
            <input
              placeholder="編號 (SKU)"
              value={getVariantForm(product.id).sku}
              onChange={(e) =>
                setVariantForms((prev) => ({
                  ...prev,
                  [product.id]: { ...getVariantForm(product.id), sku: e.target.value },
                }))
              }
              required
            />
            <input
              placeholder="規格名稱"
              value={getVariantForm(product.id).name}
              onChange={(e) =>
                setVariantForms((prev) => ({
                  ...prev,
                  [product.id]: { ...getVariantForm(product.id), name: e.target.value },
                }))
              }
              required
            />
            <input
              placeholder="價格"
              type="number"
              value={getVariantForm(product.id).price}
              onChange={(e) =>
                setVariantForms((prev) => ({
                  ...prev,
                  [product.id]: { ...getVariantForm(product.id), price: e.target.value },
                }))
              }
              required
            />
            <input
              placeholder="庫存"
              type="number"
              value={getVariantForm(product.id).stock}
              onChange={(e) =>
                setVariantForms((prev) => ({
                  ...prev,
                  [product.id]: { ...getVariantForm(product.id), stock: e.target.value },
                }))
              }
              required
            />
            <button type="submit">新增規格/價格</button>
          </form>
        </div>
      ))}
    </div>
  );
}
