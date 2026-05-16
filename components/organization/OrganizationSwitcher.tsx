"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { parseOrganizationMetadata } from "@/lib/organization";
import { OrganizationAvatar } from "./OrganizationAvatar";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxTrigger,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import { RiAddLine } from "@remixicon/react";

type OrganizationListItem = {
  id: string;
  name: string;
  slug: string;
  metadata?: string | Record<string, unknown> | null;
};

type OrgComboValue = { slug: string; name: string };

export function OrganizationSwitcher() {
  const router = useRouter();
  const params = useParams<{ orgSlug: string }>();
  const anchorRef = useComboboxAnchor();
  const [isSwitching, setIsSwitching] = useState(false);
  const { data: organizations, isPending } = authClient.useListOrganizations();
  const { data: session } = authClient.useSession();

  const orgList = (organizations ?? []) as OrganizationListItem[];
  const activeOrganizationId = session?.session.activeOrganizationId;
  const current =
    orgList.find((org) => org.slug === params.orgSlug) ??
    orgList.find((org) => org.id === activeOrganizationId) ??
    orgList[0];

  const comboValue = useMemo<OrgComboValue | null>(
    () => (current ? { slug: current.slug, name: current.name } : null),
    [current],
  );

  async function switchOrganization(org: OrganizationListItem) {
    if (org.slug === params.orgSlug) {
      return;
    }

    setIsSwitching(true);
    const result = await authClient.organization.setActive({
      organizationSlug: org.slug,
    });
    setIsSwitching(false);

    if (!result.error) {
      router.push(`/${org.slug}`);
      router.refresh();
    }
  }

  function handleComboValueChange(value: OrgComboValue | null) {
    if (!value) {
      return;
    }
    if (value.slug === params.orgSlug) {
      return;
    }
    const org = orgList.find((o) => o.slug === value.slug);
    if (org) {
      void switchOrganization(org);
    }
  }

  if (isPending) {
    return (
      <div className="h-9 w-full animate-pulse rounded-lg bg-sidebar-accent" />
    );
  }

  if (!current || !comboValue) {
    return (
      <Button
        variant="outline"
        className="w-full justify-start"
        render={<Link href="/create-organization" />}
      >
        <RiAddLine />
        Create organization
      </Button>
    );
  }

  const currentMetadata = parseOrganizationMetadata(current.metadata);

  return (
    <Combobox
      value={comboValue}
      onValueChange={handleComboValueChange}
      isItemEqualToValue={(a, b) => a.slug === b.slug}
      itemToStringLabel={(v) => v.name}
      itemToStringValue={(v) => v.slug}
      items={orgList}
    >
      <div ref={anchorRef} className="w-full">
        <ComboboxTrigger
          className={buttonVariants({
            variant: "outline",
            size: "lg",
            className: "w-full justify-between p-1.5",
          })}
          disabled={isSwitching}
        >
          <div className="flex  items-center gap-1.5">
            <OrganizationAvatar
              name={current.name}
              imageStorageId={currentMetadata.imageStorageId}
              className="size-6"
            />
            <span className="truncate text-left text-sm font-medium">
              {current.name}
            </span>
          </div>
        </ComboboxTrigger>
      </div>

      <ComboboxContent anchor={anchorRef}>
        <ComboboxInput placeholder="Search..." showTrigger={false} />
        <ComboboxEmpty>No organization found</ComboboxEmpty>

        <ComboboxList>
          {(org: (typeof orgList)[0]) => {
            const metadata = parseOrganizationMetadata(org.metadata);
            return (
              <ComboboxItem key={org.id} value={org}>
                <OrganizationAvatar
                  name={org.name}
                  imageStorageId={metadata.imageStorageId}
                  className="size-6"
                />
                {org.name}
              </ComboboxItem>
            );
          }}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
