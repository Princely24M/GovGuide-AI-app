import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { Eye, EyeOff, Loader2, MailCheck, ShieldCheck } from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";

function Logo() {
  return <Link href="/" className="flex items-center gap-3"><span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-[#F4C95D]"><span className="absolute h-5 w-5 rounded-full border-[3px] border-[#073B4C]" /><span className="absolute h-1.5 w-1.5 rounded-full bg-[#073B4C]" /></span><span><span className="block font-[Manrope] text-[15px] font-extrabold tracking-tight text-[#073B4C]">GovGuide <span className="text-[#087E8B]">AI</span></span><span className="block text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">Civic clarity</span></span></Link>;
}

function PasswordField({ value, onChange, label, autoComplete }: { value: string; onChange: (value: string) => void; label: string; autoComplete: string }) {
  const [visible, setVisible] = useState(false);
  return <div><label className="mb-2 block text-xs font-bold text-[#073B4C] dark:text-white">{label}</label><span className="relative block"><Input required type={visible ? "text" : "password"} value={value} onChange={event => onChange(event.target.value)} autoComplete={autoComplete} className="h-11 rounded-xl border-[#d9e6e7] bg-white pr-11 dark:border-[#2a6c76] dark:bg-[#073B4C]" /><button type="button" onClick={() => setVisible(!visible)} aria-label={visible ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#087E8B]">{visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></span></div>;
}

export default function AuthPage({ mode }: { mode: "login" | "signup" | "forgot" | "reset" }) {
  const [, setLocation] = useLocation();
  const auth = useSupabaseAuth();
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const redirect = params.get("redirect") || "/dashboard";
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (mode === "signup" && fullName.trim().length < 2) { setError("Please enter your full name."); return; }
    if (mode !== "forgot" && mode !== "reset" && password.length < 8) { setError("Use a password with at least 8 characters."); return; }
    if (mode === "signup" && password !== confirmPassword) { setError("Your passwords do not match."); return; }
    if ((mode === "login" || mode === "signup" || mode === "forgot") && !/^\S+@\S+\.\S+$/.test(email)) { setError("Enter a valid email address."); return; }
    setBusy(true);
    const result = mode === "login" ? await auth.signIn(email.trim(), password) : mode === "signup" ? await auth.signUp(fullName.trim(), email.trim(), password) : mode === "forgot" ? await auth.resetPassword(email.trim()) : await auth.updatePassword(password);
    setBusy(false);
    if (result.error) { setError(result.error.message); return; }
    if (mode === "login" || mode === "reset") { setLocation(redirect); return; }
    if (mode === "signup" && "needsEmailConfirmation" in result && result.needsEmailConfirmation) { setSuccess("Check your email. Please verify your email address before continuing."); return; }
    if (mode === "forgot") { setSuccess("If an account exists for that email, Supabase has sent a password reset link."); return; }
    setLocation(redirect);
  };

  const title = mode === "login" ? "Welcome back" : mode === "signup" ? "Create your GovGuide account" : mode === "forgot" ? "Reset your password" : "Choose a new password";
  const description = mode === "login" ? "Sign in to continue your civic journey." : mode === "signup" ? "Save your progress, conversations, content and reports securely." : mode === "forgot" ? "We’ll send a secure password reset link to your email." : "Your password will be updated securely through Supabase Auth.";

  return <div className="min-h-screen bg-[#f7fafa] px-4 py-8 text-[#073B4C] dark:bg-[#062f3d] dark:text-white sm:py-12"><div className="mx-auto max-w-[980px]"><Logo /><div className="mt-10 grid overflow-hidden rounded-[2rem] border border-[#dce9ea] bg-white shadow-[0_24px_70px_rgba(7,59,76,.1)] dark:border-[#1f6570] dark:bg-[#0a4050] md:grid-cols-[.85fr_1.15fr]"><div className="hidden bg-[#073B4C] p-10 text-white md:block"><div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#F4C95D]">Civic clarity, securely connected</div><h2 className="mt-6 font-[Manrope] text-3xl font-extrabold leading-tight">Your government-service journey, saved in one place.</h2><p className="mt-5 text-sm leading-7 text-white/65">Keep your checklists, conversations, saved guidance and citizen insights available whenever you return.</p><div className="mt-12 space-y-4">{["Private user data with database-level access policies", "Real session persistence across refreshes", "Plain-language guidance grounded in your chosen service"].map(item => <div key={item} className="flex gap-3 text-sm text-white/75"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#46B5C2]" />{item}</div>)}</div></div><div className="p-6 sm:p-10"><div className="max-w-md"><div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#087E8B]">GovGuide AI account</div><h1 className="mt-3 font-[Manrope] text-3xl font-extrabold tracking-tight">{title}</h1><p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-300">{description}</p>{success && <div className="mt-6 flex items-start gap-3 rounded-xl border border-[#b9dfe0] bg-[#e4f4f5] p-4 text-sm leading-6 text-[#075e68] dark:bg-[#073B4C] dark:text-[#9cdbd9]"><MailCheck className="mt-0.5 h-5 w-5 shrink-0" />{success}</div>}{(!success || mode === "reset") && <form onSubmit={submit} className="mt-7 space-y-4">{mode === "signup" && <div><label className="mb-2 block text-xs font-bold text-[#073B4C] dark:text-white">Full name</label><Input required value={fullName} onChange={event => setFullName(event.target.value)} autoComplete="name" className="h-11 rounded-xl border-[#d9e6e7] bg-white dark:border-[#2a6c76] dark:bg-[#073B4C]" /></div>}{mode !== "reset" && <div><label className="mb-2 block text-xs font-bold text-[#073B4C] dark:text-white">Email address</label><Input required type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" className="h-11 rounded-xl border-[#d9e6e7] bg-white dark:border-[#2a6c76] dark:bg-[#073B4C]" /></div>}{mode !== "forgot" && <PasswordField value={password} onChange={setPassword} label={mode === "reset" ? "New password" : "Password"} autoComplete={mode === "reset" ? "new-password" : mode === "login" ? "current-password" : "new-password"} />}{mode === "signup" && <PasswordField value={confirmPassword} onChange={setConfirmPassword} label="Confirm password" autoComplete="new-password" />}{error && <div role="alert" className="rounded-xl border border-[#efcaca] bg-[#fff2f2] px-4 py-3 text-xs leading-5 text-[#a53838]">{error}</div>}<Button type="submit" disabled={busy} className="h-11 w-full rounded-xl bg-[#087E8B] text-sm font-bold text-white hover:bg-[#073B4C]">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "login" ? "Sign in" : mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Update password"}</Button></form>}{success && mode !== "reset" && <div className="mt-7 rounded-xl bg-[#f7fafa] p-4 text-sm leading-6 text-slate-500 dark:bg-[#073B4C] dark:text-slate-300">You can close this page after confirming your email. When you return, sign in with your verified account.</div>}<div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold">{mode === "login" && <><Link href="/forgot-password" className="text-[#087E8B] hover:underline">Forgot password?</Link><span className="text-slate-400">Don’t have an account? <Link href="/signup" className="text-[#087E8B] hover:underline">Create account</Link></span></>}{mode === "signup" && <span className="text-slate-400">Already have an account? <Link href="/login" className="text-[#087E8B] hover:underline">Sign in</Link></span>}{mode === "forgot" && <Link href="/login" className="text-[#087E8B] hover:underline">Back to sign in</Link>}{mode === "reset" && <Link href="/login" className="text-[#087E8B] hover:underline">Back to sign in</Link>}</div></div></div></div></div></div>;
}
