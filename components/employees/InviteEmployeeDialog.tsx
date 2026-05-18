"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { authClient } from "@/lib/auth-client";
import { parseEmails, validateEmails } from "@/lib/parse-emails";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RiUserAddLine } from "@remixicon/react";

const inviteSchema = z.object({
  emails: z
    .string()
    .min(1, "Enter at least one email")
    .refine((value) => parseEmails(value).length > 0, {
      message: "Enter at least one email",
    })
    .refine((value) => validateEmails(parseEmails(value)).invalid.length === 0, {
      message: "One or more email addresses are invalid",
    }),
});

type InviteValues = z.infer<typeof inviteSchema>;

export function InviteEmployeeDialog({
  organizationId,
}: {
  organizationId: string;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultSummary, setResultSummary] = useState<string | null>(null);

  const form = useForm<InviteValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { emails: "" },
  });

  async function onSubmit(values: InviteValues) {
    setError(null);
    setResultSummary(null);

    const parsed = parseEmails(values.emails);
    const { valid, invalid } = validateEmails(parsed);

    if (invalid.length > 0) {
      setError(`Invalid email${invalid.length > 1 ? "s" : ""}: ${invalid.join(", ")}`);
      return;
    }

    const failures: string[] = [];
    let sent = 0;

    for (const email of valid) {
      try {
        const inviteResult = await authClient.organization.inviteMember({
          email,
          role: "member",
          organizationId,
        });

        if (inviteResult.error) {
          failures.push(
            `${email}: ${inviteResult.error.message ?? "Failed to send"}`,
          );
        } else {
          sent += 1;
        }
      } catch (e) {
        failures.push(
          `${email}: ${e instanceof Error ? e.message : "Failed to send"}`,
        );
      }
    }

    if (sent === 0 && failures.length > 0) {
      setError(failures.join("\n"));
      return;
    }

    if (failures.length > 0) {
      setResultSummary(
        `Sent ${sent} invitation${sent === 1 ? "" : "s"}. Failed: ${failures.join("; ")}`,
      );
    } else {
      form.reset();
      setOpen(false);
    }
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setError(null);
      setResultSummary(null);
      form.reset();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button />}>
        <RiUserAddLine />
        Invite employee
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite employees</DialogTitle>
          <DialogDescription>
            Enter one or more email addresses, separated by commas, spaces, or
            new lines.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {error ? (
            <p className="whitespace-pre-wrap text-sm text-destructive">
              {error}
            </p>
          ) : null}
          {resultSummary ? (
            <p className="text-sm text-muted-foreground">{resultSummary}</p>
          ) : null}
          <Controller
            name="emails"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field>
                <Label>Email addresses</Label>
                <Textarea
                  {...field}
                  placeholder={"jane@company.com\njohn@company.com"}
                  rows={4}
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
          <DialogFooter>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting
                ? "Sending..."
                : "Send invitations"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
