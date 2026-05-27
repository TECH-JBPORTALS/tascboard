/** biome-ignore-all assist/source/organizeImports: <explanation> */
"use client";

import { useState } from "react";
import { addDays, subDays } from "date-fns";
import { DailyDateNav } from "./daily-date-nav";
import { DailyTable } from "./daily-table";
import { MOCK_DAILY } from "./mock-data";

export function DailyTab() {
  const [date, setDate] = useState<Date>(new Date());

  return (
    <div className="flex flex-col gap-4 pt-4">
      <div className="flex items-center justify-between">
        <DailyDateNav
          date={date}
          onPrev={() => setDate((d) => subDays(d, 1))}
          onNext={() => setDate((d) => addDays(d, 1))}
        />
        <p className="text-xs text-muted-foreground">
          {MOCK_DAILY.length} active employees
        </p>
      </div>
      <DailyTable records={MOCK_DAILY} />
    </div>
  );
}