import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import type { Product, StoreProductListing } from "../types";

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [listings, setListings] = useState<StoreProductListing[]>([]);
  const [selectedListing, setSelectedListing] = useState<StoreProductListing | null>(null);
  const [favorited, setFavorited] = useState(false);
  const { user } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    api.get<Product>(`/products/${slug}/`).then(({ data }) => setProduct(data));
  }, [slug]);

  useEffect(() => {
    if (!product) return;
    api
      .get<StoreProductListing[]>("/products/store-listings/", {
        params: { product_id: product.id },
      })
      .then(({ data }) => {
        setListings(data);
        setSelectedListing(data[0] ?? null);
      });
  }, [product]);

  if (!product) return <p>載入中...</p>;

  async function handleAddToCart() {
    if (!user) {
      navigate("/login");
      return;
    }
    if (!selectedListing) return;
    await addItem(selectedListing.id, 1);
  }

  async function handleToggleFavorite() {
    if (favorited) {
      await api.delete(`/accounts/favorites/${product!.id}/`);
      setFavorited(false);
    } else {
      await api.post("/accounts/favorites/", { product_id: product!.id });
      setFavorited(true);
    }
  }

  return (
    <div className="product-detail">
      <button className="back-button" onClick={() => navigate(-1)}>
        ← 返回
      </button>
      {product.images[0] && <img src={product.images[0].image} alt={product.name} />}
      <h1>{product.name}</h1>
      {product.product_brand_name && (
        <p className="firm-name">產品品牌: {product.product_brand_name}</p>
      )}
      <p className="firm-name">
        種類:{" "}
        {[
          product.category.name,
          product.category.sub_category_1,
          product.category.sub_category_2,
          product.category.sub_category_3,
          product.category.sub_category_4,
          product.category.sub_category_5,
        ]
          .filter(Boolean)
          .join(" / ")}
      </p>
      {product.spec && <p>規格: {product.spec}</p>}
      <p>建議價格: NT$ {product.suggested_price}</p>
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
      {listings.length === 0 && <p>目前尚無門市上架此商品</p>}
      <div className="actions">
        <button disabled={!selectedListing} onClick={handleAddToCart}>
          加入購物車
        </button>
        {user?.level === "member" && (
          <button onClick={handleToggleFavorite}>
            {favorited ? "移除最愛" : "加入最愛"}
          </button>
        )}
      </div>
    </div>
  );
}
