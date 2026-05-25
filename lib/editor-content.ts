type RichNode = {
  text?: unknown;
  children?: unknown;
  content?: unknown;
};

function collectText(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(collectText).join("\n");
  if (!value || typeof value !== "object") return "";

  const node = value as RichNode;
  const ownText = typeof node.text === "string" ? node.text : "";
  const fromChildren = collectText(node.children);
  const fromContent = collectText(node.content);
  return [ownText, fromChildren, fromContent].filter(Boolean).join("\n");
}

export function resolveEditorString(content: unknown): string {
  if (typeof content === "string") return content;
  return collectText(content).trim();
}

export function isEditorContentEmpty(content: unknown): boolean {
  if (content === null || content === undefined) return true;
  if (typeof content === "string") return content.trim().length === 0;
  return resolveEditorString(content).length === 0;
}

export const EDITOR_DEFAULT_VALUE = "";
