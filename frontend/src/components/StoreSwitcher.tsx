import type { Brand } from "../types";

interface Props {
  stores: Brand[];
  currentStoreId: number | null;
  onChange: (id: number) => void;
}

export function StoreSwitcher({ stores, currentStoreId, onChange }: Props) {
  if (stores.length <= 1) return null;
  return (
    <label className="firm-switcher">
      目前管理門市:
      <select value={currentStoreId ?? ""} onChange={(e) => onChange(Number(e.target.value))}>
        {stores.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name_zh || s.name_en}
          </option>
        ))}
      </select>
    </label>
  );
}
