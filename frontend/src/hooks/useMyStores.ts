import { useEffect, useState } from "react";

import { api } from "../api/client";
import type { Brand } from "../types";

/**
 * 一個店主可整合多個加盟品牌(門市)，這個 hook 負責抓取名下所有門市，
 * 並提供「目前操作中的門市 id」供其他頁面(商品上架管理/營收儀表板)共用。
 */
export function useMyStores(initialStoreId?: number | null) {
  const [stores, setStores] = useState<Brand[]>([]);
  const [currentStoreId, setCurrentStoreId] = useState<number | null>(initialStoreId ?? null);
  const [loading, setLoading] = useState(true);

  async function reload() {
    setLoading(true);
    try {
      const { data } = await api.get<Brand[]>("/products/stores/");
      setStores(data);
      setCurrentStoreId((prev) => {
        if (prev && data.some((s) => s.id === prev)) return prev;
        return data[0]?.id ?? null;
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, []);

  const currentStore = stores.find((s) => s.id === currentStoreId) ?? null;

  return { stores, loading, currentStoreId, setCurrentStoreId, currentStore, reload };
}
