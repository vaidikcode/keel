/**
 * Theming and copy for Clerk's hosted components.
 *
 * Clerk warns that styling its `.cl-*` classes from our stylesheet depends on
 * its internal DOM and breaks silently when they ship component updates. The
 * `appearance` prop is the supported surface: the element KEYS below are the
 * documented API, and the values are our own class names, so nothing here
 * reaches into Clerk's markup.
 *
 * The dashboard instance is still named Saturnalia, which Clerk interpolates
 * into "Sign in to {{applicationName}}". Localization keeps the hosted copy
 * on Keel without waiting on that rename.
 */
export const keelLocalization = {
  signIn: {
    start: {
      title: "Sign in to Keel",
      titleCombined: "Sign in to Keel",
    },
  },
  signUp: {
    start: {
      title: "Create your Keel account",
      titleCombined: "Create your Keel account",
    },
  },
};

export const keelAppearance = {
  variables: {
    colorPrimary: "#205daa",
    colorText: "#183446",
    colorBackground: "#ffffff",
    colorInputBackground: "#ffffff",
    colorInputText: "#183446",
    borderRadius: "10px",
    fontSize: "14px",
  },
  elements: {
    rootBox: "keel-auth-root",
    card: "keel-auth-card",
    headerTitle: "keel-auth-title",
    headerSubtitle: "keel-auth-sub",
    formButtonPrimary: "keel-auth-cta",
    formFieldInput: "keel-auth-input",
    socialButtonsBlockButton: "keel-auth-social",
    // Keep the broken Google OAuth flow unavailable on sign-in and sign-up.
    socialButtonsBlockButton__google: { display: "none" },
    socialButtonsIconButton__google: { display: "none" },
    footerActionLink: "keel-auth-link",
    logoBox: "keel-auth-hidden",
  },
} as const;
