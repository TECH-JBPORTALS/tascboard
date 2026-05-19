export const PROJECT_COLORS = [
  { id: "gray", label: "Gray", className: "bg-zinc-500/25 text-zinc-300" },
  { id: "purple", label: "Purple", className: "bg-violet-500/25 text-violet-300" },
  { id: "blue", label: "Blue", className: "bg-sky-500/25 text-sky-300" },
  { id: "teal", label: "Teal", className: "bg-teal-500/25 text-teal-300" },
  { id: "green", label: "Green", className: "bg-emerald-500/25 text-emerald-300" },
  { id: "yellow", label: "Yellow", className: "bg-amber-500/25 text-amber-300" },
  { id: "orange", label: "Orange", className: "bg-orange-500/25 text-orange-300" },
  { id: "red", label: "Red", className: "bg-rose-500/25 text-rose-300" },
] as const;

export type ProjectColorId = (typeof PROJECT_COLORS)[number]["id"];

export const PROJECT_ICONS = [
  "📁",
  "🚀",
  "⚡",
  "🎯",
  "🔥",
  "💎",
  "🛠️",
  "📊",
  "🎨",
  "🌐",
  "📱",
  "🧪",
  "📦",
  "💡",
  "🏗️",
  "🤖",
] as const;

export type ProjectIcon = (typeof PROJECT_ICONS)[number];

export const DEFAULT_PROJECT_COLOR: ProjectColorId = "purple";
export const DEFAULT_PROJECT_ICON: ProjectIcon = "📁";

export function isProjectColorId(value: string): value is ProjectColorId {
  return PROJECT_COLORS.some((color) => color.id === value);
}

export function getProjectColor(colorId?: string | null) {
  return (
    PROJECT_COLORS.find((color) => color.id === colorId) ??
    PROJECT_COLORS.find((color) => color.id === DEFAULT_PROJECT_COLOR)!
  );
}

export function resolveProjectAppearance(
  icon?: string | null,
  color?: string | null,
) {
  const resolvedColor = getProjectColor(color);
  const resolvedIcon =
    icon && PROJECT_ICONS.includes(icon as ProjectIcon)
      ? icon
      : DEFAULT_PROJECT_ICON;

  return {
    icon: resolvedIcon,
    colorId: resolvedColor.id,
    colorClassName: resolvedColor.className,
  };
}
