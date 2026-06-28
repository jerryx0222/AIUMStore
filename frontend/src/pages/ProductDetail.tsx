import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import type { ProductDetail, ProductVariant } from "../types";

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [favorited, setFavorited] = useState(false);
  const { user } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    api.get<ProductDetail>(`/products/${slug}/`).then(({ data }) => {
      setProduct(data);
      setSelectedVariant(data.variants[0] ?? null);
    });
  }, [slug]);

  if (!product) return <p>載入中...</p>;

  async function handleAddToCart() {
    if (!user) {
      navigate("/login");
      return;
    }
    if (!selectedVariant) return;
    await addItem(selectedVariant.id, 1);
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
      {product.image && <img src={product.image} alt={product.name} />}
      <h1>{product.name}</h1>
      {product.brand_name && <p className="firm-name">商店分類: {product.brand_name}</p>}
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
      <p>{product.description}</p>
      <div className="variants">
        {product.variants.map((variant) => (
          <button
            key={variant.id}
            className={variant.id === selectedVariant?.id ? "variant active" : "variant"}
            onClick={() => setSelectedVariant(variant)}
          >
            {variant.name} - NT$ {variant.price}
          </button>
        ))}
      </div>
      <div className="actions">
        <button disabled={!selectedVariant} onClick={handleAddToCart}>
          加入購物車
        </button>
        {user?.role === "member" && (
          <button onClick={handleToggleFavorite}>
            {favorited ? "移除最愛" : "加入最愛"}
          </button>
        )}
        {!user && selectedVariant && (
          <Link
            to="/guest-checkout"
            state={{
              variantId: selectedVariant.id,
              variantName: `${product.name} - ${selectedVariant.name}`,
              price: selectedVariant.price,
            }}
          >
            <button>免登入・到店取貨預訂</button>
          </Link>
        )}
      </div>
    </div>
  );
}
