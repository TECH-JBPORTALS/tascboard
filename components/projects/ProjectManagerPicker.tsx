"use client";

import * as React from "react";
import { useMutation, useQuery } from "convex/react";
import { RiAccountCircle2Line } from "@remixicon/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { usePermission } from "@/hooks/use-permission";
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

type ProjectMemberListItem = {
  _id: Id<"projectMember">;
  employeeId: string;
  manager?: boolean;
  employee: {
    _id: string;
    name: string;
    image: string;
    email: string;
  };
};

type ProjectManagerPickerProps = {
  projectId: Id<"projects">;
};

function memberHasManagerFlag(
  member: ProjectMemberListItem,
): member is ProjectMemberListItem & { manager: true } {
  return member.manager === true;
}

export function ProjectMangerPicker({ projectId }: ProjectManagerPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [optimisticManagerId, setOptimisticManagerId] = React.useState<
    string | null
  >(null);

  const projectMembers = useQuery(api.projectMember.list, { projectId });
  const setManager = useMutation(api.projectMember.setManager);
  const removeManager = useMutation(api.projectMember.removeManager);

  const { allowed: canListEmployees } = usePermission({
    employee: ["list"],
  });
  const organizationMembers = useQuery(
    api.employees.auth.list,
    canListEmployees ? {} : "skip",
  );

  const members = React.useMemo(
    () => (projectMembers ?? []) as ProjectMemberListItem[],
    [projectMembers],
  );

  const managerFromList = React.useMemo(
    () => members.find(memberHasManagerFlag)?.employeeId ?? null,
    [members],
  );

  const managerEmployeeId = managerFromList ?? optimisticManagerId;

  const projectMemberIds = React.useMemo(
    () => new Set(members.map((member) => member.employeeId)),
    [members],
  );

  const orgMembersNotOnProject = React.useMemo(() => {
    if (!organizationMembers) return [];
    return organizationMembers.filter(
      (employee) => !projectMemberIds.has(employee.userId),
    );
  }, [organizationMembers, projectMemberIds]);

  const currentManager = React.useMemo(() => {
    if (!managerEmployeeId) return null;
    const fromProject = members.find(
      (member) => member.employeeId === managerEmployeeId,
    );
    if (fromProject) return fromProject.employee;

    const fromOrg = organizationMembers?.find(
      (employee) => employee.userId === managerEmployeeId,
    );
    if (!fromOrg) return null;

    return {
      name: fromOrg.name,
      image: fromOrg.image ?? "",
      email: fromOrg.email,
    };
  }, [managerEmployeeId, members, organizationMembers]);

  const clearManagers = React.useCallback(async () => {
    await Promise.all(
      members.map((member) =>
        removeManager({ projectId, employeeId: member.employeeId }),
      ),
    );
  }, [members, projectId, removeManager]);

  const handleSelectManager = React.useCallback(
    async (employeeId: string) => {
      try {
        await clearManagers();
        await setManager({ projectId, employeeId });
        setOptimisticManagerId(employeeId);
        setOpen(false);
      } catch {
        // Convex surfaces mutation errors to the client; keep picker open.
      }
    },
    [clearManagers, projectId, setManager],
  );

  const handleClearManager = React.useCallback(async () => {
    if (members.length === 0) {
      setOptimisticManagerId(null);
      setOpen(false);
      return;
    }

    try {
      await clearManagers();
      setOptimisticManagerId(null);
      setOpen(false);
    } catch {
      // Keep picker open on failure.
    }
  }, [clearManagers, members.length]);

  const isLoading = projectMembers === undefined;

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
            disabled={isLoading}
          />
        }
      >
        {currentManager ? (
          <UserAvatar
            className="size-4"
            name={currentManager.name}
            imageUrl={currentManager.image}
          />
        ) : (
          <RiAccountCircle2Line className="size-3.5 opacity-70" />
        )}
        <span>{currentManager?.name ?? "Manager"}</span>
      </PopoverTrigger>
      <PopoverContent align="start" className="p-0">
        <Command>
          <CommandList>
            <CommandInput placeholder="Set manager…" />
            <CommandEmpty>No members found</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="no manager"
                onSelect={() => {
                  void handleClearManager();
                }}
              >
                <RiAccountCircle2Line className="size-3.5 opacity-70" />
                No manager
              </CommandItem>
            </CommandGroup>
            {members.length > 0 ? (
              <CommandGroup heading="Project members">
                {members.map((member) => (
                  <CommandItem
                    key={member._id}
                    value={`${member.employee.name} ${member.employee.email}`}
                    onSelect={() => {
                      void handleSelectManager(member.employeeId);
                    }}
                  >
                    <UserAvatar
                      className="size-5"
                      name={member.employee.name}
                      imageUrl={member.employee.image}
                    />
                    {member.employee.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}
            {canListEmployees && orgMembersNotOnProject.length > 0 ? (
              <CommandGroup heading="Organization members">
                {orgMembersNotOnProject.map((employee) => (
                  <CommandItem
                    key={employee.id}
                    value={`${employee.name} ${employee.email}`}
                    onSelect={() => {
                      void handleSelectManager(employee.userId);
                    }}
                  >
                    <UserAvatar
                      className="size-5"
                      name={employee.name}
                      imageUrl={employee.image}
                    />
                    {employee.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
