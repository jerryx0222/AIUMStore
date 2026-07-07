import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { api } from "../api/client";
import { StoreSwitcher } from "../components/StoreSwitcher";
import { useMyStores } from "../hooks/useMyStores";
import type { Combo, ManagedStoreComboListing, ManagedStoreProductListing, Product } from "../types";

export function StoreProductsPage() {
  const [searchParams] = useSearchParams();
  const initialStoreId = searchParams.get("store_id");
  const { stores, currentStoreId, setCurrentStoreId, currentStore } = useMyStores(
    initialStoreId ? Number(initialStoreId) : null
  );

  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [listings, setListings] = useState<ManagedStoreProductListing[]>([]);
  const [newStock, setNewStock] = useState<Record<number, string>>({});

  const [availableCombos, setAvailableCombos] = useState<Combo[]>([]);
  const [comboListings, setComboListings] = useState<ManagedStoreComboListing[]>([]);
  const [newComboStock, setNewComboStock] = useState<Record<number, string>>({});

  async function loadListings() {
    if (!currentStoreId) {
      setListings([]);
      return;
    }
    const { data } = await api.get<ManagedStoreProductListing[]>("/products/my-listings/", {
      params: { store_id: currentStoreId },
    });
    setListings(data);
  }

  async function loadComboListings() {
    if (!currentStoreId) {
      setComboListings([]);
      return;
    }
    const { data } = await api.get<ManagedStoreComboListing[]>("/products/my-combo-listings/", {
      params: { store_id: currentStoreId },
    });
    setComboListings(data);
  }

  useEffect(() => {
    loadListings();
    loadComboListings();
  }, [currentStoreId]);

  useEffect(() => {
    if (!currentStore || currentStore.carried_product_brands.length === 0) {
      setAvailableProducts([]);
      setAvailableCombos([]);
      return;
    }
    Promise.all(
      currentStore.carried_product_brands.map((brandId) =>
        api
          .get<Product[]>("/products/", { params: { product_brand: brandId } })
          .then((res) => res.data)
      )
    ).then((results) => setAvailableProducts(results.flat()));
    Promise.all(
      currentStore.carried_product_brands.map((brandId) =>
        api
          .get<Combo[]>("/products/combos/", { params: { product_brand: brandId } })
          .then((res) => res.data)
      )
    ).then((results) => setAvailableCombos(results.flat()));
  }, [currentStore]);

  const listedProductIds = new Set(listings.map((l) => l.product));
  const unlistedProducts = availableProducts.filter((p) => !listedProductIds.has(p.id));

  async function handleAddListing(productId: number, event: FormEvent) {
    event.preventDefault();
    if (!currentStoreId) return;
    const stock = Number(newStock[productId] ?? 0);
    await api.post(
      "/products/my-listings/",
      { product: productId, stock, is_active: true },
      { params: { store_id: currentStoreId } }
    );
    setNewStock((prev) => ({ ...prev, [productId]: "" }));
    await loadListings();
  }

  async function updateListing(
    listing: ManagedStoreProductListing,
    changes: Partial<ManagedStoreProductListing>
  ) {
    await api.patch(`/products/my-listings/${listing.id}/`, changes);
    await loadListings();
  }

  const listedComboIds = new Set(comboListings.map((l) => l.combo));
  const unlistedCombos = availableCombos.filter((c) => !listedComboIds.has(c.id));

  async function handleAddComboListing(comboId: number, event: FormEvent) {
    event.preventDefault();
    if (!currentStoreId) return;
    const stock = Number(newComboStock[comboId] ?? 0);
    await api.post(
      "/products/my-combo-listings/",
      { combo: comboId, stock, is_active: true },
      { params: { store_id: currentStoreId } }
    );
    setNewComboStock((prev) => ({ ...prev, [comboId]: "" }));
    await loadComboListings();
  }

  async function updateComboListing(
    listing: ManagedStoreComboListing,
    changes: Partial<ManagedStoreComboListing>
  ) {
    await api.patch(`/products/my-combo-listings/${listing.id}/`, changes);
    await loadComboListings();
  }

  if (stores.length === 0) {
    return <p>尚未建立任何門市，請先到門市後台建立門市資料。</p>;
  }

  return (
    <div>
      <h1>我的商品上架管理</h1>
      <StoreSwitcher stores={stores} currentStoreId={currentStoreId} onChange={setCurrentStoreId} />

      <h2>已上架商品</h2>
      {listings.length === 0 && <p>尚未上架任何商品</p>}
      {listings.map((listing) => {
        const product = availableProducts.find((p) => p.id === listing.product);
        return (
          <div key={listing.id} className="product-card" style={{ marginBottom: "1rem" }}>
            <h3>
              {product?.name ?? `產品 #${listing.product}`}{" "}
              {listing.is_active ? "(上架中)" : "(已下架)"}
            </h3>
            <label>
              庫存
              <input
                type="number"
                value={listing.stock}
                onChange={(e) =>
                  setListings((prev) =>
                    prev.map((l) =>
                      l.id === listing.id ? { ...l, stock: Number(e.target.value) } : l
                    )
                  )
                }
              />
            </label>
            <label>
              實際價格
              <input
                type="number"
                placeholder={`預設 NT$ ${product?.suggested_price ?? "-"}`}
                value={listing.actual_price ?? ""}
                onChange={(e) =>
                  setListings((prev) =>
                    prev.map((l) =>
                      l.id === listing.id ? { ...l, actual_price: e.target.value || null } : l
                    )
                  )
                }
              />
            </label>
            <button
              onClick={() =>
                updateListing(listing, { stock: listing.stock, actual_price: listing.actual_price })
              }
            >
              儲存
            </button>
            <button onClick={() => updateListing(listing, { is_active: !listing.is_active })}>
              {listing.is_active ? "下架" : "上架"}
            </button>
          </div>
        );
      })}

      <h2>可上架商品(尚未上架)</h2>
      {unlistedProducts.length === 0 && (
        <p>尚無可上架商品，請確認門市已掛載對應的產品品牌</p>
      )}
      {unlistedProducts.map((product) => (
        <form
          key={product.id}
          onSubmit={(e) => handleAddListing(product.id, e)}
          className="checkout-form"
          style={{ marginBottom: "0.5rem" }}
        >
          <span>
            {product.name}（建議價格 NT$ {product.suggested_price}）
          </span>
          <input
            placeholder="庫存"
            type="number"
            value={newStock[product.id] ?? ""}
            onChange={(e) => setNewStock((prev) => ({ ...prev, [product.id]: e.target.value }))}
            required
          />
          <button type="submit">上架</button>
        </form>
      ))}

      <h2>已上架套餐</h2>
      {comboListings.length === 0 && <p>尚未上架任何套餐</p>}
      {comboListings.map((listing) => {
        const combo = availableCombos.find((c) => c.id === listing.combo);
        return (
          <div key={listing.id} className="product-card" style={{ marginBottom: "1rem" }}>
            <h3>
              {combo?.name ?? `套餐 #${listing.combo}`}{" "}
              {listing.is_active ? "(上架中)" : "(已下架)"}
            </h3>
            <label>
              庫存
              <input
                type="number"
                value={listing.stock}
                onChange={(e) =>
                  setComboListings((prev) =>
                    prev.map((l) =>
                      l.id === listing.id ? { ...l, stock: Number(e.target.value) } : l
                    )
                  )
                }
              />
            </label>
            <label>
              實際價格
              <input
                type="number"
                placeholder={`預設 NT$ ${combo?.suggested_price ?? "-"}`}
                value={listing.actual_price ?? ""}
                onChange={(e) =>
                  setComboListings((prev) =>
                    prev.map((l) =>
                      l.id === listing.id ? { ...l, actual_price: e.target.value || null } : l
                    )
                  )
                }
              />
            </label>
            <button
              onClick={() =>
                updateComboListing(listing, {
                  stock: listing.stock,
                  actual_price: listing.actual_price,
                })
              }
            >
              儲存
            </button>
            <button onClick={() => updateComboListing(listing, { is_active: !listing.is_active })}>
              {listing.is_active ? "下架" : "上架"}
            </button>
          </div>
        );
      })}

      <h2>可上架套餐(尚未上架)</h2>
      {unlistedCombos.length === 0 && (
        <p>尚無可上架套餐，請確認門市已掛載對應的產品品牌</p>
      )}
      {unlistedCombos.map((combo) => (
        <form
          key={combo.id}
          onSubmit={(e) => handleAddComboListing(combo.id, e)}
          className="checkout-form"
          style={{ marginBottom: "0.5rem" }}
        >
          <span>
            {combo.name}（建議價格 NT$ {combo.suggested_price}）
          </span>
          <input
            placeholder="庫存"
            type="number"
            value={newComboStock[combo.id] ?? ""}
            onChange={(e) => setNewComboStock((prev) => ({ ...prev, [combo.id]: e.target.value }))}
            required
          />
          <button type="submit">上架</button>
        </form>
      ))}
    </div>
  );
}
