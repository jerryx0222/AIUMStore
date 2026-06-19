import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import type { ProductDetail, ProductVariant } from "../types";

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
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

  return (
    <div className="product-detail">
      {product.image && <img src={product.image} alt={product.name} />}
      <h1>{product.name}</h1>
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
      <button disabled={!selectedVariant} onClick={handleAddToCart}>
        加入購物車
      </button>
    </div>
  );
}
