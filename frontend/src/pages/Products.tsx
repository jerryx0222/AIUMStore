import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../api/client";
import { useCategoryCascade } from "../hooks/useCategoryCascade";
import type { Category, ProductListItem } from "../types";

export function ProductsPage() {
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const cascade = useCategoryCascade(categories);

  useEffect(() => {
    api.get<Category[]>("/products/categories/").then(({ data }) => setCategories(data));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (cascade.resolved) params.category = cascade.resolved.slug;
    api
      .get<ProductListItem[]>("/products/", { params })
      .then(({ data }) => setProducts(data))
      .finally(() => setLoading(false));
  }, [cascade.resolved]);

  return (
    <div>
      <h1>商品列表</h1>
      <div className="filters">
        <select value={cascade.name} onChange={(e) => cascade.selectName(e.target.value)}>
          <option value="">所有種類</option>
          {cascade.names.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        {cascade.levels.map(({ level, options }) => (
          <select
            key={level}
            value={cascade.subSelections[level - 1]}
            onChange={(e) => cascade.selectSubLevel(level, e.target.value)}
          >
            <option value="">子種類{level}</option>
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        ))}
      </div>

      {loading ? (
        <p>載入中...</p>
      ) : (
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
      )}
    </div>
  );
}
