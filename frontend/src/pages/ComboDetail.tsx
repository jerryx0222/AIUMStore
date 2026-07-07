import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import type { Combo, StoreComboListing } from "../types";

export function ComboDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [combo, setCombo] = useState<Combo | null>(null);
  const [listings, setListings] = useState<StoreComboListing[]>([]);
  const [selectedListing, setSelectedListing] = useState<StoreComboListing | null>(null);
  const { user } = useAuth();
  const { addComboItem } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    api.get<Combo>(`/products/combos/${slug}/`).then(({ data }) => setCombo(data));
  }, [slug]);

  useEffect(() => {
    if (!combo) return;
    api
      .get<StoreComboListing[]>("/products/combo-store-listings/", {
        params: { combo_id: combo.id },
      })
      .then(({ data }) => {
        setListings(data);
        setSelectedListing(data[0] ?? null);
      });
  }, [combo]);

  if (!combo) return <p>載入中...</p>;

  async function handleAddToCart() {
    if (!user) {
      navigate("/login");
      return;
    }
    if (!selectedListing) return;
    await addComboItem(selectedListing.id, 1);
  }

  return (
    <div className="product-detail">
      <button className="back-button" onClick={() => navigate(-1)}>
        ← 返回
      </button>
      {combo.image && <img src={combo.image} alt={combo.name} />}
      <h1>{combo.name}</h1>
      {combo.product_brand_name && (
        <p className="firm-name">產品品牌: {combo.product_brand_name}</p>
      )}
      <p className="firm-name">套餐內容:</p>
      <ul className="combo-item-list">
        {combo.items.map((item) => (
          <li key={item.id}>
            {item.product.name}
            {item.product.spec && `（${item.product.spec}）`} x {item.quantity}
          </li>
        ))}
      </ul>
      <p>建議價格: NT$ {combo.suggested_price}</p>
      <div className="variants">
        {listings.map((listing) => (
          <button
            key={listing.id}
            className={listing.id === selectedListing?.id ? "variant active" : "variant"}
            onClick={() => setSelectedListing(listing)}
          >
            {listing.franchise_brand_name} - NT$ {listing.price}（庫存{" "}
            {listing.stock}）
          </button>
        ))}
      </div>
      {listings.length === 0 && <p>目前尚無門市上架此套餐</p>}
      <div className="actions">
        <button disabled={!selectedListing} onClick={handleAddToCart}>
          加入購物車
        </button>
      </div>
    </div>
  );
}
