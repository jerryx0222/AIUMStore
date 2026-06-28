import { useEffect, useState } from "react";

import { api } from "../api/client";
import type { Firm } from "../types";

/**
 * 同一個 owner 可擁有多間分店(Firm)，這個 hook 負責抓取名下所有分店，
 * 並提供「目前操作中的分店 id」供其他頁面(商品管理/營收儀表板)共用。
 */
export function useMyFirms(initialFirmId?: number | null) {
  const [firms, setFirms] = useState<Firm[]>([]);
  const [currentFirmId, setCurrentFirmId] = useState<number | null>(initialFirmId ?? null);
  const [loading, setLoading] = useState(true);

  async function reload() {
    setLoading(true);
    try {
      const { data } = await api.get<Firm[]>("/products/firms/");
      setFirms(data);
      setCurrentFirmId((prev) => {
        if (prev && data.some((f) => f.id === prev)) return prev;
        return data[0]?.id ?? null;
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, []);

  const currentFirm = firms.find((f) => f.id === currentFirmId) ?? null;

  return { firms, loading, currentFirmId, setCurrentFirmId, currentFirm, reload };
}
