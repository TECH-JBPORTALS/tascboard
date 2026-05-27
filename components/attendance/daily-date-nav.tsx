/** biome-ignore-all assist/source/organizeImports: <explanation> */
"use client";

import { Button } from "@/components/ui/button";
import { RiArrowLeftSLine, RiArrowRightSLine, RiCalendarLine } from "@remixicon/react";
import { format } from "date-fns";

interface DailyDateNavProps {
  date: Date;
  onPrev: () => void;
  onNext: () => void;
}

export function DailyDateNav({ date, onPrev, onNext }: DailyDateNavProps) {
  const isToday =
    format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

  return (
    <div className="flex items-center gap-1">
      <Button variant="outline" size="icon" onClick={onPrev}>
        <RiArrowLeftSLine />
      </Button>
      <Button variant="outline" size="sm" className="gap-1.5 px-3">
        <RiCalendarLine />
        {format(date, "MMM d, yyyy")}
        {isToday && (
          <span className="text-muted-foreground text-xs">(Today)</span>
        )}
      </Button>
      <Button variant="outline" size="icon" onClick={onNext}>
        <RiArrowRightSLine />
      </Button>
    </div>
  );
}