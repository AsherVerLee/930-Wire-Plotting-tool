import type { PartDefinition } from "@/types/diagram";

const STORAGE_KEY = "customParts930";

export function loadCustomParts(): PartDefinition[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return [];
  }
}

export function saveCustomParts(parts: PartDefinition[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(parts));
}

export function addCustomPart(part: PartDefinition): PartDefinition[] {
  const parts = loadCustomParts();
  const existing = parts.filter((p) => p.key !== part.key);
  const next = [...existing, part];
  saveCustomParts(next);
  return next;
}

export function removeCustomPart(key: string): PartDefinition[] {
  const parts = loadCustomParts();
  const next = parts.filter((p) => p.key !== key);
  saveCustomParts(next);
  return next;
}
