import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { api } from "../api/client";
import { StoreSwitcher } from "../components/StoreSwitcher";
import { useMyStores } from "../hooks/useMyStores";
import type { ManagedStoreProductListing, Product } from "../types";

export function StoreProductsPage() {
  const [searchParams] = useSearchParams();
  const initialStoreId = searchParams.get("store_id");
  const { stores, currentStoreId, setCurrentStoreId, currentStore } = useMyStores(
    initialStoreId ? Number(initialStoreId) : null
  );

  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [listings, setListings] = useState<ManagedStoreProductListing[]>([]);
  const [newStock, setNewStock] = useState<Record<number, string>>({});

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

  useEffect(() => {
    loadListings();
  }, [currentStoreId]);

  useEffect(() => {
    if (!currentStore || currentStore.carried_product_brands.length === 0) {
      setAvailableProducts([]);
      return;
    }
    Promise.all(
      currentStore.carried_product_brands.map((brandId) =>
        api
          .get<Product[]>("/products/", { params: { product_brand: brandId } })
          .then((res) => res.data)
      )
    ).then((results) => setAvailableProducts(results.flat()));
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
            <button onClick={() => updateListing(listing, { stock: listing.stock })}>
              儲存庫存
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
    </div>
  );
}
