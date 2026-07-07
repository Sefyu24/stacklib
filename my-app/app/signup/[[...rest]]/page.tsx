import { SignUp } from "@clerk/nextjs";
import { AuthShell } from "@/components/auth/authShell";

export default function SignupPage() {
  return (
    <AuthShell
      headline="Share what you ship with."
      subtitle="Turn your tools into a card worth posting. Free, takes a minute."
      footer={
        <>
          superstacks.dev/<span className="text-primary">you</span>, claim
          yours
        </>
      }
    >
      <SignUp path="/signup" signInUrl="/login" />
    </AuthShell>
  );
}
