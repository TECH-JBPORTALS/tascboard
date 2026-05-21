const DEFAULT_VALUE = [{ type: "p", children: [{ text: "" }] }];

export function resolvePlateValue(content: unknown) {
  if (Array.isArray(content) && content.length > 0) {
    return content;
  }
  if (typeof content === "string" && content.trim().length > 0) {
    return [{ type: "p", children: [{ text: content }] }];
  }
  return DEFAULT_VALUE;
}

export function isPlateContentEmpty(content: unknown): boolean {
  if (content === null || content === undefined) return true;
  if (typeof content === "string") return content.trim().length === 0;
  if (!Array.isArray(content) || content.length === 0) return true;

  return content.every((node) => {
    if (typeof node !== "object" || node === null || !("children" in node)) {
      return true;
    }
    const children = (node as { children: unknown[] }).children;
    if (!Array.isArray(children)) return true;
    return children.every((child) => {
      if (typeof child !== "object" || child === null) return true;
      const text = (child as { text?: string }).text;
      return !text || text.trim() === "";
    });
  });
}

export const PLATE_DEFAULT_VALUE = DEFAULT_VALUE;
