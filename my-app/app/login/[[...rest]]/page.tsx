import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center p-8">
      <SignIn path="/login" signUpUrl="/signup" />
    </div>
  );
}
