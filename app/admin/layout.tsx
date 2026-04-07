import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

const ADMIN_USER_ID = process.env.NEXT_PUBLIC_ADMIN_USER_ID;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId || userId !== ADMIN_USER_ID) {
    redirect("/");
  }
  return <>{children}</>;
}
