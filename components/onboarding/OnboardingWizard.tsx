"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  RiArrowLeftLine,
  RiArrowRightLine,
  RiEyeLine,
  RiEyeOffLine,
  RiUpload2Line,
} from "@remixicon/react";
import {
  InputGroup,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { motion } from "motion/react";

const STEPS = [
  { id: 0, title: "General information", description: "Personal details" },
  { id: 1, title: "Government ID", description: "Aadhar & PAN" },
  { id: 2, title: "Bank details", description: "Salary account" },
  { id: 3, title: "Certificates", description: "Up to 5 documents" },
] as const;

const generalSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  address: z.string().min(5, "Address is required"),
});

const govSchema = z.object({
  aadharNumber: z.string().regex(/^\d{12}$/, "Aadhar must be 12 digits"),
  panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/i, "Enter a valid PAN"),
});

const bankSchema = z
  .object({
    bankAccountNumber: z.string().min(8, "Account number is required"),
    confirmAccountNumber: z.string().min(8, "Confirm account number"),
    bankName: z.string().min(2, "Bank name is required"),
    ifscCode: z
      .string()
      .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/i, "Enter a valid IFSC code"),
    branchName: z.string().min(2, "Branch name is required"),
  })
  .refine((d) => d.bankAccountNumber === d.confirmAccountNumber, {
    message: "Account numbers do not match",
    path: ["confirmAccountNumber"],
  });

