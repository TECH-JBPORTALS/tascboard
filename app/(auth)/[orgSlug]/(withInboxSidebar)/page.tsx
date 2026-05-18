import { RiInbox2Fill } from "@remixicon/react";

export default function Page() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
      <RiInbox2Fill className="size-14 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        Select a notification from left side to view it here.
      </p>
    </div>
  );
}
