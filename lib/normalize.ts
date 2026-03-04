import type { OptionItem, RawMetadataItem } from "./types";

type Normalizable = string | RawMetadataItem;

export function normalizeOptions(values: Normalizable[] = []): OptionItem[] {
  return values
    .map((value) => {
      if (typeof value === "string") {
        return { id: value, label: value };
      }
      if (
        value &&
        typeof value === "object" &&
        "id" in value &&
        "name" in value
      ) {
        const item: OptionItem = { id: String(value.id), label: String(value.name) };
        if ("slug" in value && value.slug) {
          item.slug = String(value.slug);
        }
        return item;
      }
      return null;
    })
    .filter((item): item is OptionItem => item !== null);
}
