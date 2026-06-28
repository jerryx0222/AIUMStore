import { useMemo, useState } from "react";

import type { Category } from "../types";

function subCategoryValue(category: Category, level: number): string {
  switch (level) {
    case 1:
      return category.sub_category_1;
    case 2:
      return category.sub_category_2;
    case 3:
      return category.sub_category_3;
    case 4:
      return category.sub_category_4;
    case 5:
      return category.sub_category_5;
    default:
      return "";
  }
}

export interface CascadeLevel {
  level: number;
  options: string[];
}

/**
 * 種類名稱可能重複(同名種類靠子種類1~5逐層區分)，這個 hook 讓使用者先選種類名稱，
 * 再依需要逐層選子種類，直到能唯一鎖定一筆種類紀錄(resolved)。
 */
export function useCategoryCascade(categories: Category[]) {
  const [name, setName] = useState("");
  const [subSelections, setSubSelections] = useState<string[]>(["", "", "", "", ""]);

  const names = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    categories.forEach((c) => {
      if (!seen.has(c.name)) {
        seen.add(c.name);
        result.push(c.name);
      }
    });
    return result;
  }, [categories]);

  const { levels, resolved } = useMemo<{ levels: CascadeLevel[]; resolved: Category | null }>(() => {
    if (!name) return { levels: [], resolved: null };
    let candidates = categories.filter((c) => c.name === name);
    const levels: CascadeLevel[] = [];

    for (let level = 1; level <= 5; level++) {
      if (candidates.length <= 1) break;
      const values = Array.from(
        new Set(candidates.map((c) => subCategoryValue(c, level)).filter((v) => v))
      );
      if (values.length === 0) continue;
      if (values.length === 1) {
        candidates = candidates.filter((c) => subCategoryValue(c, level) === values[0]);
        continue;
      }
      levels.push({ level, options: values });
      const chosen = subSelections[level - 1];
      if (!chosen) {
        return { levels, resolved: null };
      }
      candidates = candidates.filter((c) => subCategoryValue(c, level) === chosen);
    }

    return { levels, resolved: candidates.length === 1 ? candidates[0] : null };
  }, [categories, name, subSelections]);

  function selectName(newName: string) {
    setName(newName);
    setSubSelections(["", "", "", "", ""]);
  }

  function selectSubLevel(level: number, value: string) {
    setSubSelections((prev) => {
      const next = [...prev];
      next[level - 1] = value;
      for (let l = level; l < 5; l++) next[l] = "";
      return next;
    });
  }

  function reset() {
    setName("");
    setSubSelections(["", "", "", "", ""]);
  }

  return { names, name, selectName, levels, subSelections, selectSubLevel, resolved, reset };
}
