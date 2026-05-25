"use client";

import { RiSideBarFill, RiSideBarLine } from "@remixicon/react";
import type { Id } from "@/convex/_generated/dataModel";
import { ProjectActivityLog } from "@/components/projects/ProjectActivityLog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type ProjectRightBarToggleProps = {
  open: boolean;
  onToggle: () => void;
  className?: string;
};

type ProjectRightBarProps = {
  projectId: Id<"projects">;
  open: boolean;
  onClose: () => void;
  className?: string;
};

export function ProjectRightBarToggle({
  open,
  onToggle,
  className,
}: ProjectRightBarToggleProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className={cn("text-muted-foreground", className)}
      onClick={onToggle}
      aria-expanded={!open}
      aria-label={open ? "Hide project sidebar" : "Show project sidebar"}
    >
      {open ? <RiSideBarLine /> : <RiSideBarFill />}
    </Button>
  );
}

export function ProjectRightBar({
  projectId,
  open,
  className,
}: ProjectRightBarProps) {
  return (
    <aside
      className={cn(
        "flex h-full min-h-0 w-96 shrink-0 flex-col overflow-hidden bg-transparent transition-transform translate-x-0 duration-300",
        className,
        open && "translate-x-100 w-0",
      )}
    >
      <div className="flex h-full min-h-0 flex-1 py-5 flex-col bg-transparent">
        <ScrollArea className="min-h-0 flex-1 px-3 pb-3">
          <Card className="bg-card/80 border shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">
                Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <ProjectActivityLog
                projectId={projectId}
                hideTitle
                scrollable={false}
              />
            </CardContent>
          </Card>
        </ScrollArea>
      </div>
    </aside>
  );
}
