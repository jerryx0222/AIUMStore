import { FormEvent, useEffect, useState } from "react";

import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import type {
  BrandOwnerGroup,
  Category,
  FranchiseListing,
  ManagementDashboard,
} from "../types";

const emptyProductForm = { category: "", name: "", spec: "", process: "", suggested_price: "" };

export function ManagementDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<ManagementDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [franchiseListings, setFranchiseListings] = useState<FranchiseListing[]>([]);
  const [newProductForms, setNewProductForms] = useState<Record<number, typeof emptyProductForm>>(
    {}
  );

  async function reload() {
    const { data } = await api.get<ManagementDashboard>("/accounts/dashboard/");
    setData(data);
    if (data.franchise_masters.length > 0) {
      const { data: listings } = await api.get<FranchiseListing[]>("/products/franchise-listings/");
      setFranchiseListings(listings);
    } else {
      setFranchiseListings([]);
    }
  }

  useEffect(() => {
    api.get<Category[]>("/products/categories/").then(({ data }) => setCategories(data));
    reload().finally(() => setLoading(false));
  }, []);

  function getNewProductForm(brandOwnerId: number) {
    return newProductForms[brandOwnerId] ?? emptyProductForm;
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
            {data.brand_owners.map((group) => (
              <div key={group.brand_owner.id} className="erp-group">
                <div className="erp-group-title">
                  {group.brand?.name_zh ??
                    `${group.brand_owner.name || group.brand_owner.username}（尚未擁有品牌）`}
                </div>
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
                        {categories.map((c) => (
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
              </div>
            ))}
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
