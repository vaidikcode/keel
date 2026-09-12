import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <main className="auth-page">
      <Link href="/" className="wordmark">
        <span className="brand-mark">k.</span>keel
        <span className="brand-dot">●</span>
      </Link>
      <SignUp />
    </main>
  );
}
