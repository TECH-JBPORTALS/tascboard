"use client";

import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { RiAccountCircle2Line } from "@remixicon/react";
import {
  Command,
  CommandGroup,
  CommandList,
  CommandItem,
  CommandInput,
} from "../ui/command";
import { UserAvatar } from "../employees/UserAvatar";

const organizationMembers = [
  {
    id: "1",
    employeeId: 1,
    name: "John Doe",
    image: "https://github.com/shadcn.png",
    email: "john.doe@example.com",
    manager: true,
  },
  {
    id: "2",
    name: "Jane Doe",
    image: "https://github.com/shadcn.png",
    email: "jane.doe@example.com",
    manager: false,
  },
];

const projectMembers = [
  {
    id: "3",
    employeeId: 1,
    name: "Jhon Doe",
    image: "https://github.com/shadcn.png",
    email: "jhon.doe@example.com",
    manager: true,
  },
  {
    id: "4",
    employeeId: 1,
    name: "Manu",
    image: "https://github.com/x-sss-x.png",
    email: "jhon.doe@example.com",
    manager: true,
  },
  {
    id: "5",
    employeeId: 1,
    name: "Theo",
    image: "https://github.com/t3dotgg.png",
    email: "jhon.doe@example.com",
    manager: true,
  },
];

export function ProjectMembersPicker() {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant={"ghost"}
            size={"sm"}
            className={"px-1 -space-x-2.5"}
          />
        }
      >
        {projectMembers.map((member) => (
          <UserAvatar
            className="size-4"
            key={member.id}
            name={member.name}
            imageUrl={member.image}
          />
        ))}
      </PopoverTrigger>
      <PopoverContent align="start" className={"p-0 "}>
        <Command>
          <CommandList>
            <CommandInput placeholder="Set manager..." />
            <CommandGroup>
              <CommandItem>
                <RiAccountCircle2Line />
                No manager
              </CommandItem>
            </CommandGroup>
            <CommandGroup>
              {projectMembers.map((member) => (
                <CommandItem key={member.id}>
                  <UserAvatar
                    className="size-5"
                    name={member.name}
                    imageUrl={member.image}
                  />
                  {member.name}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading={"Organization Members"}>
              {organizationMembers.map((member) => (
                <CommandItem key={member.id}>
                  <UserAvatar
                    className="size-5"
                    name={member.name}
                    imageUrl={member.image}
                  />
                  {member.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
