import { FormEvent, useEffect, useState } from "react";

import { api } from "../api/client";
import { AccountManagementPanel } from "../components/AccountManagementPanel";
import type { Brand, ManagedAccount } from "../types";

const emptyStoreForm = {
  name_zh: "",
  name_en: "",
  website: "",
  note: "",
  carried_product_brands: [] as number[],
};

function alertApiError(error: any) {
  const data = error?.response?.data;
  const message = data?.detail ?? (Array.isArray(data) ? data[0] : data) ?? "操作失敗，請稍後再試";
  alert(typeof message === "string" ? message : JSON.stringify(message));
}

export function StoreOwnerManagementPage() {
  const [storeOwners, setStoreOwners] = useState<ManagedAccount[]>([]);
  const [stores, setStores] = useState<Brand[]>([]);
  const [productBrands, setProductBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOwnerId, setCreateOwnerId] = useState("");
  const [createForm, setCreateForm] = useState(emptyStoreForm);
  const [selectedStoreId, setSelectedStoreId] = useState<number | "">("");

  async function reload() {
    const [{ data: owners }, { data: storeList }] = await Promise.all([
      api.get<ManagedAccount[]>("/accounts/store-owners/"),
      api.get<Brand[]>("/products/stores/"),
    ]);
    setStoreOwners(owners);
    setStores(storeList);
  }

  useEffect(() => {
    Promise.all([
      reload(),
      api
        .get<Brand[]>("/products/franchisable-brands/")
        .then(({ data }) => setProductBrands(data)),
    ]).finally(() => setLoading(false));
  }, []);

  const ownersWithoutStore = storeOwners.filter(
    (owner) => !stores.some((store) => store.owner === owner.id)
  );

  function toggleCreateProductBrand(id: number) {
    setCreateForm((prev) => ({
      ...prev,
      carried_product_brands: prev.carried_product_brands.includes(id)
        ? prev.carried_product_brands.filter((b) => b !== id)
        : [...prev.carried_product_brands, id],
    }));
  }

  async function handleCreateStore(event: FormEvent) {
    event.preventDefault();
    if (!createOwnerId) return;
    try {
      await api.post("/products/stores/", createForm, { params: { owner_id: createOwnerId } });
      setCreateOwnerId("");
      setCreateForm(emptyStoreForm);
      await reload();
    } catch (error: any) {
      alertApiError(error);
    }
  }

  async function handleUpdateStore(
    storeId: number,
    changes: { name_zh?: string; name_en?: string; website?: string; note?: string }
  ) {
    try {
      await api.patch(`/products/stores/${storeId}/`, changes);
      await reload();
    } catch (error: any) {
      alertApiError(error);
    }
  }

  async function handleToggleStoreProductBrand(store: Brand, brandId: number) {
    const carried_product_brands = store.carried_product_brands.includes(brandId)
      ? store.carried_product_brands.filter((b) => b !== brandId)
      : [...store.carried_product_brands, brandId];
    try {
      await api.patch(`/products/stores/${store.id}/`, { carried_product_brands });
      await reload();
    } catch (error: any) {
      alertApiError(error);
    }
  }

  async function handleUploadStoreIcon(storeId: number, file: File) {
    const formData = new FormData();
    formData.append("icon", file);
    try {
      await api.patch(`/products/stores/${storeId}/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await reload();
    } catch (error: any) {
      alertApiError(error);
    }
  }

  const selectedStore = stores.find((s) => s.id === selectedStoreId);

  return (
    <div className="erp-page">
      <h1>門市管理</h1>

      <AccountManagementPanel
        title="店主帳號"
        createLabel="新增店主"
        endpoint="/accounts/store-owners/"
      />

      <div className="erp-panel">
        <div className="erp-panel-title">門市維護</div>
        <div className="erp-panel-body">
          {loading ? (
            <p>載入中...</p>
          ) : (
            <>
              {ownersWithoutStore.length > 0 && (
                <form onSubmit={handleCreateStore} className="erp-group">
                  <div className="erp-group-title">新增門市</div>
                  <div className="actions">
                    <select
                      value={createOwnerId}
                      onChange={(e) => setCreateOwnerId(e.target.value)}
                      required
                    >
                      <option value="">選擇尚無門市的店主</option>
                      {ownersWithoutStore.map((owner) => (
                        <option key={owner.id} value={owner.id}>
                          {owner.username}（{owner.name || "未填姓名"}）
                        </option>
                      ))}
                    </select>
                    <input
                      placeholder="門市中文名"
                      value={createForm.name_zh}
                      onChange={(e) => setCreateForm({ ...createForm, name_zh: e.target.value })}
                      required
                    />
                    <input
                      placeholder="門市英文名"
                      value={createForm.name_en}
                      onChange={(e) => setCreateForm({ ...createForm, name_en: e.target.value })}
                    />
                    <input
                      placeholder="網址"
                      value={createForm.website}
                      onChange={(e) => setCreateForm({ ...createForm, website: e.target.value })}
                    />
                    <input
                      placeholder="備註"
                      value={createForm.note}
                      onChange={(e) => setCreateForm({ ...createForm, note: e.target.value })}
                    />
                    <button type="submit">新增門市</button>
                  </div>
                  <fieldset style={{ marginTop: "0.5rem" }}>
                    <legend>掛載的產品品牌</legend>
                    {productBrands.length === 0 ? (
                      <p>尚未由系統管理員指定你可加盟的產品品牌，無法掛載</p>
                    ) : (
                      productBrands.map((brand) => (
                        <label key={brand.id} style={{ display: "block" }}>
                          <input
                            type="checkbox"
                            checked={createForm.carried_product_brands.includes(brand.id)}
                            onChange={() => toggleCreateProductBrand(brand.id)}
                          />
                          {brand.name_zh || brand.name_en}
                        </label>
                      ))
                    )}
                  </fieldset>
                </form>
              )}

              {stores.length === 0 ? (
                <p>尚無門市</p>
              ) : (
                <div className="erp-group">
                  <div className="actions">
                    <select
                      value={selectedStoreId}
                      onChange={(e) =>
                        setSelectedStoreId(e.target.value ? Number(e.target.value) : "")
                      }
                    >
                      <option value="">選擇門市</option>
                      {stores.map((store) => (
                        <option key={store.id} value={store.id}>
                          {store.name_zh || store.name_en}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedStore && (
                    <table className="erp-table" key={selectedStore.id}>
                      <thead>
                        <tr>
                          <th>圖標</th>
                          <th>中文名</th>
                          <th>英文名</th>
                          <th>網址</th>
                          <th>備註</th>
                          <th>掛載的產品品牌</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>
                            {selectedStore.icon && (
                              <img src={selectedStore.icon} alt="" style={{ height: "28px" }} />
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleUploadStoreIcon(selectedStore.id, file);
                              }}
                            />
                          </td>
                          <td>
                            <input
                              defaultValue={selectedStore.name_zh}
                              onBlur={(e) =>
                                e.target.value !== selectedStore.name_zh &&
                                handleUpdateStore(selectedStore.id, { name_zh: e.target.value })
                              }
                            />
                          </td>
                          <td>
                            <input
                              defaultValue={selectedStore.name_en}
                              onBlur={(e) =>
                                e.target.value !== selectedStore.name_en &&
                                handleUpdateStore(selectedStore.id, { name_en: e.target.value })
                              }
                            />
                          </td>
                          <td>
                            <input
                              defaultValue={selectedStore.website}
                              onBlur={(e) =>
                                e.target.value !== selectedStore.website &&
                                handleUpdateStore(selectedStore.id, { website: e.target.value })
                              }
                            />
                          </td>
                          <td>
                            <input
                              defaultValue={selectedStore.note}
                              onBlur={(e) =>
                                e.target.value !== selectedStore.note &&
                                handleUpdateStore(selectedStore.id, { note: e.target.value })
                              }
                            />
                          </td>
                          <td>
                            {productBrands.length === 0 ? (
                              <span>尚未由系統管理員指定可加盟的產品品牌</span>
                            ) : (
                              productBrands.map((brand) => (
                                <label
                                  key={brand.id}
                                  style={{ display: "block", whiteSpace: "nowrap" }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedStore.carried_product_brands.includes(brand.id)}
                                    onChange={() =>
                                      handleToggleStoreProductBrand(selectedStore, brand.id)
                                    }
                                  />
                                  {brand.name_zh || brand.name_en}
                                </label>
                              ))
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
