import { SignUp } from "@clerk/nextjs";

export default function SignupPage() {
  return (
    <div className="flex min-h-[calc(100svh-60px)] items-center justify-center bg-background p-8 text-foreground">
      <SignUp path="/signup" signInUrl="/login" />
    </div>
  );
}
