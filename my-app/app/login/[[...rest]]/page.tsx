import { SignIn } from "@clerk/nextjs";
import { AuthShell } from "@/components/auth/authShell";

export default function LoginPage() {
  return (
    <AuthShell
      headline="Welcome back."
      subtitle="Sign in and pick up right where you left off."
      footer={
        <>
          superstacks.dev/<span className="text-primary">you</span>, still
          yours
        </>
      }
    >
      <SignIn path="/login" signUpUrl="/signup" />
    </AuthShell>
  );
}
