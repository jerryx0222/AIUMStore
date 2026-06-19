import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../api/client";
import type { ProductListItem } from "../types";

export function ProductsPage() {
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<ProductListItem[]>("/products/")
      .then(({ data }) => setProducts(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>載入中...</p>;

  return (
    <div>
      <h1>商品列表</h1>
      <div className="product-grid">
        {products.map((product) => (
          <Link key={product.id} to={`/products/${product.slug}`} className="product-card">
            {product.image && <img src={product.image} alt={product.name} />}
            <h3>{product.name}</h3>
            <p>{product.category.name}</p>
            <p>{product.min_price ? `NT$ ${product.min_price} 起` : "尚無規格"}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
