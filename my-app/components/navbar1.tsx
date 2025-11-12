import { Button } from "./ui/button";
import Link from "next/link";

export default function Navbar() {
  return (
    <header className="bg-amber-300">
      <div className="flex justify-between p-4">
        <div>Home</div>
        <div className="flex gap-4">
          <Link href="/login">
            <Button variant={"ghost"}>Login</Button>
          </Link>
          <Link href="/signup">
            <Button variant={"ghost"}>Signup</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
