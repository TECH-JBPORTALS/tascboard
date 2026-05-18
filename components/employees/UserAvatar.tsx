"use client";

import { cn } from "@/lib/utils";
import { RiUser3Fill } from "@remixicon/react";

export function UserAvatar({
  name,
  imageUrl,
  className,
}: {
  name: string;
  imageUrl?: string | null;
  className?: string;
}) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={cn(
        "flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted text-xs font-medium text-muted-foreground",
        className,
      )}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt={name} className="size-full object-cover" />
      ) : (
        <span className="flex size-full items-center justify-center bg-primary/10 text-primary">
          {initials || <RiUser3Fill className="size-4" />}
        </span>
      )}
    </div>
  );
}
