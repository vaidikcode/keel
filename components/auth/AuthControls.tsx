"use client";

import { SignInButton, UserButton, useAuth } from "@clerk/nextjs";

export function AuthControls() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) {
    return <div className="auth-controls" />;
  }
  if (!isSignedIn) {
    return (
      <div className="auth-controls">
        <SignInButton>
          <button type="button" className="text-button">
            Sign in
          </button>
        </SignInButton>
      </div>
    );
  }
  return (
    <div className="auth-controls">
      <UserButton />
    </div>
  );
}
