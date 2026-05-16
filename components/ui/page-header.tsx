"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export type PageHeaderProps = {
  /** Shown inside the rounded muted icon container (e.g. an icon). */
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
};

export function PageHeader({
  icon,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex h-14 shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border/60 px-4",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        {icon != null ? (
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground [&_svg]:size-4">
            {icon}
          </div>
        ) : null}
        <div className="min-w-0">
          <h1 className="font-heading text-base font-semibold tracking-tight">
            {title}
          </h1>
          {description != null ? (
            <div className="text-xs text-muted-foreground">{description}</div>
          ) : null}
        </div>
      </div>
      {actions != null ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}
