import { SignIn } from "@clerk/nextjs";
import { AuthShell } from "@/components/auth/authShell";

export default function LoginPage() {
  return (
    <AuthShell
      headline="Welcome back."
      subtitle="Your stacks missed you — sign in and pick up where you left off."
      footer={
        <>
          superstack.app/<span className="text-primary">you</span> — still
          yours
        </>
      }
    >
      <SignIn path="/login" signUpUrl="/signup" />
    </AuthShell>
  );
}
