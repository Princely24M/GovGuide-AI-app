import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { AIChatBox, type Message } from "@/components/AIChatBox";
import GovernmentServicesMap from "@/pages/GovernmentServicesMap";
import ReportsPage from "@/pages/Reports";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useTheme } from "@/contexts/ThemeContext";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useSupabaseData, type PersistentSavedContent, type PersistentSentiment } from "@/hooks/useSupabaseData";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { toast } from "sonner";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Award,
  Bell,
  BookOpen,
  Bookmark,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Car,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  Copy,
  Download,
  ExternalLink,
  FileBarChart2,
  FileText,
  Filter,
  Globe2,
  GraduationCap,
  HeartPulse,
  Landmark,
  LayoutDashboard,
  Lightbulb,
  Link2,
  ListChecks,
  Loader2,
  LogIn,
  LogOut,
  Map as MapIcon,
  MapPin,
  Menu,
  MessageCircle,
  Moon,
  MoreHorizontal,
  Navigation,
  PenLine,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Trash2,
  TrendingUp,
  Upload,
  UserRound,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";

const colors = {
  ink: "#073B4C",
  teal: "#087E8B",
  glow: "#46B5C2",
  gold: "#F4C95D",
};

type Service = {
  slug: string;
  name: string;
  department: string;
  category: string;
  description: string;
  icon: LucideIcon;
  accent: string;
  documents: string[];
  steps: string[];
  audience: string;
  cost: string;
  time: string;
  channels: string[];
  source: string;
};

type ChecklistItem = {
  id: string;
  checklistId: string;
  title: string;
  detail: string;
  service: string;
  done: boolean;
};

type Office = {
  name: string;
  department: string;
  address: string;
  distance: string;
  hours: string;
  services: string[];
  x: number;
  y: number;
};

type SentimentResult = {
  total: number;
  positive: number;
  neutral: number;
  negative: number;
  score: number;
  themes: string[];
  complaints: string[];
  observations: string[];
  insights: string;
};

const services: Service[] = [
  {
    slug: "smart-id",
    name: "Smart ID Card",
    department: "Department of Home Affairs",
    category: "Identity & Home Affairs",
    description: "Apply for a secure South African identity document or replace an existing ID.",
    icon: ShieldCheck,
    accent: "#087E8B",
    documents: ["Birth certificate or existing ID", "Proof of address", "Passport-size photograph where requested"],
    steps: ["Prepare your identity documents", "Book or visit a Home Affairs office", "Complete biometrics and submit the application", "Track collection or delivery updates"],
    audience: "South African citizens who need a first ID, replacement, or smart ID card.",
    cost: "Verify current fee with Home Affairs",
    time: "Processing times vary by office",
    channels: ["Home Affairs offices", "eHomeAffairs where available"],
    source: "Department of Home Affairs",
  },
  {
    slug: "passport",
    name: "South African Passport",
    department: "Department of Home Affairs",
    category: "Identity & Home Affairs",
    description: "Understand the steps and documents needed to apply for or renew a passport.",
    icon: Globe2,
    accent: "#46B5C2",
    documents: ["Valid South African identity document", "Current passport for renewals", "Supporting documents requested by the office"],
    steps: ["Confirm the passport type you need", "Book an appointment if required", "Submit documents and biometrics", "Collect the passport when notified"],
    audience: "South African citizens travelling internationally or renewing an expiring passport.",
    cost: "Verify current fee with Home Affairs",
    time: "Verify the current turnaround before making travel plans",
    channels: ["Home Affairs offices", "South African missions abroad"],
    source: "Department of Home Affairs",
  },
  {
    slug: "learners-licence",
    name: "Learner’s Licence",
    department: "Department of Transport",
    category: "Transport",
    description: "Prepare for the learner’s licence test and find the relevant testing centre.",
    icon: GraduationCap,
    accent: "#F4C95D",
    documents: ["Identity document", "Completed application form", "Eye test or supporting certificate where required"],
    steps: ["Study the rules of the road", "Apply at a driving licence testing centre", "Complete the eye test and written test", "Collect the learner’s licence if successful"],
    audience: "People who want to learn to drive and need a learner’s licence first.",
    cost: "Verify with your local testing centre",
    time: "Test and collection dates depend on the centre",
    channels: ["Driving licence testing centres"],
    source: "Department of Transport",
  },
  {
    slug: "driving-licence",
    name: "Driving Licence",
    department: "Department of Transport",
    category: "Transport",
    description: "Find the high-level process for booking and completing a driving licence test.",
    icon: Car,
    accent: "#073B4C",
    documents: ["Learner’s licence", "Identity document", "Approved vehicle and required forms"],
    steps: ["Book a driving test", "Prepare with a licensed instructor", "Complete the yard and road tests", "Apply for the licence card after passing"],
    audience: "Learner drivers who are ready to take the practical driving test.",
    cost: "Verify booking and card fees with the testing centre",
    time: "Availability varies by province and testing centre",
    channels: ["Driving licence testing centres"],
    source: "Department of Transport",
  },
  {
    slug: "vehicle-licence-renewal",
    name: "Vehicle Licence Renewal",
    department: "Provincial transport authority",
    category: "Transport",
    description: "Renew a vehicle licence before it expires and keep proof of payment handy.",
    icon: Car,
    accent: "#2E8B57",
    documents: ["Identity document", "Vehicle licence renewal notice where available", "Proof of address where required"],
    steps: ["Check your renewal date", "Confirm outstanding penalties or requirements", "Pay at an approved channel", "Keep the renewed disc or receipt"],
    audience: "Vehicle owners renewing a licence disc in their province.",
    cost: "Calculated by vehicle and province",
    time: "Often same-day after successful payment",
    channels: ["Licensing offices", "Selected online and retail channels"],
    source: "Relevant provincial transport authority",
  },
  {
    slug: "social-grants",
    name: "Social Grants",
    department: "South African Social Security Agency (SASSA)",
    category: "Social Services",
    description: "Explore the main grant categories and prepare for a SASSA application.",
    icon: HeartPulse,
    accent: "#C94C4C",
    documents: ["Identity documents", "Proof of income or circumstances", "Banking details when required"],
    steps: ["Choose the grant type that fits your situation", "Gather supporting documents", "Apply through SASSA channels", "Track the outcome and keep your reference"],
    audience: "Eligible South African residents who need social assistance information.",
    cost: "No application fee; verify eligibility with SASSA",
    time: "Verify current assessment timelines with SASSA",
    channels: ["SASSA offices", "Official SASSA digital channels where available"],
    source: "SASSA",
  },
  {
    slug: "uif-benefits",
    name: "UIF Benefits",
    department: "Department of Employment and Labour",
    category: "Employment",
    description: "Understand the information commonly needed to claim UIF benefits.",
    icon: WalletCards,
    accent: "#087E8B",
    documents: ["Identity document", "Employment and separation information", "Banking details and employer forms where applicable"],
    steps: ["Confirm which UIF benefit applies", "Gather employer and banking information", "Submit through the approved channel", "Monitor your claim status"],
    audience: "Contributors who may qualify for unemployment, maternity, illness, or related UIF benefits.",
    cost: "No application fee",
    time: "Verify current processing timelines with Employment and Labour",
    channels: ["Labour centres", "uFiling where available"],
    source: "Department of Employment and Labour",
  },
  {
    slug: "business-registration",
    name: "Business Registration",
    department: "Companies and Intellectual Property Commission (CIPC)",
    category: "Business",
    description: "Get oriented on the information and steps involved in registering a company.",
    icon: BriefcaseBusiness,
    accent: "#F4C95D",
    documents: ["Identity documents for directors or members", "Proposed company information", "Registered address and supporting documents"],
    steps: ["Choose and check a company name", "Prepare director and registered-office information", "Complete the CIPC registration process", "Pay the applicable fee and submit", "Store your registration confirmation"],
    audience: "Founders, entrepreneurs, and business owners setting up a South African company.",
    cost: "Verify current CIPC fees and name-reservation costs",
    time: "Processing times vary by application and channel",
    channels: ["CIPC online services", "CIPC contact centre and supported service points"],
    source: "CIPC",
  },
  {
    slug: "public-health-services",
    name: "Public Health Services",
    department: "Provincial Department of Health",
    category: "Health",
    description: "Find the right starting point for public clinics, hospitals, and health support.",
    icon: HeartPulse,
    accent: "#46B5C2",
    documents: ["Identity document where available", "Referral or medical records when relevant", "Proof of residence for some services"],
    steps: ["Identify the service you need", "Find a nearby clinic or hospital", "Ask the facility about referral requirements", "Keep appointment and referral details"],
    audience: "Residents looking for public healthcare access and service information.",
    cost: "Verify with the relevant facility and province",
    time: "Depends on the service and facility",
    channels: ["Public clinics", "Public hospitals", "Provincial health lines"],
    source: "Relevant Provincial Department of Health",
  },
];

const initialChecklist: ChecklistItem[] = [];

const offices: Office[] = [
  { name: "CIPC Pretoria Office", department: "CIPC", address: "The dti Campus, Sunnyside, Pretoria", distance: "2.4 km", hours: "Mon–Fri · 08:00–16:00", services: ["Business Registration", "Company amendments"], x: 67, y: 29 },
  { name: "Home Affairs Pretoria", department: "Home Affairs", address: "Pretoria Central, Gauteng", distance: "3.1 km", hours: "Mon–Fri · 08:00–15:30", services: ["Smart ID", "Passport"], x: 49, y: 39 },
  { name: "Labour Centre Sunnyside", department: "Employment & Labour", address: "Sunnyside, Pretoria", distance: "4.6 km", hours: "Mon–Fri · 07:30–16:00", services: ["UIF Benefits"], x: 40, y: 66 },
  { name: "SASSA Gauteng Regional Office", department: "SASSA", address: "Pretoria CBD, Gauteng", distance: "5.2 km", hours: "Mon–Fri · 08:00–16:00", services: ["Social Grants"], x: 74, y: 72 },
];

const initialSentiment: SentimentResult = {
  total: 0,
  positive: 0,
  neutral: 0,
  negative: 0,
  score: 0,
  themes: [],
  complaints: [],
  observations: [],
  insights: "No sentiment analysis has been saved yet. Analyse real citizen feedback to see results here.",
};

const quickPrompts = ["How do I apply for a passport?", "What documents do I need for a Smart ID?", "How do I register a company?", "Where can I renew my vehicle licence?"];

