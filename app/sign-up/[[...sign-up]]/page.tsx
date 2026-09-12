import { SignUp } from "@clerk/nextjs";
import { keelAppearance } from "@/lib/clerkAppearance";

export default function SignUpPage() {
  return (
    <main className="auth-page">
      {/* Not a link: once someone is signing in there is nothing to go back
          to, and clicking through to the landing page loses their place. */}
      <span className="wordmark" aria-hidden="true">
        <span className="brand-mark">k.</span>
      </span>
      <SignUp appearance={keelAppearance} />
    </main>
  );
}
