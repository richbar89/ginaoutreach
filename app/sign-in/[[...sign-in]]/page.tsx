import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--blush, #FDF6F0)" }}>
      <SignIn />
    </div>
  );
}