function Logo({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-[#F4C95D] shadow-sm">
        <div className="absolute h-5 w-5 rounded-full border-[3px] border-[#073B4C]" />
        <div className="absolute h-1.5 w-1.5 rounded-full bg-[#073B4C]" />
      </div>
      <div>
        <div className={cn("font-[Manrope] text-[15px] font-extrabold tracking-tight", light ? "text-white" : "text-[#073B4C]")}>GovGuide <span className={light ? "text-[#F4C95D]" : "text-[#087E8B]"}>AI</span></div>
        <div className={cn("text-[10px] font-medium uppercase tracking-[0.18em]", light ? "text-white/55" : "text-slate-500")}>Civic clarity</div>
      </div>
    </div>
  );
}

function Pill({ children, tone = "teal" }: { children: React.ReactNode; tone?: "teal" | "gold" | "green" | "red" | "slate" }) {
  const classes = { teal: "bg-[#e4f4f5] text-[#087E8B]", gold: "bg-[#fff5d5] text-[#8a6500]", green: "bg-[#e7f4ec] text-[#2E8B57]", red: "bg-[#fbeaea] text-[#a53838]", slate: "bg-slate-100 text-slate-600" };
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold", classes[tone])}>{children}</span>;
}

function SectionTitle({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: React.ReactNode }) {
  return <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
    <div>
      {eyebrow && <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#087E8B]">{eyebrow}</div>}
      <h2 className="font-[Manrope] text-xl font-extrabold tracking-tight text-[#073B4C] dark:text-white sm:text-2xl">{title}</h2>
      {description && <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-300">{description}</p>}
    </div>
    {action}
  </div>;
}

function StatCard({ icon: Icon, label, value, note, tone = "teal" }: { icon: LucideIcon; label: string; value: string; note: string; tone?: "teal" | "gold" | "green" }) {
  const tones = { teal: "bg-[#e4f4f5] text-[#087E8B]", gold: "bg-[#fff5d5] text-[#927000]", green: "bg-[#e7f4ec] text-[#2E8B57]" };
  return <div className="rounded-2xl border border-[#dde7e9] bg-white p-4 shadow-[0_8px_28px_rgba(7,59,76,0.04)] dark:border-[#1f6570] dark:bg-[#0a4050]">
    <div className="flex items-center justify-between"><div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", tones[tone])}><Icon className="h-4 w-4" /></div><ArrowUpRight className="h-4 w-4 text-slate-300" /></div>
    <div className="mt-4 text-2xl font-extrabold text-[#073B4C] dark:text-white">{value}</div>
    <div className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-300">{label}</div>
    <div className="mt-2 text-[11px] text-slate-400">{note}</div>
  </div>;
}

function ServiceCard({ service, compact = false, onAdd }: { service: Service; compact?: boolean; onAdd: (service: Service) => void }) {
  const Icon = service.icon;
  return <div className={cn("group flex flex-col rounded-2xl border border-[#dde7e9] bg-white p-4 shadow-[0_8px_28px_rgba(7,59,76,0.035)] transition hover:-translate-y-0.5 hover:border-[#46B5C2] hover:shadow-[0_14px_34px_rgba(7,59,76,0.09)] dark:border-[#1f6570] dark:bg-[#0a4050]", compact ? "min-h-[210px]" : "min-h-[236px]")}>
    <div className="flex items-start justify-between"><div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${service.accent}18`, color: service.accent }}><Icon className="h-5 w-5" /></div><button aria-label={`More actions for ${service.name}`} className="rounded-lg p-1 text-slate-300 hover:bg-slate-50 hover:text-slate-600 dark:hover:bg-white/10"><MoreHorizontal className="h-4 w-4" /></button></div>
    <div className="mt-4"><Pill tone={service.category === "Business" ? "gold" : "teal"}>{service.category}</Pill><h3 className="mt-3 font-[Manrope] text-[15px] font-bold text-[#073B4C] dark:text-white">{service.name}</h3><p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-300">{service.description}</p></div>
    <div className="mt-auto flex items-center justify-between gap-2 pt-4"><Link href={`/services/${service.slug}`} className="inline-flex items-center gap-1 text-xs font-bold text-[#087E8B] hover:text-[#073B4C]">View details <ArrowRight className="h-3.5 w-3.5" /></Link><button onClick={() => onAdd(service)} className="inline-flex items-center gap-1 rounded-lg border border-[#dde7e9] px-2.5 py-1.5 text-[11px] font-bold text-[#073B4C] hover:border-[#46B5C2] hover:bg-[#e4f4f5] dark:border-[#2a6c76] dark:text-white dark:hover:bg-[#155b67]"><Plus className="h-3.5 w-3.5" /> Checklist</button></div>
  </div>;
}

function MiniMap({ selected, onSelect }: { selected: Office | null; onSelect: (office: Office) => void }) {
  return <div className="relative min-h-[275px] overflow-hidden rounded-2xl bg-[#e8f3f1] dark:bg-[#0b4a57]">
    <div className="absolute inset-0 opacity-50 soft-grid" />
    <div className="absolute left-[20%] top-[10%] h-36 w-48 rotate-12 rounded-[48%_52%_44%_56%] border-2 border-[#9fcac6] bg-[#d7ebe5] dark:border-[#39808a] dark:bg-[#0c5962]" />
    <div className="absolute left-[47%] top-[45%] h-28 w-40 -rotate-6 rounded-[50%_42%_55%_45%] border-2 border-[#a9cfcb] bg-[#dcece8] dark:border-[#39808a] dark:bg-[#0f6068]" />
    <div className="absolute bottom-3 left-3 rounded-xl bg-white/90 px-3 py-2 text-[11px] font-semibold text-[#073B4C] shadow-sm backdrop-blur dark:bg-[#073B4C]/90 dark:text-white"><div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#087E8B]" /> Pretoria area · demo locations</div></div>
    {offices.map((office) => <button key={office.name} onClick={() => onSelect(office)} aria-label={`View ${office.name}`} className={cn("absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-white bg-[#087E8B] text-white shadow-lg transition hover:scale-110 dark:border-[#073B4C]", selected?.name === office.name && "z-10 scale-125 bg-[#F4C95D] text-[#073B4C]")} style={{ left: `${office.x}%`, top: `${office.y}%` }}><MapPin className="h-3.5 w-3.5" /></button>)}
  </div>;
}

function Landing({ navigate }: { navigate: (path: string) => void }) {
  return <div className="min-h-screen bg-[#f7fafa] text-[#073B4C] dark:bg-[#062f3d] dark:text-white">
    <header className="container flex items-center justify-between py-5"><Logo /><div className="hidden items-center gap-7 text-sm font-semibold text-slate-500 md:flex dark:text-slate-300"><a href="#how">How it works</a><a href="#services">Services</a><a href="#tools">AI tools</a></div><div className="flex items-center gap-2"><button onClick={() => navigate("/dashboard")} className="hidden rounded-xl px-3 py-2 text-sm font-bold text-[#073B4C] hover:bg-white sm:block dark:text-white dark:hover:bg-[#0a4050]">Sign in</button><button onClick={() => navigate("/services")} className="rounded-xl bg-[#087E8B] px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_18px_rgba(8,126,139,.22)] hover:bg-[#073B4C]">Explore services</button></div></header>
    <main>
      <section className="container grid items-center gap-12 pb-20 pt-12 lg:grid-cols-[1.04fr_.96fr] lg:pb-28 lg:pt-20">
        <div><Pill tone="gold"><Sparkles className="mr-1.5 h-3 w-3" /> Built for South Africa</Pill><h1 className="mt-6 max-w-xl font-[Manrope] text-5xl font-extrabold leading-[1.02] tracking-[-0.045em] sm:text-6xl">Your smarter guide to <span className="text-[#087E8B]">government services.</span></h1><p className="mt-6 max-w-xl text-lg leading-8 text-slate-500 dark:text-slate-300">Find services, understand requirements, locate offices and get AI-powered guidance in one calm, clear place.</p><div className="mt-8 flex flex-wrap gap-3"><button onClick={() => navigate("/ask-govguide")} className="inline-flex items-center gap-2 rounded-xl bg-[#087E8B] px-5 py-3.5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(8,126,139,.24)] hover:bg-[#073B4C]">Ask GovGuide <ArrowRight className="h-4 w-4" /></button><button onClick={() => navigate("/services")} className="inline-flex items-center gap-2 rounded-xl border border-[#cfe0e2] bg-white px-5 py-3.5 text-sm font-bold text-[#073B4C] hover:border-[#46B5C2] dark:border-[#2a6c76] dark:bg-[#0a4050] dark:text-white">Explore government services</button></div><div className="mt-9 flex items-center gap-6 text-xs font-semibold text-slate-400"><span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#2E8B57]" /> Official-source aware</span><span className="flex items-center gap-2"><HeartPulse className="h-4 w-4 text-[#087E8B]" /> Plain language</span></div></div>
        <div className="relative"><div className="absolute -inset-6 rounded-[2.5rem] bg-[#46B5C2]/10 blur-2xl" /><div className="relative overflow-hidden rounded-[2rem] border border-[#b9dfe0] bg-[#073B4C] p-5 shadow-[0_24px_70px_rgba(7,59,76,.2)]"><div className="flex items-center justify-between border-b border-white/10 pb-4"><Logo light /><span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#F4C95D]">Preview</span></div><div className="mt-6 rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur"><div className="flex items-center gap-2 text-xs font-bold text-[#F4C95D]"><Sparkles className="h-4 w-4" /> Ask GovGuide</div><div className="mt-3 text-xl font-bold text-white">What government service do you need help with?</div><div className="mt-5 flex items-center justify-between rounded-xl bg-white px-3 py-3 text-xs text-slate-400"><span>How do I register a company?</span><button onClick={() => navigate("/ask-govguide")} className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#087E8B] text-white"><Send className="h-3.5 w-3.5" /></button></div><div className="mt-4 flex flex-wrap gap-2"><span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] text-white/75">Business registration</span><span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] text-white/75">Requirements</span><span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] text-white/75">Nearby offices</span></div></div><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-[#0a5364] p-4"><div className="text-[10px] uppercase tracking-widest text-white/55">My checklist</div><div className="mt-2 text-2xl font-extrabold text-white">3 of 5</div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/15"><div className="h-full w-3/5 rounded-full bg-[#F4C95D]" /></div></div><div className="rounded-2xl bg-[#0a5364] p-4"><div className="text-[10px] uppercase tracking-widest text-white/55">Nearby offices</div><div className="mt-2 text-2xl font-extrabold text-white">4</div><div className="mt-2 flex items-center gap-1 text-[11px] text-[#9cdbd9]"><MapPin className="h-3 w-3" /> in Pretoria area</div></div></div></div></div>
      </section>
      <section id="how" className="border-y border-[#dde7e9] bg-white py-16 dark:border-[#1f6570] dark:bg-[#0a4050]"><div className="container"><SectionTitle eyebrow="How GovGuide works" title="From question to action, without the runaround." description="One connected journey for finding the right service, understanding it, and taking the next step." /><div className="grid gap-4 md:grid-cols-4">{[["01", "Find", "Search the service you need."], ["02", "Understand", "See requirements, documents and steps."], ["03", "Ask", "Get personalised guidance in plain language."], ["04", "Act", "Use your checklist and find the office." ]].map(([number, title, text]) => <div key={number} className="rounded-2xl border border-[#dde7e9] bg-[#f7fafa] p-5 dark:border-[#1f6570] dark:bg-[#073B4C]"><div className="text-xs font-extrabold text-[#087E8B]">{number}</div><h3 className="mt-8 font-[Manrope] text-lg font-bold text-[#073B4C] dark:text-white">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-300">{text}</p></div>)}</div></div></section>
      <section id="services" className="container py-16"><SectionTitle eyebrow="Popular services" title="Start with the services people ask about most." description="Clear, structured overviews with an official-source reminder at every step." action={<button onClick={() => navigate("/services")} className="inline-flex items-center gap-1 text-sm font-bold text-[#087E8B]">View all services <ArrowRight className="h-4 w-4" /></button>} /><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{services.slice(0, 4).map(service => <ServiceCard key={service.slug} service={service} compact onAdd={() => navigate("/dashboard")} />)}</div></section>
      <section id="tools" className="container pb-20"><div className="rounded-[2rem] bg-[#073B4C] p-7 text-white sm:p-10"><div className="grid items-center gap-8 lg:grid-cols-[.85fr_1.15fr]"><div><Pill tone="gold">AI tools</Pill><h2 className="mt-5 font-[Manrope] text-3xl font-extrabold tracking-tight">Helpful intelligence, grounded in civic context.</h2><p className="mt-4 text-sm leading-7 text-white/65">Ask questions, create clearer public information, and turn citizen feedback into practical insight.</p><button onClick={() => navigate("/ask-govguide")} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#F4C95D] px-4 py-3 text-sm font-bold text-[#073B4C] hover:bg-white">Explore AI tools <ArrowRight className="h-4 w-4" /></button></div><div className="grid gap-3 sm:grid-cols-3">{[[MessageCircle, "Ask GovGuide", "Understand a service"], [PenLine, "Content Generator", "Make information clearer"], [TrendingUp, "Sentiment Analyzer", "Hear what citizens say"]].map(([Icon, title, text]) => <button key={title as string} onClick={() => navigate(title === "Ask GovGuide" ? "/ask-govguide" : title === "Content Generator" ? "/content-generator" : "/sentiment-analyzer")} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/10"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0a5364] text-[#46B5C2]"><Icon className="h-4 w-4" /></div><div className="mt-5 text-sm font-bold">{title as string}</div><div className="mt-1 text-xs leading-5 text-white/55">{text as string}</div></button>)}</div></div></div></section>
    </main>
    <footer className="border-t border-[#dde7e9] py-6 text-center text-xs text-slate-400 dark:border-[#1f6570]">GovGuide AI · Informational guidance for navigating South African government services.</footer>
  </div>;
}

function Sidebar({ location, navigate, mobileOpen, setMobileOpen, aiOpen, setAiOpen, user, logout }: { location: string; navigate: (path: string) => void; mobileOpen: boolean; setMobileOpen: (open: boolean) => void; aiOpen: boolean; setAiOpen: (open: boolean) => void; user: any; logout: () => void }) {
  const isActive = (path: string) => location === path || (path === "/services" && location.startsWith("/services/"));
  const items = [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { label: "Government Services", path: "/services", icon: Building2 },
  ];
  const go = (path: string) => { navigate(path); setMobileOpen(false); };
  return <>
    {mobileOpen && <button aria-label="Close menu" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-[#073B4C]/40 backdrop-blur-sm lg:hidden" />}
    <aside className={cn("fixed inset-y-0 left-0 z-50 flex w-[272px] flex-col bg-[#073B4C] px-4 py-5 text-white transition-transform duration-200 lg:translate-x-0", mobileOpen ? "translate-x-0" : "-translate-x-full")}>
      <div className="flex items-center justify-between px-2"><Logo light /><button onClick={() => setMobileOpen(false)} className="rounded-lg p-1 text-white/50 hover:bg-white/10 hover:text-white lg:hidden"><X className="h-5 w-5" /></button></div>
      <div className="mt-9 flex-1 overflow-y-auto no-scrollbar">
        <div className="px-3 pb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">Workspace</div>
        <nav className="space-y-1" aria-label="Primary navigation">{items.map(item => <button key={item.path} onClick={() => go(item.path)} className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition", isActive(item.path) ? "bg-white/12 text-white shadow-inner" : "text-white/62 hover:bg-white/8 hover:text-white")}><item.icon className={cn("h-[18px] w-[18px]", isActive(item.path) ? "text-[#F4C95D]" : "text-white/45")} />{item.label}</button>)}
          <div><button onClick={() => setAiOpen(!aiOpen)} className={cn("flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm font-semibold text-white/62 hover:bg-white/8 hover:text-white", location.includes("/ask-govguide") || location.includes("generator") || location.includes("sentiment") || location.includes("reports") ? "text-white" : "")}><span className="flex items-center gap-3"><Sparkles className={cn("h-[18px] w-[18px]", location.includes("/ask-govguide") || location.includes("generator") || location.includes("sentiment") || location.includes("reports") ? "text-[#F4C95D]" : "text-white/45")} />AI Tools</span><ChevronDown className={cn("h-4 w-4 text-white/40 transition-transform", !aiOpen && "-rotate-90")} /></button>{aiOpen && <div className="ml-5 mt-1 space-y-1 border-l border-white/10 pl-3"><button onClick={() => go("/ask-govguide")} className={cn("flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold", location === "/ask-govguide" ? "bg-[#0c5365] text-white" : "text-white/50 hover:text-white")}><MessageCircle className="h-3.5 w-3.5" />Ask GovGuide</button><button onClick={() => go("/content-generator")} className={cn("flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold", location === "/content-generator" ? "bg-[#0c5365] text-white" : "text-white/50 hover:text-white")}><PenLine className="h-3.5 w-3.5" />Content Generator</button><button onClick={() => go("/sentiment-analyzer")} className={cn("flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold", location === "/sentiment-analyzer" ? "bg-[#0c5365] text-white" : "text-white/50 hover:text-white")}><TrendingUp className="h-3.5 w-3.5" />Sentiment Analyzer</button><button onClick={() => go("/reports")} className={cn("flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold", location === "/reports" ? "bg-[#0c5365] text-white" : "text-white/50 hover:text-white")}><FileBarChart2 className="h-3.5 w-3.5" />Reports</button></div>}</div>
          {[{ label: "Services Map", path: "/services-map", icon: MapIcon }, { label: "My Checklist", path: "/checklist", icon: ClipboardCheck }, { label: "Saved Content", path: "/saved-content", icon: Bookmark }, { label: "Nearby Offices", path: "/nearby-offices", icon: MapPin }].map(item => <button key={item.path} onClick={() => go(item.path)} className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold", isActive(item.path) ? "bg-white/12 text-white" : "text-white/62 hover:bg-white/8 hover:text-white")}><item.icon className={cn("h-[18px] w-[18px]", isActive(item.path) ? "text-[#F4C95D]" : "text-white/45")} />{item.label}</button>)}
        </nav>
        <div className="my-6 border-t border-white/10" />
        <button onClick={() => go("/settings")} className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold", location === "/settings" ? "bg-white/12 text-white" : "text-white/62 hover:bg-white/8 hover:text-white")}><Settings2 className="h-[18px] w-[18px] text-white/45" />Settings</button>
      </div>
      <div className="border-t border-white/10 pt-4"><div className="flex items-center gap-3 rounded-xl bg-white/7 p-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F4C95D] text-sm font-extrabold text-[#073B4C]">{(user?.name || "D").slice(0, 1).toUpperCase()}</div><div className="min-w-0 flex-1"><div className="truncate text-xs font-bold">{user?.name || "Your profile"}</div><div className="truncate text-[10px] text-white/45">{user?.email || ""}</div></div><button onClick={user ? logout : () => startLogin()} aria-label={user ? "Log out" : "Sign in"} className="rounded-lg p-1.5 text-white/45 hover:bg-white/10 hover:text-white">{user ? <LogOut className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}</button></div><div className="mt-3 px-3 text-[10px] leading-4 text-white/35">Verify important requirements with the relevant department.</div></div>
    </aside>
  </>;
}

function AppHeader({ title, navigate, setMobileOpen, user }: { title: string; navigate: (path: string) => void; setMobileOpen: (open: boolean) => void; user: any }) {
  const [query, setQuery] = useState("");
  const submit = (event: React.FormEvent) => { event.preventDefault(); if (query.trim()) navigate(`/services?search=${encodeURIComponent(query.trim())}`); };
  return <header className="sticky top-0 z-30 flex h-[76px] items-center gap-3 border-b border-[#dde7e9]/80 bg-[#f7fafa]/90 px-4 backdrop-blur-xl sm:px-7 dark:border-[#1f6570]/80 dark:bg-[#062f3d]/90"><button onClick={() => setMobileOpen(true)} className="rounded-xl p-2 text-[#073B4C] hover:bg-white lg:hidden dark:text-white"><Menu className="h-5 w-5" /></button><div className="min-w-0 flex-1"><div className="hidden text-[11px] font-bold uppercase tracking-[0.18em] text-[#087E8B] sm:block">GovGuide workspace</div><h1 className="truncate font-[Manrope] text-lg font-extrabold text-[#073B4C] dark:text-white">{title}</h1></div><form onSubmit={submit} className="hidden w-full max-w-[310px] items-center gap-2 rounded-xl border border-[#dde7e9] bg-white px-3 py-2.5 md:flex dark:border-[#2a6c76] dark:bg-[#0a4050]"><Search className="h-4 w-4 text-slate-400" /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search services..." className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" aria-label="Search services" /></form><button onClick={() => toast("You’re all caught up", { description: "No new GovGuide notifications." })} className="relative rounded-xl p-2.5 text-slate-500 hover:bg-white hover:text-[#087E8B] dark:hover:bg-[#0a4050]"><Bell className="h-[18px] w-[18px]" /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#F4C95D]" /></button><ThemeToggle /><button onClick={() => navigate("/settings")} className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-white dark:hover:bg-[#0a4050]"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e4f4f5] text-xs font-bold text-[#087E8B]">{(user?.name || "D").slice(0, 1).toUpperCase()}</div><span className="hidden text-xs font-bold text-[#073B4C] sm:block dark:text-white">{user?.name?.split(" ")[0] || "Demo"}</span></button></header>;
}

function ThemeToggle() { const { theme, toggleTheme } = useTheme(); return <button onClick={() => toggleTheme?.()} aria-label="Toggle light and dark mode" className="rounded-xl p-2.5 text-slate-500 hover:bg-white hover:text-[#087E8B] dark:hover:bg-[#0a4050]">{theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}</button>; }

function AppShell({ children, title, location, navigate, user, logout }: { children: React.ReactNode; title: string; location: string; navigate: (path: string) => void; user: any; logout: () => void }) {
  const [mobileOpen, setMobileOpen] = useState(false); const [aiOpen, setAiOpen] = useState(true);
  return <div className="min-h-screen bg-[#f7fafa] dark:bg-[#062f3d]"><Sidebar location={location} navigate={navigate} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} aiOpen={aiOpen} setAiOpen={setAiOpen} user={user} logout={logout} /><div className="min-h-screen lg:pl-[272px]"><AppHeader title={title} navigate={navigate} setMobileOpen={setMobileOpen} user={user} /><main className="container py-7 sm:py-9">{children}</main></div></div>;
}

function DashboardOfficesCard({ navigate }: { navigate: (path: string) => void }) {
  const [offices, setOffices] = useState<{ id: string; name: string; city: string; province: string; address: string | null }[]>([]); const [loading, setLoading] = useState(true);
  useEffect(() => { let active = true; supabase.from("offices").select("id,name,city,province,address").order("province").limit(6).then(result => { if (!active) return; setOffices((result.data ?? []) as typeof offices); setLoading(false); }); return () => { active = false; }; }, []);
  return <section className="rounded-2xl border border-[#dde7e9] bg-white p-5 shadow-[0_8px_28px_rgba(7,59,76,0.035)] dark:border-[#1f6570] dark:bg-[#0a4050]"><SectionTitle eyebrow="Government offices" title="Find an office near you" action={<button onClick={() => navigate("/nearby-offices")} className="text-xs font-bold text-[#087E8B]">View all offices</button>} /><div className="mt-4 rounded-2xl bg-[#e8f3f1] p-4 dark:bg-[#073B4C]"><div className="flex items-center gap-2 text-xs font-bold text-[#073B4C] dark:text-white"><MapPin className="h-4 w-4 text-[#087E8B]" /> Live Supabase office coverage</div><div className="mt-3 text-3xl font-extrabold text-[#087E8B]">{loading ? "…" : offices.length}</div><div className="text-xs text-slate-500 dark:text-slate-300">office records available</div></div>{loading ? <div className="mt-4 text-sm text-slate-400">Loading government offices…</div> : offices.length ? <div className="mt-4 space-y-2">{offices.slice(0, 3).map(office => <button key={office.id} onClick={() => navigate("/nearby-offices")} className="w-full rounded-xl border border-[#edf4f4] p-3 text-left hover:border-[#46B5C2] dark:border-[#1f6570]"><div className="text-xs font-bold text-[#073B4C] dark:text-white">{office.name}</div><div className="mt-1 text-[11px] text-slate-500 dark:text-slate-300">{office.city}, {office.province} · {office.address || "Address requires verification"}</div></button>)}</div> : <div className="mt-4 rounded-xl border border-dashed border-[#b9dfe0] p-4 text-xs text-slate-500">We couldn't load government offices. Open the finder to try again.</div>}</section>;
}

function Dashboard({ navigate, checklist, addToChecklist, user, stats, activity }: { navigate: (path: string) => void; checklist: ChecklistItem[]; addToChecklist: (service: Service) => void; user: any; stats: { questions: number; reports: number; saved: number }; activity: { id: string; activityType: string; description: string; createdAt: string }[] }) {
  const firstName = user?.name?.split(" ")[0] || "there"; const completed = checklist.filter(item => item.done).length; const [selectedOffice, setSelectedOffice] = useState<Office | null>(offices[0]);
  return <div className="space-y-7"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="text-sm font-semibold text-[#087E8B]">Good morning, {firstName}</div><h2 className="mt-1 font-[Manrope] text-3xl font-extrabold tracking-tight text-[#073B4C] dark:text-white">How can GovGuide help today?</h2></div><button onClick={() => navigate("/services")} className="inline-flex items-center gap-2 self-start rounded-xl border border-[#dde7e9] bg-white px-4 py-2.5 text-xs font-bold text-[#073B4C] hover:border-[#46B5C2] dark:border-[#2a6c76] dark:bg-[#0a4050] dark:text-white"><Search className="h-4 w-4 text-[#087E8B]" /> Browse services</button></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard icon={ListChecks} label="Checklist progress" value={`${completed}/${checklist.length}`} note="Saved to your account" /><StatCard icon={Bookmark} label="Saved content" value={String(stats.saved)} note="Guides saved by you" tone="gold" /><StatCard icon={MessageCircle} label="Questions asked" value={String(stats.questions)} note="Conversations persisted" tone="green" /><StatCard icon={FileBarChart2} label="Reports" value={String(stats.reports)} note="Reports generated by you" tone="teal" /></div>
    <section className="relative overflow-hidden rounded-[1.6rem] bg-[#073B4C] p-6 shadow-[0_18px_44px_rgba(7,59,76,.14)] sm:p-8"><div className="absolute -right-20 -top-28 h-72 w-72 rounded-full bg-[#46B5C2]/20 blur-3xl" /><div className="relative grid gap-8 lg:grid-cols-[1fr_300px] lg:items-center"><div><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#F4C95D]"><Sparkles className="h-4 w-4" /> Ask GovGuide</div><h3 className="mt-4 max-w-xl font-[Manrope] text-2xl font-extrabold text-white sm:text-3xl">Get simple guidance on South African government services.</h3><p className="mt-2 max-w-lg text-sm leading-6 text-white/60">Ask a question and we’ll help you understand the right service, documents and next steps.</p><div className="mt-6 flex max-w-2xl items-center gap-2 rounded-xl bg-white p-2"><input id="dashboard-ask" placeholder="What government service do you need help with?" className="min-w-0 flex-1 bg-transparent px-3 text-sm text-[#073B4C] outline-none placeholder:text-slate-400" onKeyDown={event => { if (event.key === "Enter") { const value = (event.currentTarget as HTMLInputElement).value.trim(); if (value) navigate(`/ask-govguide?question=${encodeURIComponent(value)}`); } }} /><button onClick={() => navigate("/ask-govguide")} className="inline-flex items-center gap-2 rounded-lg bg-[#087E8B] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#0c5365]"><Send className="h-3.5 w-3.5" /> Ask</button></div><div className="mt-4 flex flex-wrap gap-2">{quickPrompts.slice(0, 3).map(prompt => <button key={prompt} onClick={() => navigate(`/ask-govguide?question=${encodeURIComponent(prompt)}`)} className="rounded-full border border-white/15 px-3 py-1.5 text-[11px] font-semibold text-white/65 hover:border-[#46B5C2] hover:text-white">{prompt}</button>)}</div></div><div className="hidden rounded-2xl border border-white/10 bg-white/6 p-5 lg:block"><div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-white/45"><span>Guidance promise</span><ShieldCheck className="h-4 w-4 text-[#F4C95D]" /></div><div className="mt-6 space-y-4">{[["Plain language", "Less jargon, more clarity"], ["Connected tools", "From question to checklist"], ["Source-aware", "Verify what matters"]].map(([label, text]) => <div key={label} className="flex gap-3"><div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-lg bg-[#0c5365] text-[#46B5C2]"><Check className="h-3.5 w-3.5" /></div><div><div className="text-xs font-bold text-white">{label}</div><div className="mt-1 text-[11px] text-white/45">{text}</div></div></div>)}</div></div></div></section>
    <section><SectionTitle eyebrow="Quick services" title="Popular services" action={<button onClick={() => navigate("/services")} className="inline-flex items-center gap-1 text-xs font-bold text-[#087E8B]">View all <ArrowRight className="h-3.5 w-3.5" /></button>} /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{services.slice(0, 4).map(service => <ServiceCard key={service.slug} service={service} compact onAdd={addToChecklist} />)}</div></section>
    <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]"><DashboardOfficesCard navigate={navigate} />
      <section className="rounded-2xl border border-[#dde7e9] bg-white p-5 shadow-[0_8px_28px_rgba(7,59,76,0.035)] dark:border-[#1f6570] dark:bg-[#0a4050]"><SectionTitle eyebrow="Keep moving" title="My checklist" action={<button onClick={() => navigate("/checklist")} className="text-xs font-bold text-[#087E8B]">Open checklist</button>} /><div className="flex items-end justify-between"><div><div className="text-3xl font-extrabold text-[#073B4C] dark:text-white">{completed} <span className="text-base font-semibold text-slate-400">of {checklist.length}</span></div><div className="mt-1 text-xs text-slate-500">tasks completed</div></div><div className="text-right text-xs font-bold text-[#087E8B]">{checklist.length ? Math.round((completed / checklist.length) * 100) : 0}%</div></div><Progress value={checklist.length ? (completed / checklist.length) * 100 : 0} className="mt-4 h-2 bg-[#e4f4f5] [&>div]:bg-[#087E8B]" /><div className="mt-5 space-y-3">{checklist.slice(0, 3).map(item => <div key={item.id} className="flex items-start gap-3"><div className={cn("mt-0.5 flex h-5 w-5 items-center justify-center rounded-md border", item.done ? "border-[#087E8B] bg-[#087E8B] text-white" : "border-[#cbdde0] text-transparent")}><Check className="h-3 w-3" /></div><div className={cn("text-xs font-semibold", item.done ? "text-slate-400 line-through" : "text-[#073B4C] dark:text-white")}>{item.title}<div className="mt-0.5 text-[10px] font-normal text-slate-400">{item.detail}</div></div></div>)}</div></section></div>
    <section className="rounded-2xl border border-[#dde7e9] bg-white p-5 dark:border-[#1f6570] dark:bg-[#0a4050]"><SectionTitle eyebrow="Recent activity" title="Your latest GovGuide actions" /><div className="space-y-3">{activity.length ? activity.slice(0, 5).map(item => <div key={item.id} className="flex items-start justify-between gap-4 rounded-xl bg-[#f7fafa] p-3 dark:bg-[#073B4C]"><div><div className="text-xs font-bold text-[#073B4C] dark:text-white">{item.activityType}</div><div className="mt-1 text-xs text-slate-500 dark:text-slate-300">{item.description}</div></div><div className="shrink-0 text-[10px] text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</div></div>) : <div className="rounded-xl border border-dashed border-[#b9dfe0] p-4 text-xs text-slate-400">Your real GovGuide activity will appear here as you work.</div>}</div></section><div className="flex items-center gap-3 rounded-2xl border border-[#f0df9d] bg-[#fff9e8] px-4 py-3 text-xs text-[#735800] dark:border-[#6b5a1b] dark:bg-[#403711] dark:text-[#f7df80]"><ShieldCheck className="h-4 w-4 shrink-0" /><span>GovGuide AI provides informational guidance. Verify important requirements, fees and deadlines with the relevant government department.</span></div>
  </div>;
}

function ServicesPage({ navigate, addToChecklist }: { navigate: (path: string) => void; addToChecklist: (service: Service) => void }) {
  const searchFromUrl = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("search") || "" : ""; const [query, setQuery] = useState(searchFromUrl); const [category, setCategory] = useState("All categories");
  const filtered = services.filter(service => (service.name.toLowerCase().includes(query.toLowerCase()) || service.department.toLowerCase().includes(query.toLowerCase()) || service.description.toLowerCase().includes(query.toLowerCase())) && (category === "All categories" || service.category === category));
  const categories = ["All categories", ...Array.from(new Set(services.map(s => s.category)))];
  return <div><SectionTitle eyebrow="Government services" title="Find the right service, faster." description="Browse clear, structured overviews across identity, transport, social services, employment, business, education and health." action={<div className="flex items-center gap-2 rounded-xl bg-[#e4f4f5] px-3 py-2 text-xs font-bold text-[#087E8B]"><ShieldCheck className="h-4 w-4" /> Demo catalogue</div>} /><div className="mb-6 grid gap-3 rounded-2xl border border-[#dde7e9] bg-white p-3 sm:grid-cols-[1fr_220px] dark:border-[#1f6570] dark:bg-[#0a4050]"><div className="flex items-center gap-3 rounded-xl border border-[#dde7e9] px-3 dark:border-[#2a6c76]"><Search className="h-4 w-4 text-slate-400" /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search passport, UIF, company registration..." className="w-full bg-transparent py-2.5 text-sm outline-none" /></div><Select value={category} onValueChange={setCategory}><SelectTrigger className="h-11 rounded-xl border-[#dde7e9] dark:border-[#2a6c76]"><Filter className="mr-2 h-4 w-4 text-[#087E8B]" /><SelectValue placeholder="Filter category" /></SelectTrigger><SelectContent>{categories.map(item => <SelectItem value={item} key={item}>{item}</SelectItem>)}</SelectContent></Select></div><div className="mb-5 flex items-center justify-between text-xs text-slate-400"><span>{filtered.length} services found</span><span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-[#2E8B57]" /> Source-aware demo information</span></div>{filtered.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{filtered.map(service => <ServiceCard key={service.slug} service={service} onAdd={addToChecklist} />)}</div> : <div className="rounded-2xl border border-dashed border-[#b9dfe0] bg-white p-12 text-center dark:bg-[#0a4050]"><Search className="mx-auto h-8 w-8 text-[#46B5C2]" /><h3 className="mt-4 font-bold text-[#073B4C] dark:text-white">No services found</h3><p className="mt-1 text-sm text-slate-500">Try a broader search or choose another category.</p></div>}</div>;
}

function ServiceDetailPage({ service, navigate, addToChecklist }: { service: Service; navigate: (path: string) => void; addToChecklist: (service: Service) => void }) {
  const Icon = service.icon;
  return <div className="space-y-6"><button onClick={() => navigate("/services")} className="inline-flex items-center gap-2 text-xs font-bold text-[#087E8B] hover:text-[#073B4C]"><ChevronRight className="h-4 w-4 rotate-180" /> Back to services</button><div className="rounded-[1.6rem] bg-[#073B4C] p-6 text-white sm:p-8"><div className="flex flex-col justify-between gap-6 md:flex-row"><div className="flex gap-4"><div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-[#F4C95D]"><Icon className="h-7 w-7" /></div><div><Pill tone="gold">{service.category}</Pill><h1 className="mt-3 font-[Manrope] text-3xl font-extrabold tracking-tight">{service.name}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-white/65">{service.description}</p></div></div><div className="flex shrink-0 flex-col gap-2 sm:flex-row md:flex-col"><button onClick={() => { addToChecklist(service); }} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F4C95D] px-4 py-3 text-xs font-extrabold text-[#073B4C] hover:bg-white"><Plus className="h-4 w-4" /> Add to my checklist</button><button onClick={() => navigate("/ask-govguide")} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-3 text-xs font-bold text-white hover:bg-white/10"><MessageCircle className="h-4 w-4" /> Ask GovGuide</button></div></div></div><div className="grid gap-5 lg:grid-cols-[1.3fr_.7fr]"><div className="space-y-5"><InfoSection icon={BookOpen} title="Service overview"><p className="text-sm leading-7 text-slate-600 dark:text-slate-300">{service.description} This page is a practical starting point; confirm the latest process and eligibility with the responsible organisation before applying.</p></InfoSection><InfoSection icon={UsersRound} title="Who can apply"><p className="text-sm leading-7 text-slate-600 dark:text-slate-300">{service.audience}</p></InfoSection><InfoSection icon={FileText} title="Required documents"><div className="grid gap-3 sm:grid-cols-2">{service.documents.map(doc => <div key={doc} className="flex items-start gap-3 rounded-xl bg-[#f7fafa] p-3 text-sm text-slate-600 dark:bg-[#073B4C] dark:text-slate-300"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#087E8B]" />{doc}</div>)}</div></InfoSection><InfoSection icon={ClipboardList} title="Application steps"><div className="space-y-4">{service.steps.map((step, index) => <div key={step} className="flex gap-3"><div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e4f4f5] text-xs font-extrabold text-[#087E8B]">{index + 1}</div><div className="pt-1 text-sm leading-5 text-slate-600 dark:text-slate-300">{step}</div></div>)}</div></InfoSection></div><div className="space-y-5"><div className="rounded-2xl border border-[#dde7e9] bg-white p-5 dark:border-[#1f6570] dark:bg-[#0a4050]"><div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">At a glance</div><div className="mt-5 space-y-4">{[["Responsible department", service.department, Building2], ["Cost", service.cost, CircleDollarSign], ["Processing time", service.time, Clock3]].map(([label, value, IconComponent]) => <div key={label as string} className="flex gap-3"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e4f4f5] text-[#087E8B]"><IconComponent className="h-4 w-4" /></div><div><div className="text-[11px] font-semibold text-slate-400">{label as string}</div><div className="mt-1 text-sm font-bold text-[#073B4C] dark:text-white">{value as string}</div></div></div>)}</div></div><div className="rounded-2xl border border-[#f0df9d] bg-[#fff9e8] p-5 dark:border-[#6b5a1b] dark:bg-[#403711]"><div className="flex items-center gap-2 text-xs font-bold text-[#735800] dark:text-[#f7df80]"><ShieldCheck className="h-4 w-4" /> Verify before you act</div><p className="mt-3 text-xs leading-6 text-[#735800]/80 dark:text-[#f7df80]/80">Fees, availability, document requirements and turnaround times can change. Use the official source below to confirm the latest details.</p><a href="#source" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#087E8B]">View source note <ArrowUpRight className="h-3.5 w-3.5" /></a></div><div id="source" className="rounded-2xl border border-[#dde7e9] bg-white p-5 dark:border-[#1f6570] dark:bg-[#0a4050]"><div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Official source</div><div className="mt-3 text-sm font-bold text-[#073B4C] dark:text-white">{service.source}</div><p className="mt-2 text-xs leading-5 text-slate-500">Open the department’s official channel to verify this demo overview.</p><button onClick={() => toast("Source link placeholder", { description: "Connect the official department URL before production launch." })} className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-[#087E8B]"><ExternalLink className="h-3.5 w-3.5" /> Official website</button></div></div></div></div>;
}

function InfoSection({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: React.ReactNode }) { return <section className="rounded-2xl border border-[#dde7e9] bg-white p-5 dark:border-[#1f6570] dark:bg-[#0a4050]"><div className="mb-4 flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e4f4f5] text-[#087E8B]"><Icon className="h-4 w-4" /></div><h2 className="font-[Manrope] text-sm font-extrabold text-[#073B4C] dark:text-white">{title}</h2></div>{children}</section>; }

function AskPage({ pendingQuestion, clearPending, onPersist, initialMessages, conversations, activeConversationId, onNewConversation, onOpenConversation, onUpdateConversation, onDeleteConversation }: { pendingQuestion: string; clearPending: () => void; onPersist: (question: string, answer: string, conversationId?: string) => Promise<void>; initialMessages: Message[]; conversations: { id: string; title: string; updatedAt: string; isSaved: boolean }[]; activeConversationId: string | null; onNewConversation: () => Promise<string>; onOpenConversation: (id: string) => Promise<void>; onUpdateConversation: (id: string, changes: { title?: string; is_saved?: boolean }) => Promise<void>; onDeleteConversation: (id: string) => Promise<void> }) {
  const [messages, setMessages] = useState<Message[]>(initialMessages); const [lastQuestion, setLastQuestion] = useState(""); const [search, setSearch] = useState("");
  const askMutation = trpc.ai.ask.useMutation({ onSuccess: (data, variables) => { setMessages(previous => [...previous, { role: "assistant", content: data.answer }]); const question = variables.messages[variables.messages.length - 1]?.content; if (question) void onPersist(question, data.answer, activeConversationId ?? undefined); }, onError: () => setMessages(previous => [...previous, { role: "assistant", content: "I can help you orient yourself, but the live AI service is unavailable right now. Try starting with the Government Services directory and verify important details through the official department source." }]) });
  const sendQuestion = (content: string) => { const question = content.trim(); if (!question || askMutation.isPending) return; const next = [...messages, { role: "user" as const, content: question }]; setMessages(next); setLastQuestion(question); askMutation.mutate({ messages: next.filter(message => message.role !== "system").map(message => ({ role: message.role as "user" | "assistant", content: message.content })) }); };
  useEffect(() => { setMessages(initialMessages); }, [initialMessages]); useEffect(() => { if (pendingQuestion) { clearPending(); sendQuestion(pendingQuestion); } }, [pendingQuestion]);
  const visibleConversations = conversations.filter(item => item.title.toLowerCase().includes(search.toLowerCase()));
  const newConversation = async () => { await onNewConversation(); setMessages([]); setLastQuestion(""); };
  return <div className="space-y-5"><SectionTitle eyebrow="AI tools / Ask GovGuide" title="A calmer way to understand government services." description="Ask in your own words. GovGuide will point you toward a relevant service, explain the usual next steps, and remind you what to verify." action={<div className="flex gap-2"><button onClick={() => void newConversation()} className="inline-flex items-center gap-2 rounded-xl bg-[#087E8B] px-3 py-2 text-xs font-bold text-white hover:bg-[#073B4C]"><Plus className="h-3.5 w-3.5" /> New Conversation</button><Pill tone="gold"><ShieldCheck className="mr-1.5 h-3 w-3" /> Source-aware guidance</Pill></div>} /><div className="grid gap-5 xl:grid-cols-[240px_1fr_260px]"><aside className="rounded-2xl border border-[#dde7e9] bg-white p-4 dark:border-[#1f6570] dark:bg-[#0a4050]"><div className="flex items-center justify-between"><div className="text-xs font-extrabold text-[#073B4C] dark:text-white">Recent Conversations</div><button onClick={() => void newConversation()} className="rounded-lg p-1.5 text-[#087E8B] hover:bg-[#e4f4f5]" aria-label="New conversation"><Plus className="h-4 w-4" /></button></div><div className="mt-3 flex items-center gap-2 rounded-lg border border-[#dde7e9] px-2 dark:border-[#2a6c76]"><Search className="h-3.5 w-3.5 text-slate-400" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search conversations..." className="w-full bg-transparent py-2 text-xs outline-none" /></div><div className="mt-4 max-h-[460px] space-y-1 overflow-y-auto">{visibleConversations.length ? visibleConversations.map(item => <div key={item.id} className={cn("group flex items-center gap-1 rounded-lg", activeConversationId === item.id ? "bg-[#e4f4f5] dark:bg-[#073B4C]" : "")}><button onClick={() => void onOpenConversation(item.id)} className="min-w-0 flex-1 px-2 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-300"><span className="block truncate">{item.title}</span><span className="mt-1 block text-[10px] font-normal text-slate-400">{new Date(item.updatedAt).toLocaleDateString()}</span></button><button onClick={() => void onUpdateConversation(item.id, { is_saved: !item.isSaved })} className="hidden rounded p-1 text-[#087E8B] group-hover:block" aria-label={item.isSaved ? "Unsave conversation" : "Save conversation"}>★</button><button onClick={() => void onDeleteConversation(item.id)} className="hidden rounded p-1 text-slate-300 hover:text-[#C94C4C] group-hover:block" aria-label="Delete conversation"><Trash2 className="h-3.5 w-3.5" /></button></div>) : <div className="py-6 text-center text-xs leading-5 text-slate-400">No conversations yet.<br />Ask GovGuide your first question.</div>}</div></aside><AIChatBox messages={messages} onSendMessage={sendQuestion} isLoading={askMutation.isPending} height="620px" placeholder="Ask about a government service..." emptyStateMessage="Start with a question about a South African government service." suggestedPrompts={quickPrompts} className="rounded-2xl border-[#dde7e9] dark:border-[#1f6570]" /><aside className="space-y-4"><div className="rounded-2xl bg-[#073B4C] p-5 text-white"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#F4C95D]"><Lightbulb className="h-4 w-4" /> Good to know</div><p className="mt-4 text-sm leading-6 text-white/70">Ask for one service at a time. For example: “What do I need for a Smart ID?”</p><div className="mt-5 space-y-3">{["Relevant service", "Documents to prepare", "Application steps", "Where to apply"].map(item => <div key={item} className="flex items-center gap-2 text-xs font-semibold text-white/75"><Check className="h-3.5 w-3.5 text-[#46B5C2]" />{item}</div>)}</div></div><div className="rounded-2xl border border-[#f0df9d] bg-[#fff9e8] p-5 text-xs leading-6 text-[#735800] dark:border-[#6b5a1b] dark:bg-[#403711] dark:text-[#f7df80]"><ShieldCheck className="mb-2 h-4 w-4" /><strong>Important:</strong> AI guidance is informational. Verify requirements, fees and deadlines with the relevant department.</div>{lastQuestion && <div className="rounded-2xl border border-[#dde7e9] bg-white p-5 dark:border-[#1f6570] dark:bg-[#0a4050]"><div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Current question</div><p className="mt-3 text-sm font-semibold leading-6 text-[#073B4C] dark:text-white">{lastQuestion}</p>{activeConversationId && <button onClick={() => { const title = window.prompt("Rename conversation", conversations.find(item => item.id === activeConversationId)?.title || "Conversation"); if (title?.trim()) void onUpdateConversation(activeConversationId, { title: title.trim() }); }} className="mt-4 text-xs font-bold text-[#087E8B]">Rename conversation</button>}</div>}</aside></div></div>;
}
function ContentGeneratorPage({ savedContent, onSave }: { savedContent: PersistentSavedContent[]; onSave: (content: { title: string; contentType: string; topic: string; audience: string; tone: string; content: string }) => Promise<void> }) {
  const [topic, setTopic] = useState("How to register a company in South Africa"); const [type, setType] = useState("Government Service Explanation"); const [audience, setAudience] = useState("General Public"); const [tone, setTone] = useState("Simple"); const [instructions, setInstructions] = useState("Use plain language and include a short checklist."); const [result, setResult] = useState("Your generated civic content will appear here. Choose a topic and generate a useful, citizen-friendly draft.");
  const mutation = trpc.ai.generateContent.useMutation({ onSuccess: data => setResult(data.content), onError: () => setResult(`Here is a citizen-friendly draft about ${topic}:\n\nStart by confirming the official requirements with the relevant government department. Gather your identity and supporting documents, follow the approved application steps, and keep your reference number. Ask GovGuide if you need help understanding a specific part of the process.`) });
  const generate = () => mutation.mutate({ topic, contentType: type, audience, tone, instructions });
  const save = async () => { try { await onSave({ title: topic, contentType: type, topic, audience, tone, content: result }); toast("Content saved", { description: "You can find it again in Saved Content." }); } catch (error) { toast("Unable to save content", { description: error instanceof Error ? error.message : "Please try again." }); } };
  return <div className="space-y-6"><SectionTitle eyebrow="AI tools / Content Generator" title="Make civic information easier to understand." description="Create service explanations, FAQs, notices and awareness posts that sound clear, useful and human." action={<Pill tone="teal"><PenLine className="mr-1.5 h-3 w-3" /> Civic content studio</Pill>} /><div className="grid gap-5 xl:grid-cols-[.74fr_1.26fr]"><div className="rounded-2xl border border-[#dde7e9] bg-white p-5 dark:border-[#1f6570] dark:bg-[#0a4050]"><div className="flex items-center gap-2 text-sm font-extrabold text-[#073B4C] dark:text-white"><SlidersHorizontal className="h-4 w-4 text-[#087E8B]" /> Brief</div><div className="mt-5 space-y-4"><label className="block text-xs font-bold text-slate-500">Topic<input value={topic} onChange={e => setTopic(e.target.value)} className="mt-2 w-full rounded-xl border border-[#dde7e9] bg-transparent px-3 py-3 text-sm outline-none focus:border-[#46B5C2] dark:border-[#2a6c76]" /></label><label className="block text-xs font-bold text-slate-500">Content type<Select value={type} onValueChange={setType}><SelectTrigger className="mt-2 h-11 rounded-xl border-[#dde7e9] dark:border-[#2a6c76]"><SelectValue /></SelectTrigger><SelectContent>{["Government Service Explanation", "Public Announcement", "Citizen Notice", "FAQ", "Service Summary", "Social Media Awareness Post"].map(item => <SelectItem value={item} key={item}>{item}</SelectItem>)}</SelectContent></Select></label><label className="block text-xs font-bold text-slate-500">Target audience<Select value={audience} onValueChange={setAudience}><SelectTrigger className="mt-2 h-11 rounded-xl border-[#dde7e9] dark:border-[#2a6c76]"><SelectValue /></SelectTrigger><SelectContent>{["General Public", "Young Adults", "Business Owners", "Job Seekers", "Parents", "Senior Citizens"].map(item => <SelectItem value={item} key={item}>{item}</SelectItem>)}</SelectContent></Select></label><label className="block text-xs font-bold text-slate-500">Tone<Select value={tone} onValueChange={setTone}><SelectTrigger className="mt-2 h-11 rounded-xl border-[#dde7e9] dark:border-[#2a6c76]"><SelectValue /></SelectTrigger><SelectContent>{["Simple", "Professional", "Friendly", "Informative"].map(item => <SelectItem value={item} key={item}>{item}</SelectItem>)}</SelectContent></Select></label><label className="block text-xs font-bold text-slate-500">Additional instructions<textarea value={instructions} onChange={e => setInstructions(e.target.value)} rows={4} className="mt-2 w-full resize-none rounded-xl border border-[#dde7e9] bg-transparent px-3 py-3 text-sm outline-none focus:border-[#46B5C2] dark:border-[#2a6c76]" /></label><button onClick={generate} disabled={mutation.isPending} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#087E8B] px-4 py-3 text-sm font-bold text-white hover:bg-[#073B4C] disabled:opacity-60">{mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}Generate content</button></div></div><div className="rounded-2xl border border-[#dde7e9] bg-white p-5 dark:border-[#1f6570] dark:bg-[#0a4050]"><div className="flex items-center justify-between gap-3"><div><div className="text-[10px] font-bold uppercase tracking-widest text-[#087E8B]">Generated draft</div><h3 className="mt-2 font-[Manrope] text-xl font-extrabold text-[#073B4C] dark:text-white">{topic}</h3></div><button onClick={generate} aria-label="Regenerate content" className="rounded-xl border border-[#dde7e9] p-2.5 text-slate-500 hover:border-[#46B5C2] hover:text-[#087E8B] dark:border-[#2a6c76]"><RefreshCw className={cn("h-4 w-4", mutation.isPending && "animate-spin")} /></button></div><div className="mt-5 min-h-[340px] whitespace-pre-wrap rounded-2xl bg-[#f7fafa] p-5 text-sm leading-7 text-slate-600 dark:bg-[#073B4C] dark:text-slate-300">{result}</div><div className="mt-4 flex flex-wrap justify-end gap-2"><button onClick={() => { navigator.clipboard?.writeText(result); toast("Copied to clipboard"); }} className="inline-flex items-center gap-2 rounded-xl border border-[#dde7e9] px-3 py-2 text-xs font-bold text-[#073B4C] hover:border-[#46B5C2] dark:border-[#2a6c76] dark:text-white"><Copy className="h-3.5 w-3.5" /> Copy</button><button onClick={save} className="inline-flex items-center gap-2 rounded-xl bg-[#087E8B] px-3 py-2 text-xs font-bold text-white hover:bg-[#073B4C]"><Save className="h-3.5 w-3.5" /> Save content</button></div></div></div></div>;
}

function SentimentAnalyzerPage({ result, setResult, onSave, onCreateReport }: { result: SentimentResult; setResult: React.Dispatch<React.SetStateAction<SentimentResult>>; onSave: (result: PersistentSentiment, inputType: string, sourceName?: string) => Promise<string>; onCreateReport: (report: { reportType: string; title: string; description: string; analysisId?: string | null; data: Record<string, unknown> }) => Promise<void> }) {
  const [feedback, setFeedback] = useState("The queue was extremely long but the staff member explained the process clearly.\n\nMy issue was resolved quickly and I received helpful updates.\n\nI had to come back twice because the document requirements were not clear."); const [mode, setMode] = useState<"text" | "csv">("text"); const total = Math.max(result.total, 1);
  const mutation = trpc.ai.analyzeSentiment.useMutation({ onSuccess: async data => { const next = data as SentimentResult; setResult(next); try { await onSave(next, mode, mode === "csv" ? "uploaded-feedback.csv" : "direct-text"); toast("Analysis complete", { description: "Review the results, then generate a report when ready." }); } catch (error) { toast("Analysis could not be saved", { description: error instanceof Error ? error.message : "Please try again." }); } }, onError: () => toast("Unable to analyse feedback", { description: "Please try again when the AI service is available." }) });
  const analyze = () => mutation.mutate({ feedback }); const generateReport = async () => { if (!result.total) { toast("Analyse feedback first", { description: "A report can be generated after an analysis is complete." }); return; } try { const analysisId = await onSave(result, mode, mode === "csv" ? "uploaded-feedback.csv" : "direct-text"); await onCreateReport({ reportType: "sentiment-analysis", title: "Citizen Feedback Analysis", description: "Sentiment analysis generated from citizen feedback.", analysisId, data: { total: result.total, positive: result.positive, neutral: result.neutral, negative: result.negative, score: result.score, themes: result.themes, insights: result.insights, analysisDate: new Date().toISOString(), source: mode === "csv" ? "uploaded-feedback.csv" : "direct text" } }); toast("Report saved", { description: "Open Reports to review the analysis." }); } catch (error) { toast("Unable to generate report", { description: error instanceof Error ? error.message : "Please try again." }); } };
  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (file) setFeedback(await file.text()); };
  const bars = [{ label: "Positive", value: result.positive, color: "#2E8B57" }, { label: "Neutral", value: result.neutral, color: "#F4C95D" }, { label: "Negative", value: result.negative, color: "#C94C4C" }];
  return <div className="space-y-6"><SectionTitle eyebrow="AI tools / Sentiment Analyzer" title="Turn citizen feedback into practical insight." description="Paste feedback or upload a CSV to identify sentiment, themes and the issues worth acting on." action={<button onClick={() => void generateReport()} className="inline-flex items-center gap-2 rounded-xl border border-[#dde7e9] bg-white px-3 py-2.5 text-xs font-bold text-[#073B4C] hover:border-[#46B5C2] dark:border-[#2a6c76] dark:bg-[#0a4050] dark:text-white"><FileBarChart2 className="h-4 w-4 text-[#087E8B]" /> Generate report</button>} /><div className="grid gap-5 xl:grid-cols-[.72fr_1.28fr]"><div className="rounded-2xl border border-[#dde7e9] bg-white p-5 dark:border-[#1f6570] dark:bg-[#0a4050]"><div className="flex gap-2 rounded-xl bg-[#f7fafa] p-1 dark:bg-[#073B4C]"><button onClick={() => setMode("text")} className={cn("flex-1 rounded-lg px-3 py-2 text-xs font-bold", mode === "text" ? "bg-white text-[#087E8B] shadow-sm dark:bg-[#0a4050]" : "text-slate-400")}>Text input</button><button onClick={() => setMode("csv")} className={cn("flex-1 rounded-lg px-3 py-2 text-xs font-bold", mode === "csv" ? "bg-white text-[#087E8B] shadow-sm dark:bg-[#0a4050]" : "text-slate-400")}>CSV upload</button></div>{mode === "text" ? <Textarea value={feedback} onChange={e => setFeedback(e.target.value)} className="mt-4 min-h-[300px] resize-none rounded-xl border-[#dde7e9] text-sm leading-6 dark:border-[#2a6c76]" placeholder="Paste citizen feedback here..." /> : <div className="mt-4 rounded-2xl border border-dashed border-[#b9dfe0] bg-[#f7fafa] p-8 text-center dark:bg-[#073B4C]"><Upload className="mx-auto h-8 w-8 text-[#087E8B]" /><div className="mt-3 text-sm font-bold text-[#073B4C] dark:text-white">Upload feedback CSV</div><p className="mt-2 text-xs text-slate-500">Expected columns include date, service, department and feedback.</p><label className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#087E8B] px-4 py-2.5 text-xs font-bold text-white"><Upload className="h-3.5 w-3.5" /> Choose CSV<input type="file" accept=".csv,text/csv" onChange={handleFile} className="hidden" /></label></div>}<button onClick={analyze} disabled={mutation.isPending} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#087E8B] px-4 py-3 text-sm font-bold text-white hover:bg-[#073B4C] disabled:opacity-60">{mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}Analyse feedback</button><div className="mt-4 flex items-start gap-2 text-[11px] leading-5 text-slate-400"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#2E8B57]" /> Use anonymised feedback where possible. Analysis results should be reviewed by a human before decisions are made.</div></div><div className="space-y-5"><div className="grid gap-3 sm:grid-cols-4"><StatCard icon={MessageCircle} label="Total feedback" value={String(result.total)} note="Records analysed" /><StatCard icon={TrendingUp} label="Positive" value={`${Math.round((result.positive / total) * 100)}%`} note={`${result.positive} records`} tone="green" /><StatCard icon={Activity} label="Neutral" value={`${Math.round((result.neutral / total) * 100)}%`} note={`${result.neutral} records`} tone="gold" /><StatCard icon={Lightbulb} label="Sentiment score" value={`${result.score}/100`} note="Overall signal" tone="teal" /></div><div className="grid gap-5 md:grid-cols-[.8fr_1.2fr]"><div className="rounded-2xl border border-[#dde7e9] bg-white p-5 dark:border-[#1f6570] dark:bg-[#0a4050]"><div className="text-sm font-extrabold text-[#073B4C] dark:text-white">Sentiment distribution</div><div className="mt-6 flex items-center justify-center"><div className="relative h-36 w-36 rounded-full" style={{ background: `conic-gradient(#2E8B57 0 ${result.positive / total * 100}%, #F4C95D ${result.positive / total * 100}% ${(result.positive + result.neutral) / total * 100}%, #C94C4C ${(result.positive + result.neutral) / total * 100}% 100%)` }}><div className="absolute inset-7 flex items-center justify-center rounded-full bg-white text-center dark:bg-[#0a4050]"><div><div className="text-2xl font-extrabold text-[#073B4C] dark:text-white">{result.score}</div><div className="text-[10px] text-slate-400">score</div></div></div></div></div><div className="mt-6 space-y-2">{bars.map(bar => <div key={bar.label} className="flex items-center justify-between text-xs"><span className="flex items-center gap-2 text-slate-500 dark:text-slate-300"><span className="h-2 w-2 rounded-full" style={{ background: bar.color }} />{bar.label}</span><span className="font-bold text-[#073B4C] dark:text-white">{bar.value}</span></div>)}</div></div><div className="rounded-2xl border border-[#dde7e9] bg-white p-5 dark:border-[#1f6570] dark:bg-[#0a4050]"><div className="text-sm font-extrabold text-[#073B4C] dark:text-white">Sentiment breakdown</div><div className="mt-6 space-y-5">{bars.map(bar => <div key={bar.label}><div className="mb-2 flex justify-between text-xs font-semibold"><span className="text-slate-500 dark:text-slate-300">{bar.label}</span><span className="text-[#073B4C] dark:text-white">{bar.value}</span></div><div className="h-2 overflow-hidden rounded-full bg-[#edf4f4] dark:bg-[#073B4C]"><div className="h-full rounded-full" style={{ width: `${bar.value / result.total * 100}%`, background: bar.color }} /></div></div>)}</div><div className="mt-7 rounded-xl bg-[#f7fafa] p-4 text-xs leading-6 text-slate-600 dark:bg-[#073B4C] dark:text-slate-300"><div className="mb-1 flex items-center gap-2 font-bold text-[#073B4C] dark:text-white"><Lightbulb className="h-4 w-4 text-[#F4C95D]" /> AI insight</div>{result.insights}</div></div></div><div className="grid gap-5 md:grid-cols-2"><div className="rounded-2xl border border-[#dde7e9] bg-white p-5 dark:border-[#1f6570] dark:bg-[#0a4050]"><div className="text-sm font-extrabold text-[#073B4C] dark:text-white">Key themes</div><div className="mt-4 flex flex-wrap gap-2">{result.themes.map(theme => <Pill key={theme} tone="teal">{theme}</Pill>)}</div><div className="mt-6 text-sm font-extrabold text-[#073B4C] dark:text-white">Most common complaints</div><ul className="mt-3 space-y-2 text-xs leading-5 text-slate-500 dark:text-slate-300">{result.complaints.map(item => <li className="flex gap-2" key={item}><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C94C4C]" />{item}</li>)}</ul></div><div className="rounded-2xl border border-[#dde7e9] bg-white p-5 dark:border-[#1f6570] dark:bg-[#0a4050]"><div className="text-sm font-extrabold text-[#073B4C] dark:text-white">Positive observations</div><ul className="mt-4 space-y-3 text-xs leading-5 text-slate-500 dark:text-slate-300">{result.observations.map(item => <li className="flex gap-2" key={item}><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#2E8B57]" />{item}</li>)}</ul><button onClick={async () => { try { await onCreateReport({ reportType: "sentiment-analysis", title: "Sentiment analysis report", description: "Saved analysis of citizen feedback.", data: { ...result } }); toast("Report saved", { description: "Your report is now available in your account." }); } catch (error) { toast("Unable to save report", { description: error instanceof Error ? error.message : "Please try again." }); } }} className="mt-6 inline-flex items-center gap-2 rounded-xl border border-[#dde7e9] px-3 py-2 text-xs font-bold text-[#073B4C] hover:border-[#46B5C2] dark:border-[#2a6c76] dark:text-white"><Download className="h-3.5 w-3.5" /> Download report</button></div></div></div></div></div>;
}

function ChecklistPage({ checklist, onToggle, onDelete, onDeleteChecklist, navigate }: { checklist: ChecklistItem[]; onToggle: (id: string, completed: boolean) => Promise<void>; onDelete: (id: string) => Promise<void>; onDeleteChecklist: (id: string) => Promise<void>; navigate: (path: string) => void }) {
  const completed = checklist.filter(item => item.done).length; const toggle = (id: string) => { const item = checklist.find(entry => entry.id === id); if (item) void onToggle(id, !item.done); }; const checklistIds = Array.from(new Set(checklist.map(item => item.checklistId)));
  return <div className="space-y-6"><SectionTitle eyebrow="My checklist" title="Turn guidance into your next few steps." description="Add services from anywhere in GovGuide, then keep your progress visible until you’re done." action={<div className="flex gap-2"><button onClick={() => navigate("/services")} className="inline-flex items-center gap-2 rounded-xl bg-[#087E8B] px-3.5 py-2.5 text-xs font-bold text-white hover:bg-[#073B4C]"><Plus className="h-4 w-4" /> Add a service</button>{checklistIds.length > 0 && <button onClick={() => { if (window.confirm("Delete all checklist services?")) void Promise.all(checklistIds.map(id => onDeleteChecklist(id))); }} className="inline-flex items-center gap-2 rounded-xl border border-[#f0caca] px-3.5 py-2.5 text-xs font-bold text-[#C94C4C]"><Trash2 className="h-4 w-4" /> Delete checklist</button>}</div>} /><div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]"><div className="rounded-2xl bg-[#073B4C] p-6 text-white"><div className="flex items-start justify-between"><div><div className="text-[10px] font-bold uppercase tracking-widest text-[#F4C95D]">Your progress</div><div className="mt-4 text-5xl font-extrabold">{completed}<span className="text-2xl text-white/35">/{checklist.length}</span></div><div className="mt-2 text-sm text-white/60">tasks completed</div></div><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-[#F4C95D]"><ClipboardCheck className="h-6 w-6" /></div></div><div className="mt-8 h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-[#F4C95D] transition-all" style={{ width: checklist.length ? `${completed / checklist.length * 100}%` : "0%" }} /></div><div className="mt-3 flex justify-between text-[11px] text-white/45"><span>Started</span><span>{checklist.length ? Math.round(completed / checklist.length * 100) : 0}% complete</span></div></div><div className="rounded-2xl border border-[#dde7e9] bg-white p-5 dark:border-[#1f6570] dark:bg-[#0a4050]"><div className="flex items-center justify-between"><div><div className="text-[10px] font-bold uppercase tracking-widest text-[#087E8B]">Your saved tasks</div><h3 className="mt-2 font-[Manrope] text-lg font-extrabold text-[#073B4C] dark:text-white">{checklist.length ? "Keep moving" : "No checklist items yet"}</h3></div><Pill tone="gold">{checklist.length ? "In progress" : "Start with a service"}</Pill></div>{checklist.length ? <div className="mt-5 space-y-3">{checklist.map(item => <div key={item.id} className="flex items-center gap-3 rounded-xl border border-[#edf4f4] p-3 dark:border-[#1f6570]"><Checkbox checked={item.done} onCheckedChange={() => void toggle(item.id)} aria-label={`Mark ${item.title} ${item.done ? "incomplete" : "complete"}`} /><div className="min-w-0 flex-1"><div className={cn("text-sm font-semibold", item.done ? "text-slate-400 line-through" : "text-[#073B4C] dark:text-white")}>{item.title}</div><div className="mt-1 text-[11px] text-slate-400">{item.detail}</div></div><button onClick={() => navigate(`/services/${item.service}`)} className="rounded-lg p-2 text-slate-400 hover:bg-[#e4f4f5] hover:text-[#087E8B]"><ArrowUpRight className="h-4 w-4" /></button><button onClick={() => void onDelete(item.id)} aria-label={`Delete ${item.title}`} className="rounded-lg p-2 text-slate-300 hover:bg-[#fbeaea] hover:text-[#C94C4C]"><Trash2 className="h-4 w-4" /></button></div>)}</div> : <div className="mt-6 rounded-xl bg-[#f7fafa] p-5 text-sm leading-6 text-slate-500 dark:bg-[#073B4C] dark:text-slate-300">You haven’t added any government services to your checklist yet.</div>}</div></div><div className="flex items-start gap-3 rounded-2xl border border-[#f0df9d] bg-[#fff9e8] p-4 text-xs leading-6 text-[#735800] dark:border-[#6b5a1b] dark:bg-[#403711] dark:text-[#f7df80]"><MessageCircle className="mt-1 h-4 w-4 shrink-0" /><span>Need help with a step? <button onClick={() => navigate("/ask-govguide")} className="font-bold underline">Ask GovGuide</button> with the service name and we’ll help you unpack it.</span></div></div>;
}

function SavedContentPage({ savedContent, onDelete }: { savedContent: PersistentSavedContent[]; onDelete: (id: string) => Promise<void> }) {
  return <div className="space-y-6"><SectionTitle eyebrow="Saved content" title="Your civic content library." description="Keep useful explanations, notices and drafts close by so you can revisit or share them when needed." action={<Pill tone="teal"><Bookmark className="mr-1.5 h-3 w-3" /> {savedContent.length} saved items</Pill>} />{savedContent.length === 0 ? <div className="rounded-2xl border border-dashed border-[#b9dfe0] bg-white p-12 text-center dark:bg-[#0a4050]"><Bookmark className="mx-auto h-8 w-8 text-[#46B5C2]" /><h3 className="mt-4 font-bold text-[#073B4C] dark:text-white">You haven’t saved any content yet.</h3><p className="mt-1 text-sm text-slate-500">Generate a citizen-friendly draft, then choose Save Content.</p></div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{savedContent.map(item => <div key={item.id} className="flex min-h-[220px] flex-col rounded-2xl border border-[#dde7e9] bg-white p-5 shadow-[0_8px_28px_rgba(7,59,76,.035)] dark:border-[#1f6570] dark:bg-[#0a4050]"><div className="flex items-start justify-between"><Pill tone="gold">{item.type}</Pill><button onClick={() => void onDelete(item.id)} aria-label={`Delete ${item.title}`} className="rounded-lg p-1.5 text-slate-300 hover:bg-[#fbeaea] hover:text-[#C94C4C]"><Trash2 className="h-4 w-4" /></button></div><h3 className="mt-5 font-[Manrope] text-lg font-extrabold text-[#073B4C] dark:text-white">{item.title}</h3><div className="mt-1 text-[11px] font-semibold text-[#087E8B]">{item.topic} · {item.date}</div><p className="mt-4 line-clamp-4 text-sm leading-6 text-slate-500 dark:text-slate-300">{item.content}</p><div className="mt-auto flex gap-2 pt-5"><button onClick={() => { navigator.clipboard?.writeText(item.content); toast("Copied to clipboard"); }} className="inline-flex items-center gap-1.5 rounded-lg border border-[#dde7e9] px-3 py-2 text-xs font-bold text-[#073B4C] hover:border-[#46B5C2] dark:border-[#2a6c76] dark:text-white"><Copy className="h-3.5 w-3.5" /> Copy</button><button onClick={() => toast("Content opened", { description: item.title })} className="inline-flex items-center gap-1.5 rounded-lg bg-[#087E8B] px-3 py-2 text-xs font-bold text-white hover:bg-[#073B4C]"><ArrowUpRight className="h-3.5 w-3.5" /> Open</button></div></div>)}</div>}</div>;
}

function OfficesPage({ navigate }: { navigate: (path: string) => void }) {
  const [query, setQuery] = useState(""); const [department, setDepartment] = useState("All departments"); const [selected, setSelected] = useState<Office | null>(offices[0]); const departments = ["All departments", ...Array.from(new Set(offices.map(o => o.department)))]; const filtered = offices.filter(office => (office.name.toLowerCase().includes(query.toLowerCase()) || office.address.toLowerCase().includes(query.toLowerCase()) || office.services.some(s => s.toLowerCase().includes(query.toLowerCase()))) && (department === "All departments" || office.department === department));
  return <div className="space-y-6"><SectionTitle eyebrow="Nearby offices" title="Find the right place to take action." description="Search demo office locations, filter by department, and view details before you go." action={<Pill tone="green"><MapPin className="mr-1.5 h-3 w-3" /> Pretoria area</Pill>} /><div className="grid gap-5 xl:grid-cols-[1.05fr_.95fr]"><div className="space-y-4"><div className="grid gap-3 sm:grid-cols-[1fr_200px]"><div className="flex items-center gap-3 rounded-xl border border-[#dde7e9] bg-white px-3 dark:border-[#2a6c76] dark:bg-[#0a4050]"><Search className="h-4 w-4 text-slate-400" /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search offices or services..." className="w-full bg-transparent py-3 text-sm outline-none" /></div><Select value={department} onValueChange={setDepartment}><SelectTrigger className="h-11 rounded-xl border-[#dde7e9] bg-white dark:border-[#2a6c76] dark:bg-[#0a4050]"><SelectValue /></SelectTrigger><SelectContent>{departments.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div><div className="space-y-3">{filtered.map(office => <button key={office.name} onClick={() => setSelected(office)} className={cn("w-full rounded-2xl border bg-white p-4 text-left transition hover:border-[#46B5C2] dark:bg-[#0a4050]", selected?.name === office.name ? "border-[#087E8B] shadow-[0_8px_22px_rgba(8,126,139,.1)]" : "border-[#dde7e9] dark:border-[#1f6570]")}><div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e4f4f5] text-[#087E8B]"><Building2 className="h-5 w-5" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><div className="font-bold text-[#073B4C] dark:text-white">{office.name}</div><Pill tone="teal">{office.distance}</Pill></div><div className="mt-1 text-xs text-slate-500 dark:text-slate-300">{office.department}</div><div className="mt-3 flex items-center gap-2 text-xs text-slate-500"><MapPin className="h-3.5 w-3.5 text-[#087E8B]" />{office.address}</div><div className="mt-2 flex flex-wrap gap-1.5">{office.services.map(service => <span key={service} className="rounded-md bg-[#f7fafa] px-2 py-1 text-[10px] font-semibold text-slate-500 dark:bg-[#073B4C] dark:text-slate-300">{service}</span>)}</div></div></div></button>)}</div></div><div className="rounded-2xl border border-[#dde7e9] bg-white p-4 dark:border-[#1f6570] dark:bg-[#0a4050]"><MiniMap selected={selected} onSelect={setSelected} />{selected && <div className="mt-4 rounded-2xl bg-[#f7fafa] p-5 dark:bg-[#073B4C]"><div className="flex items-start justify-between gap-4"><div><Pill tone="green">Open in demo</Pill><h3 className="mt-3 font-[Manrope] text-lg font-extrabold text-[#073B4C] dark:text-white">{selected.name}</h3></div><button onClick={() => toast("Directions ready", { description: `Directions to ${selected.name} will open in a maps provider in production.` })} className="rounded-xl bg-[#087E8B] p-2.5 text-white hover:bg-[#073B4C]"><Navigation className="h-4 w-4" /></button></div><div className="mt-4 space-y-3 text-xs text-slate-500 dark:text-slate-300"><div className="flex gap-2"><MapPin className="h-4 w-4 shrink-0 text-[#087E8B]" />{selected.address}</div><div className="flex gap-2"><Clock3 className="h-4 w-4 shrink-0 text-[#087E8B]" />{selected.hours}</div><div className="flex gap-2"><PhoneIcon /><span>Contact details should be verified on the official department site.</span></div></div><button onClick={() => navigate("/ask-govguide")} className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-[#087E8B]">Ask about this office <ArrowRight className="h-3.5 w-3.5" /></button></div>}</div></div></div>;
}
function PhoneIcon() { return <MessageCircle className="h-4 w-4 shrink-0 text-[#087E8B]" />; }

function SettingsPage() {
  const { theme, toggleTheme } = useTheme(); const { user, profile, updateProfile } = useSupabaseAuth(); const [fullName, setFullName] = useState(profile?.full_name || user?.user_metadata?.full_name || ""); const [notifications, setNotifications] = useState(true); return <div className="space-y-6"><SectionTitle eyebrow="Settings" title="Make GovGuide work your way." description="Manage your profile, appearance, notifications and privacy preferences." /><div className="grid gap-5 lg:grid-cols-[.65fr_1.35fr]"><div className="rounded-2xl bg-[#073B4C] p-6 text-white"><div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F4C95D] text-2xl font-extrabold text-[#073B4C]">D</div><h2 className="mt-5 font-[Manrope] text-xl font-extrabold">{fullName || "GovGuide citizen"}</h2><p className="mt-1 text-sm text-white/55">{user?.email || ""}</p><div className="mt-8 border-t border-white/10 pt-5 text-xs leading-6 text-white/55">Your profile and private activity are protected by Supabase Auth and Row Level Security.</div></div><div className="space-y-4"><div className="rounded-2xl border border-[#dde7e9] bg-white p-5 dark:border-[#1f6570] dark:bg-[#0a4050]"><div className="flex items-center gap-2 text-sm font-extrabold text-[#073B4C] dark:text-white"><UserRound className="h-4 w-4 text-[#087E8B]" /> Account</div><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-xs font-bold text-slate-500">Full name<input value={fullName} onChange={event => setFullName(event.target.value)} className="mt-2 w-full rounded-xl border border-[#dde7e9] bg-transparent px-3 py-3 text-sm outline-none focus:border-[#46B5C2] dark:border-[#2a6c76]" /></label><label className="text-xs font-bold text-slate-500">Email<input value={user?.email || ""} readOnly className="mt-2 w-full rounded-xl border border-[#dde7e9] bg-transparent px-3 py-3 text-sm outline-none focus:border-[#46B5C2] dark:border-[#2a6c76]" /></label></div><button onClick={async () => { const result = await updateProfile(fullName.trim()); toast(result.error ? "Unable to save profile" : "Profile saved", { description: result.error?.message || "Your name is now synced across GovGuide." }); }} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#087E8B] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#073B4C]"><Save className="h-3.5 w-3.5" /> Save changes</button></div><div className="rounded-2xl border border-[#dde7e9] bg-white p-5 dark:border-[#1f6570] dark:bg-[#0a4050]"><div className="flex items-center gap-2 text-sm font-extrabold text-[#073B4C] dark:text-white"><Sun className="h-4 w-4 text-[#087E8B]" /> Appearance</div><div className="mt-4 flex items-center justify-between rounded-xl bg-[#f7fafa] p-4 dark:bg-[#073B4C]"><div><div className="text-sm font-bold text-[#073B4C] dark:text-white">Theme</div><div className="mt-1 text-xs text-slate-500 dark:text-slate-300">Currently using {theme} mode.</div></div><button onClick={() => toggleTheme?.()} className="inline-flex items-center gap-2 rounded-xl border border-[#dde7e9] bg-white px-3 py-2 text-xs font-bold text-[#073B4C] dark:border-[#2a6c76] dark:bg-[#0a4050] dark:text-white">{theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}{theme === "dark" ? "Light" : "Dark"}</button></div></div><div className="rounded-2xl border border-[#dde7e9] bg-white p-5 dark:border-[#1f6570] dark:bg-[#0a4050]"><div className="flex items-center gap-2 text-sm font-extrabold text-[#073B4C] dark:text-white"><Bell className="h-4 w-4 text-[#087E8B]" /> Notifications</div><div className="mt-4 space-y-3">{["AI activity", "Report notifications", "General notifications"].map((item, index) => <div key={item} className="flex items-center justify-between rounded-xl border border-[#edf4f4] p-3 dark:border-[#1f6570]"><div className="text-sm font-semibold text-[#073B4C] dark:text-white">{item}</div><button onClick={() => setNotifications(!notifications)} className={cn("relative h-6 w-11 rounded-full transition", notifications ? "bg-[#087E8B]" : "bg-slate-200 dark:bg-[#155b67]")}><span className={cn("absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition", notifications ? "left-6" : "left-1")} /></button></div>)}</div></div><div className="rounded-2xl border border-[#dde7e9] bg-white p-5 dark:border-[#1f6570] dark:bg-[#0a4050]"><div className="flex items-center gap-2 text-sm font-extrabold text-[#073B4C] dark:text-white"><ShieldCheck className="h-4 w-4 text-[#087E8B]" /> Privacy</div><p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-300">Review and manage how your saved content, conversations and analyses are used. Connect these controls to persistence and retention policies before production launch.</p><button onClick={() => toast("Privacy controls", { description: "Privacy settings are ready for backend policy wiring." })} className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-[#087E8B]">Review privacy controls <ArrowRight className="h-3.5 w-3.5" /></button></div></div></div></div>; }

export default function Home() {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const data = useSupabaseData(user?.id);
  const [sentiment, setSentiment] = useState<SentimentResult>(initialSentiment);
  const [pendingQuestion, setPendingQuestion] = useState("");
  const navigate = (path: string) => setLocation(path);

  useEffect(() => {
    if (data.sentiment) setSentiment(data.sentiment);
  }, [data.sentiment]);

  useEffect(() => {
    const question = new URLSearchParams(window.location.search).get("question");
    if (question && location === "/ask-govguide") setPendingQuestion(question);
  }, [location]);

  const addToChecklist = async (service: Service) => {
    try {
      const result = await data.addService({ slug: service.slug, name: service.name, steps: service.steps, documents: service.documents });
      toast(result.added ? "Added to checklist" : "Already in your checklist", { description: result.added ? `${service.name} and its tasks are now saved.` : "Open My Checklist to continue where you left off." });
    } catch (error) {
      toast("Unable to add service", { description: error instanceof Error ? error.message : "Please try again." });
    }
  };

  if (location === "/") return <Landing navigate={navigate} />;
  const serviceSlug = location.startsWith("/services/") ? location.split("/")[2] : "";
  const service = services.find(item => item.slug === serviceSlug);
  const title = location === "/dashboard" ? "Dashboard" : location === "/services" ? "Government Services" : location === "/services-map" ? "Services Map" : location.startsWith("/services/") ? service?.name || "Service details" : location === "/ask-govguide" ? "Ask GovGuide" : location === "/content-generator" ? "Content Generator" : location === "/sentiment-analyzer" ? "Sentiment Analyzer" : location === "/reports" ? "Reports" : location === "/checklist" ? "My Checklist" : location === "/saved-content" ? "Saved Content" : location === "/nearby-offices" ? "Nearby Offices" : "Settings";

  let content: React.ReactNode;
  if (location === "/dashboard") content = <Dashboard navigate={navigate} checklist={data.checklist} addToChecklist={addToChecklist} user={user} stats={data.stats} activity={data.activity} />;
  else if (location === "/services") content = <ServicesPage navigate={navigate} addToChecklist={addToChecklist} />;
  else if (location === "/services-map") content = <GovernmentServicesMap />;
  else if (service) content = <ServiceDetailPage service={service} navigate={navigate} addToChecklist={addToChecklist} />;
  else if (location === "/ask-govguide") content = <AskPage pendingQuestion={pendingQuestion} clearPending={() => setPendingQuestion("")} onPersist={data.recordQuestion} initialMessages={data.conversationMessages} conversations={data.conversations} activeConversationId={data.activeConversationId} onNewConversation={data.newConversation} onOpenConversation={data.loadConversation} onUpdateConversation={data.updateConversation} onDeleteConversation={data.deleteConversation} />;
  else if (location === "/content-generator") content = <ContentGeneratorPage savedContent={data.savedContent} onSave={data.saveContent} />;
  else if (location === "/sentiment-analyzer") content = <SentimentAnalyzerPage result={sentiment} setResult={setSentiment} onSave={data.saveSentiment} onCreateReport={data.createReport} />;
  else if (location === "/reports") content = <ReportsPage reports={data.reports} onDelete={data.deleteReport} navigate={navigate} />;
  else if (location === "/checklist") content = <ChecklistPage checklist={data.checklist} onToggle={data.toggleItem} onDelete={data.deleteChecklistItem} onDeleteChecklist={data.deleteChecklist} navigate={navigate} />;
  else if (location === "/saved-content") content = <SavedContentPage savedContent={data.savedContent} onDelete={data.deleteSavedContent} />;
  else if (location === "/nearby-offices") content = <GovernmentServicesMap />;
  else content = <SettingsPage />;

  return <AppShell title={title} location={location} navigate={navigate} user={user} logout={logout}>{data.loading && <div className="mb-4 rounded-xl border border-[#b9dfe0] bg-[#e4f4f5] px-4 py-3 text-xs font-semibold text-[#075e68]">Loading your saved GovGuide data…</div>}{data.error && <div role="alert" className="mb-4 rounded-xl border border-[#efcaca] bg-[#fff2f2] px-4 py-3 text-xs font-semibold text-[#a53838]">Unable to load your saved data. Please refresh and try again.</div>}{content}</AppShell>;
}
