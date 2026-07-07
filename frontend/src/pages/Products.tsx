import { MouseEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useCategoryCascade } from "../hooks/useCategoryCascade";
import type {
  Brand,
  Category,
  Combo,
  Product,
  StoreComboListing,
  StoreProductListing,
} from "../types";

const COMBOS_OPTION = "__combos__";

export function ProductsPage() {
  const { user } = useAuth();
  const { addItem, addComboItem } = useCart();
  const navigate = useNavigate();

  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [brandCategories, setBrandCategories] = useState<Category[]>([]);
  const [viewMode, setViewMode] = useState<"products" | "combos">("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [combosLoading, setCombosLoading] = useState(true);
  const [productListingByProduct, setProductListingByProduct] = useState<
    Record<number, StoreProductListing>
  >({});
  const [comboListingByCombo, setComboListingByCombo] = useState<
    Record<number, StoreComboListing>
  >({});
  const cascade = useCategoryCascade(brandCategories);

  useEffect(() => {
    api.get<Brand[]>("/products/brands/").then(({ data }) => {
      setBrands(data.filter((b) => b.brand_type === "product_brand"));
    });
    api.get<Category[]>("/products/categories/").then(({ data }) => setAllCategories(data));
    api.get<StoreProductListing[]>("/products/store-listings/").then(({ data }) => {
      const map: Record<number, StoreProductListing> = {};
      data.forEach((listing) => {
        if (!(listing.product.id in map)) map[listing.product.id] = listing;
      });
      setProductListingByProduct(map);
    });
    api.get<StoreComboListing[]>("/products/combo-store-listings/").then(({ data }) => {
      const map: Record<number, StoreComboListing> = {};
      data.forEach((listing) => {
        if (!(listing.combo.id in map)) map[listing.combo.id] = listing;
      });
      setComboListingByCombo(map);
    });
  }, []);

  useEffect(() => {
    if (selectedBrandId == null) {
      setBrandCategories(allCategories);
      return;
    }
    api
      .get<Product[]>("/products/", { params: { product_brand: String(selectedBrandId) } })
      .then(({ data }) => {
        const seen = new Map<number, Category>();
        data.forEach((p) => seen.set(p.category.id, p.category));
        setBrandCategories(Array.from(seen.values()));
      });
  }, [selectedBrandId, allCategories]);

  useEffect(() => {
    setProductsLoading(true);
    const params: Record<string, string> = {};
    if (cascade.resolved) params.category = cascade.resolved.slug;
    if (selectedBrandId != null) params.product_brand = String(selectedBrandId);
    api
      .get<Product[]>("/products/", { params })
      .then(({ data }) => setProducts(data.filter((p) => Number(p.selling_price) > 0)))
      .finally(() => setProductsLoading(false));
  }, [cascade.resolved, selectedBrandId]);

  useEffect(() => {
    setCombosLoading(true);
    const params: Record<string, string> = {};
    if (selectedBrandId != null) params.product_brand = String(selectedBrandId);
    api
      .get<Combo[]>("/products/combos/", { params })
      .then(({ data }) => setCombos(data))
      .finally(() => setCombosLoading(false));
  }, [selectedBrandId]);

  function selectBrand(brandId: number | null) {
    setSelectedBrandId(brandId);
    cascade.reset();
  }

  function handleCategorySelect(value: string) {
    if (value === COMBOS_OPTION) {
      setViewMode("combos");
      cascade.reset();
    } else {
      setViewMode("products");
      cascade.selectName(value);
    }
  }

  async function handleAddProductToCart(product: Product, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!user) {
      navigate("/login");
      return;
    }
    const listing = productListingByProduct[product.id];
    if (!listing) return;
    await addItem(listing.id, 1);
  }

  async function handleAddComboToCart(combo: Combo, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!user) {
      navigate("/login");
      return;
    }
    const listing = comboListingByCombo[combo.id];
    if (!listing) return;
    await addComboItem(listing.id, 1);
  }

  function renderProductCard(product: Product) {
    const listing = productListingByProduct[product.id];
    return (
      <Link key={product.id} to={`/products/${product.slug}`} className="product-card">
        {product.images[0] && <img src={product.images[0].image} alt={product.name} />}
        <h3>{product.name}</h3>
        <p>{product.category.name}</p>
        {product.spec && <p>規格: {product.spec}</p>}
        <p>NT$ {product.selling_price}</p>
        <button disabled={!listing} onClick={(e) => handleAddProductToCart(product, e)}>
          加入購物車
        </button>
      </Link>
    );
  }

  function renderComboCard(combo: Combo) {
    const listing = comboListingByCombo[combo.id];
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
        <button disabled={!listing} onClick={(e) => handleAddComboToCart(combo, e)}>
          加入購物車
        </button>
      </Link>
    );
  }

  const visibleProducts = viewMode === "combos" ? [] : products;
  const visibleCombos = viewMode === "combos" || cascade.name === "" ? combos : [];
  const loading =
    viewMode === "combos" ? combosLoading : productsLoading || (cascade.name === "" && combosLoading);

  return (
    <div>
      <h1>商品列表</h1>
      <div className="products-layout">
        <aside className="brand-sidebar">
          <ul>
            <li>
              <button
                className={selectedBrandId === null ? "active" : ""}
                onClick={() => selectBrand(null)}
              >
                所有品牌
              </button>
            </li>
            {brands.map((brand) => (
              <li key={brand.id}>
                <button
                  className={selectedBrandId === brand.id ? "active" : ""}
                  onClick={() => selectBrand(brand.id)}
                >
                  {brand.icon && <img className="brand-icon" src={brand.icon} alt={brand.name_zh} />}
                  {brand.name_zh}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <div className="products-main">
          <div className="filters">
            <select
              value={viewMode === "combos" ? COMBOS_OPTION : cascade.name}
              onChange={(e) => handleCategorySelect(e.target.value)}
            >
              <option value="">所有種類</option>
              {cascade.names.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
              <option value={COMBOS_OPTION}>套餐</option>
            </select>
            {viewMode === "products" &&
              cascade.levels.map(({ level, options }) => (
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
          ) : selectedBrandId === null ? (
            <div className="brand-groups">
              {brands
                .map((brand) => ({
                  brand,
                  productItems: visibleProducts.filter((p) => p.product_brand_id === brand.id),
                  comboItems: visibleCombos.filter((c) => c.product_brand_id === brand.id),
                }))
                .filter(({ productItems, comboItems }) => productItems.length > 0 || comboItems.length > 0)
                .map(({ brand, productItems, comboItems }) => (
                  <div key={brand.id} className="brand-group">
                    <h2 className="brand-group-title">
                      {brand.icon && (
                        <img className="brand-icon" src={brand.icon} alt={brand.name_zh} />
                      )}
                      {brand.name_zh}
                    </h2>
                    <div className="product-grid">
                      {productItems.map(renderProductCard)}
                      {comboItems.map(renderComboCard)}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="product-grid">
              {visibleProducts.map(renderProductCard)}
              {visibleCombos.map(renderComboCard)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
