import { FormEvent, useEffect, useState } from "react";

import { api } from "../api/client";
import { AccountManagementPanel } from "../components/AccountManagementPanel";
import { useAuth } from "../context/AuthContext";
import type {
  Brand,
  BrandOwnerGroup,
  Category,
  Combo,
  FranchiseListing,
  ManagementDashboard,
} from "../types";

const emptyProductForm = { category: "", name: "", spec: "", process: "", suggested_price: "" };
const emptyComboForm = { name: "", suggested_price: "" };
const emptyComboItemForm = { product: "", quantity: "1" };
const emptyBrandForm = { name_zh: "", name_en: "", website: "", note: "" };
const emptyCategoryForm = {
  name: "",
  sub_category_1: "",
  sub_category_2: "",
  sub_category_3: "",
  sub_category_4: "",
  sub_category_5: "",
  description: "",
};

export function ManagementDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<ManagementDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [categoriesByBrand, setCategoriesByBrand] = useState<Record<number, Category[]>>({});
  const [franchiseListings, setFranchiseListings] = useState<FranchiseListing[]>([]);
  const [newProductForms, setNewProductForms] = useState<Record<number, typeof emptyProductForm>>(
    {}
  );
  const [newComboForms, setNewComboForms] = useState<Record<number, typeof emptyComboForm>>({});
  const [newComboItemForms, setNewComboItemForms] = useState<
    Record<number, typeof emptyComboItemForm>
  >({});
  const [brandForm, setBrandForm] = useState(emptyBrandForm);
  const [brandFormOwnerId, setBrandFormOwnerId] = useState("");
  const [brandIcon, setBrandIcon] = useState<File | null>(null);
  const [productBrands, setProductBrands] = useState<Brand[]>([]);
  const [newCategoryForms, setNewCategoryForms] = useState<Record<number, typeof emptyCategoryForm>>(
    {}
  );

  async function loadCategoriesForBrand(brandId: number) {
    const { data } = await api.get<Category[]>("/products/categories/", {
      params: { product_brand: brandId },
    });
    setCategoriesByBrand((prev) => ({ ...prev, [brandId]: data }));
  }

  async function reload() {
    const { data } = await api.get<ManagementDashboard>("/accounts/dashboard/");
    setData(data);
    if (data.franchise_masters.length > 0) {
      const { data: listings } = await api.get<FranchiseListing[]>("/products/franchise-listings/");
      setFranchiseListings(listings);
    } else {
      setFranchiseListings([]);
    }
    if (user?.is_superuser) {
      const { data: brands } = await api.get<Brand[]>("/products/brands/");
      setProductBrands(brands.filter((b) => b.brand_type === "product_brand"));
    }
    await Promise.all(
      data.brand_owners
        .filter((g): g is typeof g & { brand: Brand } => g.brand != null)
        .map((g) => loadCategoriesForBrand(g.brand.id))
    );
  }

  useEffect(() => {
    reload().finally(() => setLoading(false));
  }, []);

  function getNewProductForm(brandOwnerId: number) {
    return newProductForms[brandOwnerId] ?? emptyProductForm;
  }

  function getNewComboForm(brandOwnerId: number) {
    return newComboForms[brandOwnerId] ?? emptyComboForm;
  }

  function getNewComboItemForm(comboId: number) {
    return newComboItemForms[comboId] ?? emptyComboItemForm;
  }

  function getNewCategoryForm(brandOwnerId: number) {
    return newCategoryForms[brandOwnerId] ?? emptyCategoryForm;
  }

  async function handleCreateCategory(group: BrandOwnerGroup, event: FormEvent) {
    event.preventDefault();
    if (!group.brand) return;
    const form = getNewCategoryForm(group.brand_owner.id);
    const params = user?.is_superuser ? { brand_id: group.brand.id } : undefined;
    await api.post("/products/categories/", form, { params });
    setNewCategoryForms((prev) => ({ ...prev, [group.brand_owner.id]: emptyCategoryForm }));
    await loadCategoriesForBrand(group.brand.id);
  }

  async function handleUpdateCategory(
    brandId: number,
    slug: string,
    changes: Partial<typeof emptyCategoryForm>
  ) {
    await api.patch(`/products/categories/${slug}/`, changes);
    await loadCategoriesForBrand(brandId);
  }

  async function handleDeleteCategory(brandId: number, slug: string) {
    await api.delete(`/products/categories/${slug}/`);
    await loadCategoriesForBrand(brandId);
  }

  async function handleCreateBrand(event: FormEvent) {
    event.preventDefault();
    const formData = new FormData();
    formData.append("name_zh", brandForm.name_zh);
    formData.append("name_en", brandForm.name_en);
    formData.append("website", brandForm.website);
    formData.append("note", brandForm.note);
    if (brandIcon) formData.append("icon", brandIcon);
    await api.post("/products/product-brands/", formData, {
      params: brandFormOwnerId ? { owner_id: brandFormOwnerId } : undefined,
      headers: { "Content-Type": "multipart/form-data" },
    });
    setBrandForm(emptyBrandForm);
    setBrandFormOwnerId("");
    setBrandIcon(null);
    await reload();
  }

  async function handleUpdateProductBrand(
    brandId: number,
    changes: { name_zh?: string; name_en?: string; website?: string; note?: string }
  ) {
    await api.patch(`/products/product-brands/${brandId}/`, changes);
    await reload();
  }

  async function handleUploadBrandIcon(brandId: number, file: File) {
    const formData = new FormData();
    formData.append("icon", file);
    await api.patch(`/products/product-brands/${brandId}/`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    await reload();
  }

  async function handleReassignBrandOwner(brandId: number, ownerId: string) {
    await api.patch(`/products/product-brands/${brandId}/`, { owner: ownerId || null });
    await reload();
  }

  function canEditBrand(group: BrandOwnerGroup) {
    return !!user && (user.is_superuser || user.id === group.brand_owner.id);
  }

  async function handleCreateProduct(group: BrandOwnerGroup, event: FormEvent) {
    event.preventDefault();
    if (!group.brand) return;
    const form = getNewProductForm(group.brand_owner.id);
    const params = user?.is_superuser ? { brand_id: group.brand.id } : undefined;
    await api.post(
      "/products/my-products/",
      {
        category: Number(form.category),
        name: form.name,
        spec: form.spec,
        process: form.process,
        suggested_price: form.suggested_price,
      },
      { params }
    );
    setNewProductForms((prev) => ({ ...prev, [group.brand_owner.id]: emptyProductForm }));
    await reload();
  }

  async function handleUpdateProduct(
    productId: number,
    changes: { name?: string; spec?: string; process?: string; suggested_price?: string; category?: number }
  ) {
    await api.patch(`/products/my-products/${productId}/`, changes);
    await reload();
  }

  async function handleDeleteProduct(productId: number) {
    await api.delete(`/products/my-products/${productId}/`);
    await reload();
  }

  async function handleUploadImage(productId: number, file: File) {
    const formData = new FormData();
    formData.append("product", String(productId));
    formData.append("image", file);
    await api.post("/products/my-product-images/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    await reload();
  }

  async function handleDeleteImage(imageId: number) {
    await api.delete(`/products/my-product-images/${imageId}/`);
    await reload();
  }

  async function handleCreateCombo(group: BrandOwnerGroup, event: FormEvent) {
    event.preventDefault();
    if (!group.brand) return;
    const form = getNewComboForm(group.brand_owner.id);
    const params = user?.is_superuser ? { brand_id: group.brand.id } : undefined;
    await api.post(
      "/products/my-combos/",
      { name: form.name, suggested_price: form.suggested_price },
      { params }
    );
    setNewComboForms((prev) => ({ ...prev, [group.brand_owner.id]: emptyComboForm }));
    await reload();
  }

  async function handleUpdateCombo(
    comboId: number,
    changes: { name?: string; suggested_price?: string }
  ) {
    await api.patch(`/products/my-combos/${comboId}/`, changes);
    await reload();
  }

  async function handleDeleteCombo(comboId: number) {
    await api.delete(`/products/my-combos/${comboId}/`);
    await reload();
  }

  async function handleUploadComboImage(comboId: number, file: File) {
    const formData = new FormData();
    formData.append("image", file);
    await api.patch(`/products/my-combos/${comboId}/`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    await reload();
  }

  async function handleAddComboItem(combo: Combo, event: FormEvent) {
    event.preventDefault();
    const form = getNewComboItemForm(combo.id);
    if (!form.product) return;
    await api.post("/products/my-combo-items/", {
      combo: combo.id,
      product: Number(form.product),
      quantity: Number(form.quantity),
    });
    setNewComboItemForms((prev) => ({ ...prev, [combo.id]: emptyComboItemForm }));
    await reload();
  }

  async function handleDeleteComboItem(itemId: number) {
    await api.delete(`/products/my-combo-items/${itemId}/`);
    await reload();
  }

  async function handleUpdateFranchiseListing(
    listingId: number,
    changes: { actual_price?: string | null; is_active?: boolean }
  ) {
    await api.patch(`/products/franchise-listings/${listingId}/`, changes);
    await reload();
  }

  if (loading) return <p>載入中...</p>;
  if (!data) return <p>載入失敗</p>;

  const hasAny =
    data.store_clerks.length > 0 ||
    data.franchise_masters.length > 0 ||
    data.brand_owners.length > 0;

  const recordCount =
    data.store_clerks.reduce((sum, g) => sum + g.clerks.length, 0) +
    data.franchise_masters.length +
    data.brand_owners.reduce((sum, g) => sum + g.products.length, 0);

  return (
    <div className="erp-page">
      <h1>管理維護頁</h1>
      {!hasAny && <p>目前沒有可顯示的資料</p>}

      {user?.is_superuser && (
        <div className="erp-panel">
          <div className="erp-panel-title">新增品牌</div>
          <div className="erp-panel-body">
            <form onSubmit={handleCreateBrand} className="erp-group">
              <div className="actions">
                <input
                  placeholder="品牌中文名"
                  value={brandForm.name_zh}
                  onChange={(e) => setBrandForm({ ...brandForm, name_zh: e.target.value })}
                  required
                />
                <input
                  placeholder="品牌英文名"
                  value={brandForm.name_en}
                  onChange={(e) => setBrandForm({ ...brandForm, name_en: e.target.value })}
                />
                <input
                  placeholder="網址"
                  value={brandForm.website}
                  onChange={(e) => setBrandForm({ ...brandForm, website: e.target.value })}
                />
                <input
                  placeholder="備註"
                  value={brandForm.note}
                  onChange={(e) => setBrandForm({ ...brandForm, note: e.target.value })}
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setBrandIcon(e.target.files?.[0] ?? null)}
                />
                <select
                  value={brandFormOwnerId}
                  onChange={(e) => setBrandFormOwnerId(e.target.value)}
                >
                  <option value="">不指定品牌主(稍後指派)</option>
                  {data.brand_owners
                    .filter((g) => !g.brand)
                    .map((g) => (
                      <option key={g.brand_owner.id} value={g.brand_owner.id}>
                        指派給：{g.brand_owner.name || g.brand_owner.username}
                      </option>
                    ))}
                </select>
                <button type="submit">新增品牌</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {user?.is_superuser && (
        <div className="erp-panel">
          <div className="erp-panel-title">品牌維護</div>
          <div className="erp-panel-body">
            {productBrands.length === 0 ? (
              <p>尚無品牌</p>
            ) : (
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>圖標</th>
                    <th>中文名</th>
                    <th>英文名</th>
                    <th>網址</th>
                    <th>備註</th>
                    <th>品牌主</th>
                  </tr>
                </thead>
                <tbody>
                  {productBrands.map((brand) => (
                    <tr key={brand.id}>
                      <td>
                        {brand.icon && (
                          <img src={brand.icon} alt="" style={{ height: "28px" }} />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUploadBrandIcon(brand.id, file);
                          }}
                        />
                      </td>
                      <td>
                        <input
                          defaultValue={brand.name_zh}
                          onBlur={(e) =>
                            e.target.value !== brand.name_zh &&
                            handleUpdateProductBrand(brand.id, { name_zh: e.target.value })
                          }
                        />
                      </td>
                      <td>
                        <input
                          defaultValue={brand.name_en}
                          onBlur={(e) =>
                            e.target.value !== brand.name_en &&
                            handleUpdateProductBrand(brand.id, { name_en: e.target.value })
                          }
                        />
                      </td>
                      <td>
                        <input
                          defaultValue={brand.website}
                          onBlur={(e) =>
                            e.target.value !== brand.website &&
                            handleUpdateProductBrand(brand.id, { website: e.target.value })
                          }
                        />
                      </td>
                      <td>
                        <input
                          defaultValue={brand.note}
                          onBlur={(e) =>
                            e.target.value !== brand.note &&
                            handleUpdateProductBrand(brand.id, { note: e.target.value })
                          }
                        />
                      </td>
                      <td>
                        <select
                          defaultValue={brand.owner ?? ""}
                          onChange={(e) => handleReassignBrandOwner(brand.id, e.target.value)}
                        >
                          <option value="">未指派</option>
                          {data.brand_owners
                            .filter((g) => !g.brand || g.brand.id === brand.id)
                            .map((g) => (
                              <option key={g.brand_owner.id} value={g.brand_owner.id}>
                                {g.brand_owner.name || g.brand_owner.username}
                              </option>
                            ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {user?.is_superuser && (
        <AccountManagementPanel
          title="品牌主管理"
          createLabel="新增品牌主"
          endpoint="/accounts/brand-owners/"
        />
      )}

      {user?.is_superuser && (
        <AccountManagementPanel
          title="加盟主管理"
          createLabel="新增加盟主"
          endpoint="/accounts/franchise-masters/"
        />
      )}

      {data.store_clerks.length > 0 && (
        <div className="erp-panel">
          <div className="erp-panel-title">店員資料</div>
          <div className="erp-panel-body">
            {data.store_clerks.map((group) => (
              <div key={group.store_owner.id} className="erp-group">
                <div className="erp-group-title">
                  {group.store_name ?? group.store_owner.name ?? group.store_owner.username} 的店員
                </div>
                {group.clerks.length === 0 ? (
                  <p>尚無店員</p>
                ) : (
                  <table className="erp-table">
                    <thead>
                      <tr>
                        <th>姓名</th>
                        <th>聯絡方式</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.clerks.map((clerk) => (
                        <tr key={clerk.id}>
                          <td>{clerk.name || clerk.username}</td>
                          <td>{clerk.mobile || clerk.phone || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {data.franchise_masters.length > 0 && (
        <div className="erp-panel">
          <div className="erp-panel-title">加盟品牌與店主資料</div>
          <div className="erp-panel-body">
            {data.franchise_masters.map((group) => (
              <div key={group.franchise_master.id} className="erp-group">
                <div className="erp-group-title">
                  {group.franchise_master.name || group.franchise_master.username}
                </div>
                {group.franchised_brands.length === 0 ? (
                  <p>尚未加盟任何品牌</p>
                ) : (
                  group.franchised_brands.map((brand) => (
                    <div key={brand.id} style={{ marginBottom: "0.5rem" }}>
                      <strong>{brand.name_zh || brand.name_en}</strong>
                      {brand.products.length === 0 ? (
                        <p>尚無產品</p>
                      ) : (
                        <table className="erp-table">
                          <thead>
                            <tr>
                              <th>產品</th>
                              <th>實售價格</th>
                            </tr>
                          </thead>
                          <tbody>
                            {brand.products.map((product) => (
                              <tr key={product.id}>
                                <td>{product.name}</td>
                                <td>NT$ {product.selling_price}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  ))
                )}
                <p>
                  管理的店主:{" "}
                  {group.managed_store_owners.length === 0
                    ? "尚無店主"
                    : group.managed_store_owners.map((s) => s.name || s.username).join("、")}
                </p>
              </div>
            ))}

            <div className="erp-group">
              <div className="erp-group-title">門市商品：實際價格與上下架</div>
              {franchiseListings.length === 0 ? (
                <p>目前管理的門市尚無上架商品</p>
              ) : (
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th>門市</th>
                      <th>產品</th>
                      <th>庫存</th>
                      <th>實際價格</th>
                      <th>上下架</th>
                    </tr>
                  </thead>
                  <tbody>
                    {franchiseListings.map((listing) => (
                      <tr key={listing.id}>
                        <td>{listing.franchise_brand_name}</td>
                        <td>{listing.product_name}</td>
                        <td>{listing.stock}</td>
                        <td>
                          <input
                            type="number"
                            value={listing.actual_price ?? ""}
                            onChange={(e) =>
                              setFranchiseListings((prev) =>
                                prev.map((l) =>
                                  l.id === listing.id
                                    ? { ...l, actual_price: e.target.value || null }
                                    : l
                                )
                              )
                            }
                          />
                          <button
                            onClick={() =>
                              handleUpdateFranchiseListing(listing.id, {
                                actual_price: listing.actual_price,
                              })
                            }
                          >
                            儲存
                          </button>
                        </td>
                        <td>
                          <button
                            onClick={() =>
                              handleUpdateFranchiseListing(listing.id, {
                                is_active: !listing.is_active,
                              })
                            }
                          >
                            {listing.is_active ? "下架" : "上架"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {data.brand_owners.length > 0 && (
        <div className="erp-panel">
          <div className="erp-panel-title">品牌與產品資料</div>
          <div className="erp-panel-body">
            {data.brand_owners.map((group) => {
              const brandCategories = group.brand ? categoriesByBrand[group.brand.id] ?? [] : [];
              return (
              <div key={group.brand_owner.id} className="erp-group">
                <div className="erp-group-title">
                  {group.brand?.name_zh ??
                    `${group.brand_owner.name || group.brand_owner.username}（尚未擁有品牌）`}
                </div>

                {group.brand && (
                  <>
                    <div className="erp-group-title">種類</div>
                    {brandCategories.length === 0 ? (
                      <p>尚無種類</p>
                    ) : (
                      <table className="erp-table">
                        <thead>
                          <tr>
                            <th>名稱</th>
                            <th>子種類</th>
                            <th>說明</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {brandCategories.map((category) =>
                            canEditBrand(group) ? (
                              <tr key={category.id}>
                                <td>
                                  <input
                                    defaultValue={category.name}
                                    onBlur={(e) =>
                                      e.target.value !== category.name &&
                                      handleUpdateCategory(group.brand!.id, category.slug, {
                                        name: e.target.value,
                                      })
                                    }
                                  />
                                </td>
                                <td>
                                  {[1, 2, 3, 4, 5].map((level) => {
                                    const key = `sub_category_${level}` as
                                      | "sub_category_1"
                                      | "sub_category_2"
                                      | "sub_category_3"
                                      | "sub_category_4"
                                      | "sub_category_5";
                                    return (
                                      <input
                                        key={level}
                                        placeholder={`子種類${level}`}
                                        style={{ width: "5rem", marginRight: "0.25rem" }}
                                        defaultValue={category[key]}
                                        onBlur={(e) =>
                                          e.target.value !== category[key] &&
                                          handleUpdateCategory(group.brand!.id, category.slug, {
                                            [key]: e.target.value,
                                          })
                                        }
                                      />
                                    );
                                  })}
                                </td>
                                <td>
                                  <input
                                    defaultValue={category.description}
                                    onBlur={(e) =>
                                      e.target.value !== category.description &&
                                      handleUpdateCategory(group.brand!.id, category.slug, {
                                        description: e.target.value,
                                      })
                                    }
                                  />
                                </td>
                                <td>
                                  <button
                                    onClick={() =>
                                      handleDeleteCategory(group.brand!.id, category.slug)
                                    }
                                  >
                                    刪除
                                  </button>
                                </td>
                              </tr>
                            ) : (
                              <tr key={category.id}>
                                <td>{category.name}</td>
                                <td>{category.sub_categories.join("、") || "-"}</td>
                                <td>{category.description || "-"}</td>
                                <td></td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    )}

                    {canEditBrand(group) && (
                      <form
                        onSubmit={(e) => handleCreateCategory(group, e)}
                        className="erp-group"
                        style={{ marginTop: "0.75rem" }}
                      >
                        <div className="erp-group-title">新增種類</div>
                        <div className="actions">
                          <input
                            placeholder="種類名稱"
                            value={getNewCategoryForm(group.brand_owner.id).name}
                            onChange={(e) =>
                              setNewCategoryForms((prev) => ({
                                ...prev,
                                [group.brand_owner.id]: {
                                  ...getNewCategoryForm(group.brand_owner.id),
                                  name: e.target.value,
                                },
                              }))
                            }
                            required
                          />
                          <input
                            placeholder="子種類1"
                            value={getNewCategoryForm(group.brand_owner.id).sub_category_1}
                            onChange={(e) =>
                              setNewCategoryForms((prev) => ({
                                ...prev,
                                [group.brand_owner.id]: {
                                  ...getNewCategoryForm(group.brand_owner.id),
                                  sub_category_1: e.target.value,
                                },
                              }))
                            }
                          />
                          <input
                            placeholder="子種類2"
                            value={getNewCategoryForm(group.brand_owner.id).sub_category_2}
                            onChange={(e) =>
                              setNewCategoryForms((prev) => ({
                                ...prev,
                                [group.brand_owner.id]: {
                                  ...getNewCategoryForm(group.brand_owner.id),
                                  sub_category_2: e.target.value,
                                },
                              }))
                            }
                          />
                          <input
                            placeholder="子種類3"
                            value={getNewCategoryForm(group.brand_owner.id).sub_category_3}
                            onChange={(e) =>
                              setNewCategoryForms((prev) => ({
                                ...prev,
                                [group.brand_owner.id]: {
                                  ...getNewCategoryForm(group.brand_owner.id),
                                  sub_category_3: e.target.value,
                                },
                              }))
                            }
                          />
                          <input
                            placeholder="子種類4"
                            value={getNewCategoryForm(group.brand_owner.id).sub_category_4}
                            onChange={(e) =>
                              setNewCategoryForms((prev) => ({
                                ...prev,
                                [group.brand_owner.id]: {
                                  ...getNewCategoryForm(group.brand_owner.id),
                                  sub_category_4: e.target.value,
                                },
                              }))
                            }
                          />
                          <input
                            placeholder="子種類5"
                            value={getNewCategoryForm(group.brand_owner.id).sub_category_5}
                            onChange={(e) =>
                              setNewCategoryForms((prev) => ({
                                ...prev,
                                [group.brand_owner.id]: {
                                  ...getNewCategoryForm(group.brand_owner.id),
                                  sub_category_5: e.target.value,
                                },
                              }))
                            }
                          />
                          <input
                            placeholder="說明"
                            value={getNewCategoryForm(group.brand_owner.id).description}
                            onChange={(e) =>
                              setNewCategoryForms((prev) => ({
                                ...prev,
                                [group.brand_owner.id]: {
                                  ...getNewCategoryForm(group.brand_owner.id),
                                  description: e.target.value,
                                },
                              }))
                            }
                          />
                          <button type="submit">新增種類</button>
                        </div>
                      </form>
                    )}
                  </>
                )}

                {group.products.length === 0 ? (
                  <p>尚無產品</p>
                ) : (
                  <table className="erp-table">
                    <thead>
                      <tr>
                        <th>名稱</th>
                        <th>規格</th>
                        <th>製程</th>
                        <th>建議價格</th>
                        <th>圖片</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.products.map((product) =>
                        canEditBrand(group) ? (
                          <tr key={product.id}>
                            <td>
                              <input
                                defaultValue={product.name}
                                onBlur={(e) =>
                                  e.target.value !== product.name &&
                                  handleUpdateProduct(product.id, { name: e.target.value })
                                }
                              />
                            </td>
                            <td>
                              <input
                                defaultValue={product.spec}
                                onBlur={(e) =>
                                  e.target.value !== product.spec &&
                                  handleUpdateProduct(product.id, { spec: e.target.value })
                                }
                              />
                            </td>
                            <td>
                              <input
                                defaultValue={product.process}
                                onBlur={(e) =>
                                  e.target.value !== product.process &&
                                  handleUpdateProduct(product.id, { process: e.target.value })
                                }
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                defaultValue={product.suggested_price}
                                onBlur={(e) =>
                                  e.target.value !== product.suggested_price &&
                                  handleUpdateProduct(product.id, {
                                    suggested_price: e.target.value,
                                  })
                                }
                              />
                            </td>
                            <td>
                              {product.images.map((image) => (
                                <span key={image.id} style={{ marginRight: "0.5rem" }}>
                                  <img src={image.image} alt="" style={{ height: "32px" }} />
                                  <button onClick={() => handleDeleteImage(image.id)}>×</button>
                                </span>
                              ))}
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleUploadImage(product.id, file);
                                }}
                              />
                            </td>
                            <td>
                              <button onClick={() => handleDeleteProduct(product.id)}>刪除</button>
                            </td>
                          </tr>
                        ) : (
                          <tr key={product.id}>
                            <td colSpan={5}>{product.name}</td>
                            <td>NT$ {product.selling_price}</td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                )}

                {canEditBrand(group) && group.brand && (
                  <form
                    onSubmit={(e) => handleCreateProduct(group, e)}
                    className="erp-group"
                    style={{ marginTop: "0.75rem" }}
                  >
                    <div className="erp-group-title">新增產品</div>
                    <div className="actions">
                      <select
                        value={getNewProductForm(group.brand_owner.id).category}
                        onChange={(e) =>
                          setNewProductForms((prev) => ({
                            ...prev,
                            [group.brand_owner.id]: {
                              ...getNewProductForm(group.brand_owner.id),
                              category: e.target.value,
                            },
                          }))
                        }
                        required
                      >
                        <option value="">種類</option>
                        {brandCategories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <input
                        placeholder="產品名稱"
                        value={getNewProductForm(group.brand_owner.id).name}
                        onChange={(e) =>
                          setNewProductForms((prev) => ({
                            ...prev,
                            [group.brand_owner.id]: {
                              ...getNewProductForm(group.brand_owner.id),
                              name: e.target.value,
                            },
                          }))
                        }
                        required
                      />
                      <input
                        placeholder="規格"
                        value={getNewProductForm(group.brand_owner.id).spec}
                        onChange={(e) =>
                          setNewProductForms((prev) => ({
                            ...prev,
                            [group.brand_owner.id]: {
                              ...getNewProductForm(group.brand_owner.id),
                              spec: e.target.value,
                            },
                          }))
                        }
                      />
                      <input
                        placeholder="製程"
                        value={getNewProductForm(group.brand_owner.id).process}
                        onChange={(e) =>
                          setNewProductForms((prev) => ({
                            ...prev,
                            [group.brand_owner.id]: {
                              ...getNewProductForm(group.brand_owner.id),
                              process: e.target.value,
                            },
                          }))
                        }
                      />
                      <input
                        type="number"
                        placeholder="建議價格"
                        value={getNewProductForm(group.brand_owner.id).suggested_price}
                        onChange={(e) =>
                          setNewProductForms((prev) => ({
                            ...prev,
                            [group.brand_owner.id]: {
                              ...getNewProductForm(group.brand_owner.id),
                              suggested_price: e.target.value,
                            },
                          }))
                        }
                        required
                      />
                      <button type="submit">新增產品</button>
                    </div>
                  </form>
                )}

                <div className="erp-group-title" style={{ marginTop: "1rem" }}>
                  套餐
                </div>
                {group.combos.length === 0 ? (
                  <p>尚無套餐</p>
                ) : (
                  <table className="erp-table">
                    <thead>
                      <tr>
                        <th>LOGO</th>
                        <th>名稱</th>
                        <th>套餐內容</th>
                        <th>建議價格</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.combos.map((combo) =>
                        canEditBrand(group) ? (
                          <tr key={combo.id}>
                            <td>
                              {combo.image && (
                                <img src={combo.image} alt="" style={{ height: "28px" }} />
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleUploadComboImage(combo.id, file);
                                }}
                              />
                            </td>
                            <td>
                              <input
                                defaultValue={combo.name}
                                onBlur={(e) =>
                                  e.target.value !== combo.name &&
                                  handleUpdateCombo(combo.id, { name: e.target.value })
                                }
                              />
                            </td>
                            <td>
                              {combo.items.map((item) => (
                                <div key={item.id} style={{ whiteSpace: "nowrap" }}>
                                  {item.product.name} x {item.quantity}{" "}
                                  <button onClick={() => handleDeleteComboItem(item.id)}>×</button>
                                </div>
                              ))}
                              <form
                                onSubmit={(e) => handleAddComboItem(combo, e)}
                                className="actions"
                                style={{ marginTop: "0.35rem" }}
                              >
                                <select
                                  value={getNewComboItemForm(combo.id).product}
                                  onChange={(e) =>
                                    setNewComboItemForms((prev) => ({
                                      ...prev,
                                      [combo.id]: {
                                        ...getNewComboItemForm(combo.id),
                                        product: e.target.value,
                                      },
                                    }))
                                  }
                                  required
                                >
                                  <option value="">選擇產品</option>
                                  {group.products.map((p) => (
                                    <option key={p.id} value={p.id}>
                                      {p.name}
                                    </option>
                                  ))}
                                </select>
                                <input
                                  type="number"
                                  min={1}
                                  style={{ width: "4rem" }}
                                  value={getNewComboItemForm(combo.id).quantity}
                                  onChange={(e) =>
                                    setNewComboItemForms((prev) => ({
                                      ...prev,
                                      [combo.id]: {
                                        ...getNewComboItemForm(combo.id),
                                        quantity: e.target.value,
                                      },
                                    }))
                                  }
                                  required
                                />
                                <button type="submit">新增內容</button>
                              </form>
                            </td>
                            <td>
                              <input
                                type="number"
                                defaultValue={combo.suggested_price}
                                onBlur={(e) =>
                                  e.target.value !== combo.suggested_price &&
                                  handleUpdateCombo(combo.id, { suggested_price: e.target.value })
                                }
                              />
                            </td>
                            <td>
                              <button onClick={() => handleDeleteCombo(combo.id)}>刪除</button>
                            </td>
                          </tr>
                        ) : (
                          <tr key={combo.id}>
                            <td>
                              {combo.image && (
                                <img src={combo.image} alt="" style={{ height: "28px" }} />
                              )}
                            </td>
                            <td>{combo.name}</td>
                            <td>
                              {combo.items.map((item) => `${item.product.name} x ${item.quantity}`).join("、")}
                            </td>
                            <td>NT$ {combo.selling_price}</td>
                            <td></td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                )}

                {canEditBrand(group) && group.brand && (
                  <form
                    onSubmit={(e) => handleCreateCombo(group, e)}
                    className="erp-group"
                    style={{ marginTop: "0.75rem" }}
                  >
                    <div className="erp-group-title">新增套餐</div>
                    <div className="actions">
                      <input
                        placeholder="套餐名稱"
                        value={getNewComboForm(group.brand_owner.id).name}
                        onChange={(e) =>
                          setNewComboForms((prev) => ({
                            ...prev,
                            [group.brand_owner.id]: {
                              ...getNewComboForm(group.brand_owner.id),
                              name: e.target.value,
                            },
                          }))
                        }
                        required
                      />
                      <input
                        type="number"
                        placeholder="建議價格"
                        value={getNewComboForm(group.brand_owner.id).suggested_price}
                        onChange={(e) =>
                          setNewComboForms((prev) => ({
                            ...prev,
                            [group.brand_owner.id]: {
                              ...getNewComboForm(group.brand_owner.id),
                              suggested_price: e.target.value,
                            },
                          }))
                        }
                        required
                      />
                      <button type="submit">新增套餐</button>
                    </div>
                  </form>
                )}
              </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="erp-statusbar">
        <span>Ready</span>
        <span>資料筆數: {recordCount}</span>
      </div>
    </div>
  );
}
