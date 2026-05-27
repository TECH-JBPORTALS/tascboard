"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/ui/page-header";
import { RiCalendarCheckLine } from "@remixicon/react";
import { DailyTab } from "@/components/attendance/daily-tab";
import { MonthlyTab } from "@/components/attendance/monthly-tab";

export default function AttendancePage() {
  return (
    <div className="flex flex-col">
      <PageHeader
        icon={<RiCalendarCheckLine />}
        title="Attendance"
        description="Track and manage employee attendance"
      />
      <div className="p-4">
        <Tabs defaultValue="daily">
          <TabsList variant="line">
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>
          <TabsContent value="daily">
            <DailyTab />
          </TabsContent>
          <TabsContent value="monthly">
            <MonthlyTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}