import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../api/client";
import type { Brand, Combo } from "../types";

export function CombosPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Brand[]>("/products/brands/").then(({ data }) => {
      setBrands(data.filter((b) => b.brand_type === "product_brand"));
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (selectedBrandId != null) params.product_brand = String(selectedBrandId);
    api
      .get<Combo[]>("/products/combos/", { params })
      .then(({ data }) => setCombos(data))
      .finally(() => setLoading(false));
  }, [selectedBrandId]);

  function renderComboCard(combo: Combo) {
    return (
      <Link key={combo.id} to={`/combos/${combo.slug}`} className="product-card">
        {combo.image && <img src={combo.image} alt={combo.name} />}
        <h3>{combo.name}</h3>
        <ul className="combo-item-list">
          {combo.items.map((item) => (
            <li key={item.id}>
              {item.product.name} x {item.quantity}
            </li>
          ))}
        </ul>
        <p>NT$ {combo.selling_price}</p>
      </Link>
    );
  }

  return (
    <div>
      <h1>套餐列表</h1>
      <div className="products-layout">
        <aside className="brand-sidebar">
          <ul>
            <li>
              <button
                className={selectedBrandId === null ? "active" : ""}
                onClick={() => setSelectedBrandId(null)}
              >
                所有品牌
              </button>
            </li>
            {brands.map((brand) => (
              <li key={brand.id}>
                <button
                  className={selectedBrandId === brand.id ? "active" : ""}
                  onClick={() => setSelectedBrandId(brand.id)}
                >
                  {brand.icon && <img className="brand-icon" src={brand.icon} alt={brand.name_zh} />}
                  {brand.name_zh}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <div className="products-main">
          {loading ? (
            <p>載入中...</p>
          ) : selectedBrandId === null ? (
            <div className="brand-groups">
              {brands
                .map((brand) => ({
                  brand,
                  items: combos.filter((c) => c.product_brand_id === brand.id),
                }))
                .filter(({ items }) => items.length > 0)
                .map(({ brand, items }) => (
                  <div key={brand.id} className="brand-group">
                    <h2 className="brand-group-title">
                      {brand.icon && (
                        <img className="brand-icon" src={brand.icon} alt={brand.name_zh} />
                      )}
                      {brand.name_zh}
                    </h2>
                    <div className="product-grid">{items.map(renderComboCard)}</div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="product-grid">{combos.map(renderComboCard)}</div>
          )}
        </div>
      </div>
    </div>
  );
}
