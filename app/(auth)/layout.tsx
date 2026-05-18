import { isAuthenticated } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { OnboardingGuard } from "@/components/auth/OnboardingGuard";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isAuthenticated())) redirect("/sign-in");
  return <OnboardingGuard>{children}</OnboardingGuard>;
}
