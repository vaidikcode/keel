import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { keelAppearance } from "@/lib/clerkAppearance";

export default function SignUpPage() {
  return (
    <main className="auth-page">
      <Link href="/" className="wordmark">
        <span className="brand-mark">k.</span>
      </Link>
      <SignUp appearance={keelAppearance} />
    </main>
  );
}
