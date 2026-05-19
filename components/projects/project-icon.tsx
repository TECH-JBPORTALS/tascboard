'use client';

import { resolveProjectAppearance } from '@/lib/project-appearance';
import { cn } from '@/lib/utils';

type ProjectIconProps = {
  icon?: string | null;
  color?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const sizeClasses = {
  sm: 'size-5 rounded text-xs',
  md: 'size-8 rounded-md text-base',
  lg: 'size-10 rounded-lg text-lg',
};

export function ProjectIcon({
  icon,
  color,
  size = 'md',
  className,
}: ProjectIconProps) {
  const appearance = resolveProjectAppearance(icon, color);

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center font-medium leading-none',
        appearance.colorClassName,
        sizeClasses[size],
        className,
      )}
      aria-hidden
    >
      {appearance.icon}
    </span>
  );
}
