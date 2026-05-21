"use client";

import { cn } from "@/lib/utils";
import { RiUser3Fill } from "@remixicon/react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

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
    <Avatar className={cn(className)}>
      <AvatarImage src={imageUrl ?? ""} alt={name} />
      <AvatarFallback>
        {initials || <RiUser3Fill className="size-4" />}
      </AvatarFallback>
    </Avatar>
  );
}
