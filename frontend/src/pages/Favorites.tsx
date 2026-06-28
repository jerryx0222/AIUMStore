import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../api/client";
import type { ProductListItem } from "../types";

export function FavoritesPage() {
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<ProductListItem[]>("/accounts/favorites/")
      .then(({ data }) => setProducts(data))
      .finally(() => setLoading(false));
  }, []);

  async function removeFavorite(productId: number) {
    await api.delete(`/accounts/favorites/${productId}/`);
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  }

  if (loading) return <p>載入中...</p>;

  return (
    <div>
      <h1>我的最愛</h1>
      {products.length === 0 && <p>尚未收藏任何商品</p>}
      <div className="product-grid">
        {products.map((product) => (
          <div key={product.id} className="product-card">
            <Link to={`/products/${product.slug}`}>
              {product.image && <img src={product.image} alt={product.name} />}
              <h3>{product.name}</h3>
              <p>{product.brand_name ?? product.category.name}</p>
            </Link>
            <button onClick={() => removeFavorite(product.id)}>移除收藏</button>
          </div>
        ))}
      </div>
    </div>
  );
}
