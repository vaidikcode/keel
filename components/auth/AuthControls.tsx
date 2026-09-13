"use client";

import { SignInButton, SignOutButton, useAuth } from "@clerk/nextjs";
import { Icon } from "@/components/ui/Icon";

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
      <LogOutButton />
    </div>
  );
}

export function LogOutButton({
  variant = "text",
}: {
  variant?: "text" | "sidebar" | "button";
}) {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded || !isSignedIn) return null;

  const className =
    variant === "sidebar"
      ? "sidebar-logout"
      : variant === "button"
        ? "button secondary logout-action"
        : "text-button logout-action";

  return (
    <SignOutButton redirectUrl="/sign-in">
      <button type="button" className={className}>
        <Icon name="logout" size={variant === "button" ? 16 : 15} />
        Log out
      </button>
    </SignOutButton>
  );
}
