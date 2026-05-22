"use client";

import * as React from "react";
import { RiAccountCircle2Line } from "@remixicon/react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { UserAvatar } from "../employees/UserAvatar";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";

type ProjectManager = NonNullable<
  typeof api.project.get._returnType
>["manager"];
interface ProjectManagerPickerProps {
  projectId: Id<"projects">;
  manager: ProjectManager;
}

export function ProjectMangerPicker({
  projectId,
  manager,
}: ProjectManagerPickerProps) {
  const [open, setOpen] = React.useState(false);
  const membersGroup = useQuery(api.scope.listAssignableMembers, {
    scope: "project",
    projectId,
  });

  const currentManager = membersGroup
    ?.flatMap((group) => group.members)
    .find((member) => member.employeeId === manager?.employeeId);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 gap-1.5 px-2 font-normal text-muted-foreground hover:text-foreground",
            )}
          />
        }
      >
        {currentManager ? (
          <UserAvatar
            className="size-4"
            name={currentManager.employee.name}
            imageUrl={currentManager.employee.image}
          />
        ) : (
          <RiAccountCircle2Line className="size-3.5 opacity-70" />
        )}
        <span>{currentManager?.employee.name ?? "Manager"}</span>
      </PopoverTrigger>
      <PopoverContent align="start" className="p-0">
        <Command>
          <CommandList>
            <CommandInput placeholder="Set manager…" />
            <CommandEmpty>No members found</CommandEmpty>
            {currentManager && (
              <CommandGroup>
                <CommandItem value="no manager">
                  <RiAccountCircle2Line className="size-3.5 opacity-70" />
                  No manager
                </CommandItem>
              </CommandGroup>
            )}

            {membersGroup?.map((group) =>
              group.members.length > 0 ? (
                <CommandGroup
                  key={group.group}
                  heading={
                    group.group.charAt(0).toUpperCase() + group.group.slice(1)
                  }
                >
                  {group.members.map((member) => (
                    <CommandItem key={member._id}>
                      {member.employee.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : null,
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
