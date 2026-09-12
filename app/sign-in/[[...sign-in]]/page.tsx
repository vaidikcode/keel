import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { keelAppearance } from "@/lib/clerkAppearance";

export default function SignInPage() {
  return (
    <main className="auth-page">
      <Link href="/" className="wordmark">
        <span className="brand-mark">k.</span>
      </Link>
      <SignIn appearance={keelAppearance} />
    </main>
  );
}
