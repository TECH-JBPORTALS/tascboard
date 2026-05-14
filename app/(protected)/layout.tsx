import { getToken } from "@/lib/auth-server";
import { redirect } from "next/navigation";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = await getToken();

  if (!token) redirect("/sign-in");
  return <>{children}</>;
}