export function OnboardingWizard() {
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [certificates, setCertificates] = useState<
    Array<{ id: string; fileName: string }>
  >([]);

  const saveGeneral = useMutation(api.employees.saveGeneralInfo);
  const saveGov = useMutation(api.employees.saveGovernmentId);
  const saveBank = useMutation(api.employees.saveBankDetails);
  const addCertificate = useMutation(api.employees.addCertificate);
  const removeCertificate = useMutation(api.employees.removeCertificate);
  const completeOnboarding = useMutation(api.employees.completeOnboarding);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  const generalForm = useForm({
    resolver: zodResolver(generalSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      address: "",
    },
  });

  const govForm = useForm({
    resolver: zodResolver(govSchema),
    defaultValues: { aadharNumber: "", panNumber: "" },
  });

  const bankForm = useForm({
    resolver: zodResolver(bankSchema),
    defaultValues: {
      bankAccountNumber: "",
      confirmAccountNumber: "",
      bankName: "",
      ifscCode: "",
      branchName: "",
    },
  });

  const [showAccount, setShowAccount] = useState(false);
  const progress = ((step + 1) / STEPS.length) * 100;

  async function uploadFile(file: File): Promise<Id<"_storage">> {
    const uploadUrl = await generateUploadUrl({});
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!response.ok) throw new Error("Upload failed");
    const { storageId } = (await response.json()) as {
      storageId: Id<"_storage">;
    };
    return storageId;
  }

  async function onGeneralSubmit(values: z.infer<typeof generalSchema>) {
    setError(null);
    try {
      await saveGeneral(values);
      setStep(1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    }
  }

  async function onGovSubmit(values: z.infer<typeof govSchema>) {
    setError(null);
    try {
      await saveGov({
        aadharNumber: values.aadharNumber,
        panNumber: values.panNumber.toUpperCase(),
      });
      setStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    }
  }

  async function onBankSubmit(values: z.infer<typeof bankSchema>) {
    setError(null);
    try {
      await saveBank({
        bankAccountNumber: values.bankAccountNumber,
        bankName: values.bankName,
        ifscCode: values.ifscCode.toUpperCase(),
        branchName: values.branchName,
      });
      setStep(3);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    }
  }

  async function onCertificateUpload(file: File) {
    setError(null);
    const allowed = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
    if (!allowed.includes(file.type)) {
      setError("Only PDF, JPG, JPEG, and PNG files are allowed.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Max file size is 10MB.");
      return;
    }
    if (certificates.length >= 5) {
      setError("You can upload at most 5 documents.");
      return;
    }

    try {
      const storageId = await uploadFile(file);
      const id = await addCertificate({
        storageId,
        fileName: file.name,
        contentType: file.type,
      });
      setCertificates((prev) => [...prev, { id, fileName: file.name }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    }
  }

  async function handleComplete() {
    setError(null);
    try {
      await completeOnboarding({});
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to complete onboarding",
      );
    }
  }

  return (
    <motion.div className="mx-auto flex min-h-svh w-full max-w-3xl flex-col justify-center p-4 py-10 md:p-8">
      <div className="mb-6 space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Step {step + 1} of {STEPS.length}
          </span>
          <span>{STEPS[step].title}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{STEPS[step].title}</CardTitle>
          <CardDescription>{STEPS[step].description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          {step === 0 ? (
            <form
              id="general-form"
              className="space-y-4"
              onSubmit={generalForm.handleSubmit(onGeneralSubmit)}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Controller
                  name="firstName"
                  control={generalForm.control}
                  render={({ field, fieldState }) => (
                    <Field>
                      <Label>First name</Label>
                      <Input {...field} />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
                <Controller
                  name="lastName"
                  control={generalForm.control}
                  render={({ field, fieldState }) => (
                    <Field>
                      <Label>Last name</Label>
                      <Input {...field} />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
              </div>
              <Controller
                name="dateOfBirth"
                control={generalForm.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <Label>Date of birth</Label>
                    <Input {...field} type="date" />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
              <Controller
                name="address"
                control={generalForm.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <Label>Address</Label>
                    <Textarea {...field} rows={3} />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            </form>
          ) : null}

          {step === 1 ? (
            <form
              id="gov-form"
              className="space-y-4"
              onSubmit={govForm.handleSubmit(onGovSubmit)}
            >
              <Controller
                name="aadharNumber"
                control={govForm.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <Label>Aadhar card number</Label>
                    <Input {...field} inputMode="numeric" maxLength={12} />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
              <Controller
                name="panNumber"
                control={govForm.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <Label>PAN card number</Label>
                    <Input {...field} className="uppercase" maxLength={10} />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            </form>
          ) : null}

          {step === 2 ? (
            <form
              id="bank-form"
              className="space-y-4"
              onSubmit={bankForm.handleSubmit(onBankSubmit)}
            >
              <Controller
                name="bankAccountNumber"
                control={bankForm.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <Label>Account number</Label>
                    <InputGroup>
                      <InputGroupInput
                        {...field}
                        type={showAccount ? "text" : "password"}
                        autoComplete="off"
                      />
                      <InputGroupButton
                        type="button"
                        onClick={() => setShowAccount((s) => !s)}
                      >
                        {showAccount ? <RiEyeOffLine /> : <RiEyeLine />}
                      </InputGroupButton>
                    </InputGroup>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
              <Controller
                name="confirmAccountNumber"
                control={bankForm.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <Label>Confirm account number</Label>
                    <Input {...field} type="password" autoComplete="off" />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
              <Controller
                name="bankName"
                control={bankForm.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <Label>Bank name</Label>
                    <Input {...field} />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Controller
                  name="ifscCode"
                  control={bankForm.control}
                  render={({ field, fieldState }) => (
                    <Field>
                      <Label>IFSC code</Label>
                      <Input {...field} className="uppercase" />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
                <Controller
                  name="branchName"
                  control={bankForm.control}
                  render={({ field, fieldState }) => (
                    <Field>
                      <Label>Branch name</Label>
                      <Input {...field} />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
              </div>
            </form>
          ) : null}

          {step === 3 ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-dashed p-8 text-center">
                <RiUpload2Line className="mx-auto mb-2 size-8 text-muted-foreground" />
                <p className="font-medium">Upload certificates</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Resume, course completion, etc. PDF, JPG, JPEG, PNG — max 10MB
                  each.
                </p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {[".PDF", ".JPG", ".JPEG", ".PNG"].map((ext) => (
                    <Badge key={ext} variant="secondary">
                      {ext}
                    </Badge>
                  ))}
                </div>
                <div className="mt-4">
                  <Label className="cursor-pointer">
                    <Input
                      type="file"
                      className="sr-only"
                      accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void onCertificateUpload(file);
                        e.target.value = "";
                      }}
                    />
                    <span className="inline-flex h-8 items-center justify-center rounded-lg border bg-background px-3 text-sm font-medium">
                      Choose file
                    </span>
                  </Label>
                </div>
              </div>
              {certificates.length > 0 ? (
                <ul className="space-y-2">
                  {certificates.map((cert) => (
                    <li
                      key={cert.id}
                      className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                    >
                      <span className="truncate">{cert.fileName}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() =>
                          void removeCertificate({
                            certificateId:
                              cert.id as Id<"employeeCertificates">,
                          }).then(() =>
                            setCertificates((prev) =>
                              prev.filter((c) => c.id !== cert.id),
                            ),
                          )
                        }
                      >
                        Remove
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Certificates are optional but recommended.
                </p>
              )}
            </div>
          ) : null}
        </CardContent>
        <CardFooter className="flex justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            <RiArrowLeftLine />
            Back
          </Button>

          {step < 3 ? (
            <Button
              type="submit"
              form={
                step === 0
                  ? "general-form"
                  : step === 1
                    ? "gov-form"
                    : "bank-form"
              }
            >
              Save & continue
              <RiArrowRightLine />
            </Button>
          ) : (
            <Button type="button" onClick={() => void handleComplete()}>
              Complete onboarding
              <RiArrowRightLine />
            </Button>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
}
