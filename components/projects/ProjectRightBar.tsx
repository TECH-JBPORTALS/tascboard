"use client";

import { RiCloseLine, RiSideBarLine } from "@remixicon/react";
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
      aria-expanded={open}
      aria-label={open ? "Hide project sidebar" : "Show project sidebar"}
    >
      <RiSideBarLine className={cn("size-4", open && "text-foreground")} />
    </Button>
  );
}

export function ProjectRightBar({
  projectId,
  open,
  onClose,
  className,
}: ProjectRightBarProps) {
  if (!open) {
    return null;
  }

  return (
    <aside
      className={cn(
        "flex h-full min-h-0 w-96 shrink-0 flex-col overflow-hidden bg-transparent",
        className,
      )}
    >
      <div className="flex h-full min-h-0 flex-1 py-5 flex-col bg-transparent">
        <ScrollArea className="min-h-0 flex-1 px-3 pb-3">
          <Card className="bg-card/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Project activity</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-4">
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
