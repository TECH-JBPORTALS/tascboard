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
];

export function ProjectMangerPicker() {
  return (
    <Popover>
      <PopoverTrigger render={<Button variant={"ghost"} size={"sm"} />}>
        <RiAccountCircle2Line /> Manager
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
