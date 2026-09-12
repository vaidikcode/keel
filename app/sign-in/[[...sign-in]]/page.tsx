import { SignIn } from "@clerk/nextjs";
import { keelAppearance } from "@/lib/clerkAppearance";

export default function SignInPage() {
  return (
    <main className="auth-page">
      {/* Not a link: once someone is signing in there is nothing to go back
          to, and clicking through to the landing page loses their place. */}
      <span className="wordmark" aria-hidden="true">
        <span className="brand-mark">k.</span>
      </span>
      <SignIn appearance={keelAppearance} />
    </main>
  );
}
