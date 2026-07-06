import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100svh-60px)] items-center justify-center bg-background p-8 text-foreground">
      <SignIn path="/login" signUpUrl="/signup" />
    </div>
  );
}
