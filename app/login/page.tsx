"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./login.module.css";
import homeStyles from "@/app/page.module.css";
import { formatNumber } from "@/app/data/data";
import { useCart } from "@/app/context/CartContext";
import { useAuthActions } from "@convex-dev/auth/react";


// Local SVG Icons
const CartIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2.2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2 2h2.5l2.6 12.4a2 2 0 002 1.6h9.8a2 2 0 002-1.6l1.7-8.4H5.5"
    />
    <circle cx="9" cy="20" r="1.5" fill="currentColor" />
    <circle cx="18" cy="20" r="1.5" fill="currentColor" />
  </svg>
);

const SunIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="4" fill="currentColor" />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41m12.72-12.72l-1.41-1.41"
    />
  </svg>
);

const MoonIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
    />
  </svg>
);

const GoogleIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

const CheckIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="36"
    height="36"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="3"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const SpinnerIcon = () => (
  <svg
    className="animate-spin"
    width="20"
    height="20"
    fill="none"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    style={{ animation: "spin 1s linear infinite" }}
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="var(--color-border)"
      strokeWidth="4"
      style={{ opacity: 0.25 }}
    />
    <path
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
    <style>{`
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `}</style>
  </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const { totalItemsCount, cartBounce } = useCart();
  const { signIn } = useAuthActions();
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Tab State
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState<"credentials" | "verify">("credentials");

  // Form Inputs
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");

  // UI Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const anyLoading = isSubmitting || isResending || isGoogleLoading;
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  // Sync theme
  useEffect(() => {
    const activeTheme =
      (document.documentElement.getAttribute("data-theme") as
        | "light"
        | "dark") || "light";
    setTheme(activeTheme);
  }, []);

  // Reset loading states when returning from browser back/forward cache (bfcache)
  useEffect(() => {
    const handlePageShow = () => {
      setIsSubmitting(false);
      setIsResending(false);
      setIsGoogleLoading(false);
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => {
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  const handleTabChange = (loginState: boolean) => {
    setIsLogin(loginState);
    setStep("credentials");
    setCode("");
    setError("");
    setSuccess(false);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess(false);

    try {
      if (isLogin) {
        if (email && password) {
          await signIn("password", { email, password, flow: "signIn" });
          setSuccessMessage("Welcome back! You have logged in successfully.");
          setSuccess(true);
          setTimeout(() => {
            router.push("/");
          }, 2000);
        }
      } else {
        if (step === "credentials") {
          if (password !== confirmPassword) {
            setError("Passwords do not match.");
            setIsSubmitting(false);
            return;
          }
          if (name && email && password) {
            await signIn("password", { name, email, password, flow: "signUp" });
            setSuccessMessage("Verification code has been sent to your email!");
            setSuccess(true);
            setStep("verify");
            // Clear success message popup after 3 seconds so they can see the verify screen
            setTimeout(() => setSuccess(false), 3000);
          }
        } else {
          if (email && code) {
            await signIn("password", { email, code, flow: "email-verification" });
            setSuccessMessage("Congratulations! Your email has been verified and you are now logged in.");
            setSuccess(true);
            setTimeout(() => {
              router.push("/");
            }, 2000);
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An authentication error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    setError("");
    setSuccess(false);
    try {
      await signIn("password", { name, email, password, flow: "signUp" });
      setSuccessMessage("A new verification code has been sent!");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to resend code.");
    } finally {
      setIsResending(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError("");
    try {
      await signIn("google");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Google Authentication failed.");
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Fixed Header Navbar */}
      <header className={homeStyles.navbar}>
        <Link href="/" className={homeStyles.logo}>
          <span>beembai</span>
          <span className={homeStyles.logoDot} />
        </Link>

        <nav className={homeStyles.navLinks}>
          <Link href="/#featured" className={homeStyles.navLink}>
            Featured
          </Link>
          <Link href="/#shop" className={homeStyles.navLink}>
            New Arrivals
          </Link>
          <Link href="/stores" className={homeStyles.navLink}>
            Stores
          </Link>
          <Link href="/sell" className={homeStyles.navLink}>
            Sell
          </Link>
        </nav>

        <div className={homeStyles.navActions}>
          <button
            onClick={toggleTheme}
            className={homeStyles.themeToggleBtn}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            {theme === "light" ? <MoonIcon /> : <SunIcon />}
          </button>

          <Link
            href="/cart"
            className={`${homeStyles.cartIconBtn} ${cartBounce ? homeStyles.cartBounce : ""}`}
            aria-label="Shopping Cart"
          >
            <CartIcon />
            {totalItemsCount > 0 && (
              <span
                className={`${homeStyles.cartBadge} ${cartBounce ? homeStyles.badgePop : ""}`}
              >
                {formatNumber(totalItemsCount)}
              </span>
            )}
          </Link>
        </div>
      </header>

      {/* Auth Card Centered Container */}
      <main className={styles.authWrapper}>
        <div className={styles.authCard}>
          {/* Card Title Header */}
          <div className={styles.cardHeader}>
            <h1 className={styles.cardTitle}>
              {isLogin ? "Welcome back" : "Create account"}
            </h1>
            <p className={styles.cardSubtitle}>
              {isLogin
                ? "Sign in to access your saved cart and orders"
                : "Register your account to start shopping"}
            </p>
          </div>

          {/* Form Tabs Switcher */}
          <div className={styles.tabHeader}>
            <button
              type="button"
              className={`${styles.tabBtn} ${isLogin ? styles.activeTabBtn : ""}`}
              onClick={() => handleTabChange(true)}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${!isLogin ? styles.activeTabBtn : ""}`}
              onClick={() => handleTabChange(false)}
            >
              Register
            </button>
          </div>

          {/* Google Sign-in action */}
          <div className={styles.socialSection}>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className={styles.googleBtn}
              disabled={anyLoading}
            >
              {isGoogleLoading ? <SpinnerIcon /> : <GoogleIcon />}
              <span>
                {isLogin ? "Sign in with Google" : "Sign up with Google"}
              </span>
            </button>

            {/* Visual Text Divider */}
            <div className={styles.divider}>Or continue with</div>
          </div>

          {/* Credentials Sign-in Form */}
          <form onSubmit={handleFormSubmit} className={styles.authForm}>
            {isLogin ? (
              <>
                {/* Email Input */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={styles.inputField}
                    disabled={anyLoading}
                  />
                </div>

                {/* Password Input */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={styles.inputField}
                    disabled={anyLoading}
                  />
                </div>
              </>
            ) : step === "credentials" ? (
              <>
                {/* Name Input */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={styles.inputField}
                    disabled={anyLoading}
                  />
                </div>

                {/* Email Input */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={styles.inputField}
                    disabled={anyLoading}
                  />
                </div>

                {/* Password Input */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={styles.inputField}
                    disabled={anyLoading}
                  />
                </div>

                {/* Confirm Password Input */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Confirm Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={styles.inputField}
                    disabled={anyLoading}
                  />
                </div>
              </>
            ) : (
              <>
                {/* OTP Code Input */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Verification Code (OTP)</label>
                  <input
                    type="text"
                    required
                    placeholder="123456"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className={styles.inputField}
                    disabled={anyLoading}
                  />
                  <span style={{ fontSize: "0.8rem", color: "var(--color-olive-gray)" }}>
                    An email verification OTP was sent to <strong>{email}</strong>
                  </span>
                </div>
              </>
            )}

            {/* Error Message */}
            {error && <div className={styles.errorMessage}>{error}</div>}

            {/* Submit CTA */}
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={anyLoading}
            >
              {isSubmitting
                ? "Processing..."
                : isLogin
                  ? "Sign In"
                  : step === "credentials"
                    ? "Register Account"
                    : "Verify Code & Sign In"}
            </button>

            {/* Resend Code (only for signup verification step) */}
            {!isLogin && step === "verify" && (
              <button
                type="button"
                className={styles.resendBtn}
                onClick={handleResendCode}
                disabled={anyLoading}
              >
                {isResending ? "Resending..." : "Resend Code"}
              </button>
            )}
          </form>

          {/* Sub-card prompt toggle */}
          <p className={styles.switchPrompt}>
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button
              type="button"
              className={styles.switchLink}
              onClick={() => handleTabChange(!isLogin)}
              disabled={anyLoading}
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </main>

      {/* Success Modal Notification */}
      {success && (
        <div className={styles.successOverlay}>
          <div className={styles.successCard}>
            <div className={styles.successTickCircle}>
              <CheckIcon />
            </div>
            <h3 className={styles.successTitle}>Success!</h3>
            <p className={styles.successText}>{successMessage}</p>
            <span
              style={{ fontSize: "0.8rem", color: "var(--color-olive-gray)" }}
            >
              Redirecting you to home page...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
