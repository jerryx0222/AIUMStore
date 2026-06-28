import type { Firm } from "../types";

interface Props {
  firms: Firm[];
  currentFirmId: number | null;
  onChange: (id: number) => void;
}

export function FirmSwitcher({ firms, currentFirmId, onChange }: Props) {
  if (firms.length <= 1) return null;
  return (
    <label className="firm-switcher">
      目前管理分店:
      <select value={currentFirmId ?? ""} onChange={(e) => onChange(Number(e.target.value))}>
        {firms.map((f) => (
          <option key={f.id} value={f.id}>
            {f.name}
            {f.branch_name ? `-${f.branch_name}` : ""}
          </option>
        ))}
      </select>
    </label>
  );
}
