import { SignUp } from "@clerk/nextjs";

export default function SignupPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center p-8">
      <SignUp path="/signup" signInUrl="/login" />
    </div>
  );
}
