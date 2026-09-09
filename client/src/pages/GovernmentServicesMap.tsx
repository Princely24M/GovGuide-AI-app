import { MapView } from "@/components/Map";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { allOrganisations, govMapServices, provinces, serviceCategories, type GovMapService, type GovServiceLocation } from "@shared/govguide-map";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Car,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Clock3,
  Compass,
  Crosshair,
  ExternalLink,
  Filter,
  Globe2,
  GraduationCap,
  HeartPulse,
  Info,
  Landmark,
  List,
  Loader2,
  Map as MapIcon,
  MapPin,
  Maximize2,
  Navigation,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  SmartphoneNfc,
  Target,
  TrainFront,
  UserRound,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

const SOUTH_AFRICA = { lat: -30.5595, lng: 22.9375 };
const PRETORIA = { lat: -25.7479, lng: 28.2293 };

const serviceIcons: Record<GovMapService["icon"], LucideIcon> = {
  business: Building2,
  transport: Car,
  identity: SmartphoneNfc,
  social: HeartPulse,
  travel: Globe2,
  labour: BriefcaseBusiness,
};

function distanceKm(from: { lat: number; lng: number }, to: Pick<GovServiceLocation, "latitude" | "longitude">) {
  if (to.latitude === undefined || to.longitude === undefined) return undefined;
  const toRad = (value: number) => value * Math.PI / 180;
  const dLat = toRad(to.latitude - from.lat);
  const dLng = toRad(to.longitude - from.lng);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(from.lat)) * Math.cos(toRad(to.latitude)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function serviceMatchesQuery(query: string, service: GovMapService) {
  const normalized = query.toLowerCase();
  const aliases: Record<string, string[]> = {
    "business-registration": ["company", "register", "registration", "cipc", "business"],
    "driving-licence": ["driver", "driving", "licence test", "license test"],
    "learners-licence": ["learner", "learners", "learners licence"],
    "vehicle-licence-renewal": ["vehicle", "car licence", "car license", "renew", "disc"],
    "smart-id": ["smart id", "id card", "identity", "home affairs"],
    "social-grants": ["sassa", "grant", "social assistance", "social relief"],
    passport: ["passport", "travel"],
    "uif-benefits": ["uif", "employment", "labour", "unemployment"],
  };
  return normalized.includes(service.name.toLowerCase()) || normalized.includes(service.shortName.toLowerCase()) || aliases[service.id]?.some(alias => normalized.includes(alias));
}

function ServiceIcon({ service, className }: { service: GovMapService; className?: string }) {
  const Icon = serviceIcons[service.icon];
  return <Icon className={className} aria-hidden="true" />;
}

function ServiceCard({ service, selected, onSelect }: { service: GovMapService; selected: boolean; onSelect: () => void }) {
  return <button onClick={onSelect} className={cn("group flex w-full items-start gap-3 rounded-2xl border bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-[#46B5C2] hover:shadow-[0_10px_26px_rgba(7,59,76,.08)] dark:bg-[#0a4050]", selected ? "border-[#087E8B] bg-[#f1fbfb] shadow-[0_8px_22px_rgba(8,126,139,.12)] dark:border-[#46B5C2] dark:bg-[#073B4C]" : "border-[#dde7e9] dark:border-[#1f6570]")}><div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition", selected ? "bg-[#087E8B] text-white" : "bg-[#e4f4f5] text-[#087E8B] group-hover:bg-[#087E8B] group-hover:text-white")}><ServiceIcon service={service} className="h-5 w-5" /></div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div className="font-[Manrope] text-sm font-extrabold text-[#073B4C] dark:text-white">{service.shortName}</div>{selected && <CheckCircle2 className="h-4 w-4 shrink-0 text-[#087E8B]" />}</div><div className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-300">{service.description}</div><div className="mt-2 text-[10px] font-bold text-[#087E8B]">{service.organisation} · {service.category}</div></div></button>;
}

function LocationCard({ location, service, userCoords, selected, onSelect, onDirections }: { location: GovServiceLocation; service: GovMapService; userCoords: { lat: number; lng: number } | null; selected: boolean; onSelect: () => void; onDirections: () => void }) {
  const distance = userCoords ? distanceKm(userCoords, location) : undefined;
  return <div className={cn("rounded-2xl border bg-white p-4 transition dark:bg-[#0a4050]", selected ? "border-[#087E8B] shadow-[0_10px_26px_rgba(8,126,139,.1)]" : "border-[#dde7e9] dark:border-[#1f6570]")}><button onClick={onSelect} className="w-full text-left"><div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e4f4f5] text-[#087E8B]"><ServiceIcon service={service} className="h-5 w-5" /></div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div className="font-[Manrope] text-sm font-extrabold text-[#073B4C] dark:text-white">{location.name}</div>{location.verified ? <Badge className="shrink-0 bg-[#e7f4ec] text-[10px] text-[#2E8B57] hover:bg-[#e7f4ec]">Verified</Badge> : <Badge className="shrink-0 bg-[#fff5d5] text-[10px] text-[#735800] hover:bg-[#fff5d5]">Demo</Badge>}</div><div className="mt-1 text-xs font-semibold text-[#087E8B]">{location.organisation}</div><div className="mt-2 flex items-start gap-2 text-xs leading-5 text-slate-500 dark:text-slate-300"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#087E8B]" />{location.city}, {location.province}</div><div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-semibold text-slate-400"><span className="rounded-md bg-[#f7fafa] px-2 py-1 dark:bg-[#073B4C]">{distance !== undefined ? `${distance.toFixed(1)} km away` : "Distance unavailable"}</span><span className="rounded-md bg-[#f7fafa] px-2 py-1 dark:bg-[#073B4C]">{location.openingHours || "Hours unavailable"}</span></div></div></div></button><div className="mt-4 flex gap-2"><button onClick={onSelect} className="flex-1 rounded-xl border border-[#dde7e9] px-3 py-2 text-xs font-bold text-[#073B4C] hover:border-[#46B5C2] dark:border-[#2a6c76] dark:text-white">View details</button><button onClick={onDirections} className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#087E8B] px-3 py-2 text-xs font-bold text-white hover:bg-[#073B4C]"><Navigation className="h-3.5 w-3.5" /> Directions</button></div></div>;
}

function LocationDetails({ location, service, userCoords, onDirections, onClose }: { location: GovServiceLocation; service: GovMapService; userCoords: { lat: number; lng: number } | null; onDirections: () => void; onClose: () => void }) {
  const distance = userCoords ? distanceKm(userCoords, location) : undefined;
  return <div className="rounded-2xl border border-[#dde7e9] bg-white p-5 shadow-[0_10px_30px_rgba(7,59,76,.08)] dark:border-[#1f6570] dark:bg-[#0a4050]"><div className="flex items-start justify-between gap-4"><div className="flex items-start gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e4f4f5] text-[#087E8B]"><ServiceIcon service={service} className="h-5 w-5" /></div><div><div className="text-[10px] font-bold uppercase tracking-widest text-[#087E8B]">Selected service location</div><h3 className="mt-1 font-[Manrope] text-lg font-extrabold text-[#073B4C] dark:text-white">{location.name}</h3></div></div><button onClick={onClose} aria-label="Close location details" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"><X className="h-4 w-4" /></button></div><div className="mt-5 grid gap-3 text-xs text-slate-600 dark:text-slate-300 sm:grid-cols-2"><DetailRow icon={Building2} label="Organisation" value={location.organisation} /><DetailRow icon={Landmark} label="Department" value={location.department} /><DetailRow icon={MapPin} label="Service area" value={`${location.city}, ${location.province}${location.municipality ? ` · ${location.municipality}` : ""}`} /><DetailRow icon={Clock3} label="Opening hours" value={location.openingHours || "Not available"} /><DetailRow icon={Compass} label="Distance" value={distance !== undefined ? `${distance.toFixed(1)} km from your location` : "Enable location to calculate"} /><DetailRow icon={Info} label="Verification" value={location.verified ? `Verified${location.lastVerified ? ` · ${location.lastVerified}` : ""}` : "Demo record — not verified"} /></div>{location.address && <div className="mt-4 rounded-xl bg-[#f7fafa] p-3 text-xs leading-5 text-slate-500 dark:bg-[#073B4C] dark:text-slate-300"><span className="font-bold text-[#073B4C] dark:text-white">Address:</span> {location.address}</div>}<div className="mt-4 rounded-xl border border-[#f0df9d] bg-[#fff9e8] p-3 text-[11px] leading-5 text-[#735800] dark:border-[#6b5a1b] dark:bg-[#403711] dark:text-[#f7df80]"><ShieldCheck className="mr-1 inline h-3.5 w-3.5" />{location.dataNote}</div><div className="mt-4 flex flex-wrap gap-2"><button onClick={onDirections} className="inline-flex items-center gap-2 rounded-xl bg-[#087E8B] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#073B4C]"><Navigation className="h-3.5 w-3.5" /> Get directions</button><button onClick={() => toast("Details view", { description: "Connect this action to a persisted office profile in the next release." })} className="inline-flex items-center gap-2 rounded-xl border border-[#dde7e9] px-4 py-2.5 text-xs font-bold text-[#073B4C] hover:border-[#46B5C2] dark:border-[#2a6c76] dark:text-white"><ExternalLink className="h-3.5 w-3.5" /> View details</button></div></div>;
}

function DetailRow({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) { return <div className="flex gap-2"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#087E8B]" /><div><div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</div><div className="mt-1 font-semibold text-[#073B4C] dark:text-white">{value}</div></div></div>; }

export default function GovernmentServicesMap() {
  const [locationData, setLocationData] = useState<GovServiceLocation[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState("");
  useEffect(() => {
    let active = true;
    (async () => {
      const [officesResult, departmentsResult, servicesResult] = await Promise.all([
        supabase.from("offices").select("id,department_id,name,address,city,province,postal_code,latitude,longitude,phone,email,opening_hours,services_supported,official_source_url,verification_status,last_verified_at"),
        supabase.from("departments").select("id,name"),
        supabase.from("services").select("id,slug,department_id"),
      ]);
      if (!active) return;
      const firstError = officesResult.error || departmentsResult.error || servicesResult.error;
      if (firstError) { setDataError("We couldn't load government office data. Please try again."); setDataLoading(false); return; }
      const departments = new Map((departmentsResult.data ?? []).map(department => [String(department.id), department.name]));
      const serviceIdsByDepartment = new Map<string, string[]>();
      for (const service of servicesResult.data ?? []) {
        const key = String(service.department_id);
        serviceIdsByDepartment.set(key, [...(serviceIdsByDepartment.get(key) ?? []), service.slug || String(service.id)]);
      }
      setLocationData((officesResult.data ?? []).map(office => {
        const department = departments.get(String(office.department_id)) ?? "Government office";
        const status = office.verification_status || "needs_review";
        return { id: String(office.id), name: office.name, organisation: department, department, serviceIds: serviceIdsByDepartment.get(String(office.department_id)) ?? [], province: office.province, city: office.city, address: office.address ?? undefined, latitude: office.latitude == null ? undefined : Number(office.latitude), longitude: office.longitude == null ? undefined : Number(office.longitude), phone: office.phone ?? undefined, email: office.email ?? undefined, website: office.official_source_url ?? undefined, openingHours: office.opening_hours ? String(office.opening_hours) : undefined, verified: status === "verified", lastVerified: office.last_verified_at ? new Date(office.last_verified_at).toLocaleDateString() : undefined, dataNote: status === "verified" ? "Verified against an authoritative source." : `Verification status: ${status}. Confirm details with the responsible organisation.` };
      }));
      setDataLoading(false);
    })();
    return () => { active = false; };
  }, []);
  const organisations = useMemo(() => Array.from(new Set(locationData.map(location => location.organisation))).sort(), [locationData]);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof serviceCategories)[number]>("All");
  const [organisation, setOrganisation] = useState("All organisations");
  const [province, setProvince] = useState("All provinces");
  const [city, setCity] = useState("");
  const [distanceLimit, setDistanceLimit] = useState("Any distance");
  const [sort, setSort] = useState("Nearest");
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState("");
  const [locating, setLocating] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "map">("list");
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<any[]>([]);

  const selectedService = govMapServices.find(service => service.id === selectedServiceId) ?? null;
  const queryMatch = useMemo(() => govMapServices.find(service => serviceMatchesQuery(query, service)), [query]);

  const filteredLocations = useMemo(() => {
    const reference = userCoords ?? PRETORIA;
    const maxDistance = distanceLimit === "Any distance" ? Infinity : Number(distanceLimit.replace(" km", ""));
    const locations = locationData.filter(location => {
      const matchesService = !selectedServiceId || location.serviceIds.includes(selectedServiceId);
      const matchesCategory = category === "All" || (selectedServiceId ? selectedService?.category === category : govMapServices.some(service => service.category === category && location.serviceIds.includes(service.id)));
      const matchesOrganisation = organisation === "All organisations" || location.organisation === organisation;
      const matchesProvince = province === "All provinces" || location.province === province;
      const matchesCity = !city.trim() || location.city.toLowerCase().includes(city.trim().toLowerCase());
      const distance = distanceKm(reference, location);
      const matchesDistance = distance === undefined || distance <= maxDistance;
      return matchesService && matchesCategory && matchesOrganisation && matchesProvince && matchesCity && matchesDistance;
    }).map(location => ({ location, distance: distanceKm(reference, location) }));
    if (sort === "Alphabetical") locations.sort((a, b) => a.location.name.localeCompare(b.location.name));
    else if (sort === "Most relevant") locations.sort((a, b) => Number(b.location.verified) - Number(a.location.verified) || (a.distance ?? Infinity) - (b.distance ?? Infinity));
    else locations.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
    return locations.map(item => item.location);
  }, [locationData, selectedServiceId, selectedService, category, organisation, province, city, distanceLimit, sort, userCoords]);

  const selectedLocation = filteredLocations.find(location => location.id === selectedLocationId) ?? null;

  useEffect(() => {
    if (queryMatch && query.trim().length > 2) setSelectedServiceId(queryMatch.id);
  }, [queryMatch, query]);

  useEffect(() => {
    if (!selectedLocationId || filteredLocations.some(location => location.id === selectedLocationId)) return;
    setSelectedLocationId(filteredLocations[0]?.id ?? null);
  }, [filteredLocations, selectedLocationId]);

  useEffect(() => {
    const timer = window.setTimeout(() => { if (!mapReady) setMapError(true); }, 7000);
    return () => window.clearTimeout(timer);
  }, [mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    markersRef.current.forEach(marker => { marker.map = null; });
    markersRef.current = [];
    filteredLocations.forEach(location => {
      if (location.latitude === undefined || location.longitude === undefined) return;
      const service = govMapServices.find(candidate => location.serviceIds.includes(candidate.id));
      if (!service || !window.google?.maps?.marker) return;
      const content = document.createElement("div");
      content.className = "govguide-marker";
      content.setAttribute("aria-label", `${location.name}. ${service.shortName}`);
      content.innerHTML = `<span>${service.icon === "transport" ? "🚗" : service.icon === "identity" || service.icon === "travel" ? "🪪" : service.icon === "social" ? "💰" : service.icon === "labour" ? "💼" : "🏢"}</span>`;
      const marker = new window.google.maps.marker.AdvancedMarkerElement({ map, position: { lat: location.latitude, lng: location.longitude }, title: `${location.name} — ${service.shortName}`, content });
      marker.addListener("click", () => { setSelectedLocationId(location.id); setMobileView("map"); });
      markersRef.current.push(marker);
    });
    return () => { markersRef.current.forEach(marker => { marker.map = null; }); markersRef.current = []; };
  }, [filteredLocations, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedLocation?.latitude || !selectedLocation?.longitude) return;
    map.panTo({ lat: selectedLocation.latitude, lng: selectedLocation.longitude });
    if ((map.getZoom() ?? 0) < 9) map.setZoom(11);
  }, [selectedLocation]);

  const selectService = (service: GovMapService) => { setSelectedServiceId(service.id); setCategory(service.category); setSelectedLocationId(null); setMobileView("list"); };
  const detectLocation = () => {
    setLocationError("");
    if (!navigator.geolocation) { setLocationError("We couldn't determine your location. You can search by province or city instead."); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(position => { const next = { lat: position.coords.latitude, lng: position.coords.longitude }; setUserCoords(next); setLocating(false); if (mapRef.current) { mapRef.current.setCenter(next); mapRef.current.setZoom(10); } toast("Location found", { description: "Results are now sorted from your location." }); }, () => { setLocating(false); setLocationError("We couldn't determine your location. You can search by province or city instead."); });
  };
  const getDirections = (location: GovServiceLocation) => { if (location.latitude === undefined || location.longitude === undefined) { toast("Directions unavailable", { description: "This location does not have verified coordinates yet." }); return; } const destination = `${location.latitude},${location.longitude}`; const origin = userCoords ? `&origin=${userCoords.lat},${userCoords.lng}` : ""; window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}${origin}`, "_blank", "noopener,noreferrer"); };
  const resetFilters = () => { setSelectedServiceId(null); setQuery(""); setCategory("All"); setOrganisation("All organisations"); setProvince("All provinces"); setCity(""); setDistanceLimit("Any distance"); setSort("Nearest"); };

  return <div className="space-y-6"><div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><div className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#087E8B]">Government services map</div><h1 className="font-[Manrope] text-3xl font-extrabold tracking-tight text-[#073B4C] dark:text-white">Find the right place to take action.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-300">Choose a government service, identify the responsible organisation, and find service locations across South Africa.</p></div><button onClick={detectLocation} disabled={locating} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#087E8B] px-4 py-3 text-xs font-bold text-white shadow-[0_8px_20px_rgba(8,126,139,.18)] hover:bg-[#073B4C] disabled:opacity-60"><Crosshair className="h-4 w-4" />{locating ? "Finding you..." : "Find services near me"}</button></div>
    <div className="rounded-2xl border border-[#dde7e9] bg-white p-4 shadow-[0_8px_28px_rgba(7,59,76,.035)] dark:border-[#1f6570] dark:bg-[#0a4050]"><div className="flex flex-col gap-3 lg:flex-row"><div className="flex flex-1 items-center gap-3 rounded-xl border border-[#dde7e9] px-3 dark:border-[#2a6c76]"><Search className="h-4 w-4 text-slate-400" /><input value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && queryMatch) selectService(queryMatch); }} placeholder="Search government services or locations..." className="w-full bg-transparent py-3 text-sm outline-none" aria-label="Search government services or locations" /></div><button onClick={() => queryMatch && selectService(queryMatch)} disabled={!queryMatch} className="rounded-xl bg-[#073B4C] px-4 py-3 text-xs font-bold text-white hover:bg-[#087E8B] disabled:cursor-not-allowed disabled:opacity-45 dark:bg-[#155b67]"><span className="hidden sm:inline">Identify service</span><span className="sm:hidden">Search</span></button></div><div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-400"><span className="font-bold text-[#073B4C] dark:text-white">Try:</span>{["Where can I register my company?", "I need a Smart ID", "Where is my nearest SASSA office?", "I need UIF assistance"].map(example => <button key={example} onClick={() => setQuery(example)} className="rounded-full border border-[#dde7e9] px-2.5 py-1.5 hover:border-[#46B5C2] hover:text-[#087E8B] dark:border-[#2a6c76]">{example}</button>)}</div></div>
    {locationError && <div className="flex items-start gap-2 rounded-xl border border-[#f0df9d] bg-[#fff9e8] px-4 py-3 text-xs leading-5 text-[#735800] dark:border-[#6b5a1b] dark:bg-[#403711] dark:text-[#f7df80]"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />{locationError} Use the province and city filters below instead.</div>}
    <div className="grid gap-5 lg:grid-cols-[360px_1fr]"><section className="space-y-4"><div className="flex items-center justify-between"><div><div className="text-[10px] font-bold uppercase tracking-widest text-[#087E8B]">Step 1</div><h2 className="mt-1 font-[Manrope] text-lg font-extrabold text-[#073B4C] dark:text-white">What service do you need?</h2></div><span className="rounded-full bg-[#e4f4f5] px-2.5 py-1 text-[10px] font-bold text-[#087E8B]">{govMapServices.length} services</span></div><div className="space-y-2">{govMapServices.map(service => <ServiceCard key={service.id} service={service} selected={selectedServiceId === service.id} onSelect={() => selectService(service)} />)}</div></section><section className="min-w-0 space-y-4"><div className="rounded-2xl border border-[#dde7e9] bg-white p-4 dark:border-[#1f6570] dark:bg-[#0a4050]"><div className="flex flex-wrap items-center justify-between gap-3"><div><div className="text-[10px] font-bold uppercase tracking-widest text-[#087E8B]">Step 2</div><h2 className="mt-1 font-[Manrope] text-lg font-extrabold text-[#073B4C] dark:text-white">Find service locations</h2></div><div className="flex rounded-xl bg-[#f7fafa] p-1 dark:bg-[#073B4C] md:hidden"><button onClick={() => setMobileView("list")} className={cn("rounded-lg px-3 py-2 text-xs font-bold", mobileView === "list" ? "bg-white text-[#087E8B] shadow-sm dark:bg-[#0a4050]" : "text-slate-400")}><List className="mr-1 inline h-3.5 w-3.5" />List</button><button onClick={() => setMobileView("map")} className={cn("rounded-lg px-3 py-2 text-xs font-bold", mobileView === "map" ? "bg-white text-[#087E8B] shadow-sm dark:bg-[#0a4050]" : "text-slate-400")}><MapIcon className="mr-1 inline h-3.5 w-3.5" />Map</button></div></div>{selectedService ? <div className="mt-4 rounded-xl bg-[#e4f4f5] p-3 dark:bg-[#073B4C]"><div className="flex items-start gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#087E8B] text-white"><ServiceIcon service={selectedService} className="h-4 w-4" /></div><div><div className="text-sm font-extrabold text-[#073B4C] dark:text-white">{selectedService.shortName}</div><div className="mt-1 text-xs text-slate-500 dark:text-slate-300"><span className="font-bold">Responsible organisation:</span> {selectedService.organisation} · {selectedService.department}</div></div><button onClick={() => setSelectedServiceId(null)} className="ml-auto rounded-lg p-1 text-slate-400 hover:bg-white/60"><X className="h-4 w-4" /></button></div></div> : <div className="mt-4 flex items-start gap-2 rounded-xl border border-dashed border-[#b9dfe0] p-3 text-xs leading-5 text-slate-500 dark:text-slate-300"><Info className="mt-0.5 h-4 w-4 shrink-0 text-[#087E8B]" />Select a service to see only relevant government locations.</div>}</div><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5"><Select value={category} onValueChange={value => setCategory(value as typeof category)}><SelectTrigger className="h-10 rounded-xl border-[#dde7e9] bg-white text-xs dark:border-[#2a6c76] dark:bg-[#0a4050]"><Filter className="mr-2 h-3.5 w-3.5 text-[#087E8B]" /><SelectValue /></SelectTrigger><SelectContent>{serviceCategories.map(item => <SelectItem value={item} key={item}>{item}</SelectItem>)}</SelectContent></Select><Select value={organisation} onValueChange={setOrganisation}><SelectTrigger className="h-10 rounded-xl border-[#dde7e9] bg-white text-xs dark:border-[#2a6c76] dark:bg-[#0a4050]"><Building2 className="mr-2 h-3.5 w-3.5 text-[#087E8B]" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="All organisations">All organisations</SelectItem>{organisations.map(item => <SelectItem value={item} key={item}>{item}</SelectItem>)}</SelectContent></Select><Select value={province} onValueChange={setProvince}><SelectTrigger className="h-10 rounded-xl border-[#dde7e9] bg-white text-xs dark:border-[#2a6c76] dark:bg-[#0a4050]"><MapPin className="mr-2 h-3.5 w-3.5 text-[#087E8B]" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="All provinces">All provinces</SelectItem>{provinces.map(item => <SelectItem value={item} key={item}>{item}</SelectItem>)}</SelectContent></Select><Select value={distanceLimit} onValueChange={setDistanceLimit}><SelectTrigger className="h-10 rounded-xl border-[#dde7e9] bg-white text-xs dark:border-[#2a6c76] dark:bg-[#0a4050]"><Target className="mr-2 h-3.5 w-3.5 text-[#087E8B]" /><SelectValue /></SelectTrigger><SelectContent>{["5 km", "10 km", "25 km", "50 km", "Any distance"].map(item => <SelectItem value={item} key={item}>{item}</SelectItem>)}</SelectContent></Select><div className="flex h-10 items-center rounded-xl border border-[#dde7e9] bg-white px-3 dark:border-[#2a6c76] dark:bg-[#0a4050]"><Search className="mr-2 h-3.5 w-3.5 text-[#087E8B]" /><input value={city} onChange={event => setCity(event.target.value)} placeholder="Search city" aria-label="Search city" className="w-full bg-transparent text-xs outline-none" /></div></div><div className="flex flex-wrap items-center justify-between gap-2"><div className="text-xs text-slate-400">{filteredLocations.length} {selectedService ? `${selectedService.shortName} ` : "service "}locations found{userCoords ? " near you" : " in the current verified dataset"}</div><div className="flex items-center gap-2"><Select value={sort} onValueChange={setSort}><SelectTrigger className="h-8 w-[145px] rounded-lg border-[#dde7e9] bg-white text-[11px] dark:border-[#2a6c76] dark:bg-[#0a4050]"><SlidersHorizontal className="mr-1.5 h-3 w-3 text-[#087E8B]" /><SelectValue /></SelectTrigger><SelectContent>{["Nearest", "Most relevant", "Alphabetical"].map(item => <SelectItem value={item} key={item}>{item}</SelectItem>)}</SelectContent></Select><button onClick={resetFilters} className="rounded-lg p-2 text-slate-400 hover:bg-[#e4f4f5] hover:text-[#087E8B]" aria-label="Reset map filters"><RefreshCw className="h-3.5 w-3.5" /></button></div></div><div className="grid gap-4 lg:grid-cols-[.88fr_1.12fr]"><div className={cn("space-y-3", mobileView === "map" && "hidden lg:block")}>{filteredLocations.length ? filteredLocations.map(location => <LocationCard key={location.id} location={location} service={selectedService ?? govMapServices.find(service => location.serviceIds.includes(service.id)) ?? govMapServices[0]} userCoords={userCoords} selected={selectedLocationId === location.id} onSelect={() => setSelectedLocationId(location.id)} onDirections={() => getDirections(location)} />) : <div className="rounded-2xl border border-dashed border-[#b9dfe0] bg-white p-7 text-center dark:bg-[#0a4050]"><MapPin className="mx-auto h-8 w-8 text-[#46B5C2]" /><div className="mt-3 text-sm font-bold text-[#073B4C] dark:text-white">No locations found for this service in your selected area.</div><p className="mt-2 text-xs leading-5 text-slate-500">Expand your search radius, change province, or search another location.</p><div className="mt-4 flex justify-center gap-2"><button onClick={() => setDistanceLimit("Any distance")} className="rounded-lg bg-[#087E8B] px-3 py-2 text-[11px] font-bold text-white">Expand search radius</button><button onClick={() => setProvince("All provinces")} className="rounded-lg border border-[#dde7e9] px-3 py-2 text-[11px] font-bold text-[#073B4C] dark:border-[#2a6c76] dark:text-white">Change province</button></div></div>}</div><div className={cn("space-y-3", mobileView === "list" && "hidden lg:block")}><div className="relative min-h-[520px] overflow-hidden rounded-2xl border border-[#bddbd9] bg-[#e8f3f1] dark:border-[#1f6570] dark:bg-[#073B4C]"><div className="absolute left-3 top-3 z-10 flex items-center gap-2 rounded-xl bg-white/90 px-3 py-2 text-[11px] font-bold text-[#073B4C] shadow-sm backdrop-blur dark:bg-[#073B4C]/90 dark:text-white"><MapIcon className="h-3.5 w-3.5 text-[#087E8B]" />South Africa service coverage</div>{!mapReady && !mapError && <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#e8f3f1]/85 dark:bg-[#073B4C]/85"><div className="text-center"><Loader2 className="mx-auto h-7 w-7 animate-spin text-[#087E8B]" /><div className="mt-3 text-xs font-bold text-[#073B4C] dark:text-white">Loading map...</div></div></div>}{mapError && !mapReady && <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#e8f3f1] p-6 text-center dark:bg-[#073B4C]"><div><CircleAlert className="mx-auto h-8 w-8 text-[#C94C4C]" /><div className="mt-3 text-sm font-bold text-[#073B4C] dark:text-white">Map temporarily unavailable.</div><p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-300">You can still view locations in list format.</p><button onClick={() => window.location.reload()} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#087E8B] px-3 py-2 text-xs font-bold text-white"><RefreshCw className="h-3.5 w-3.5" /> Try again</button></div></div>}<MapView className="h-[520px]" initialCenter={SOUTH_AFRICA} initialZoom={5} onMapReady={map => { mapRef.current = map; setMapReady(true); setMapError(false); }} />{userCoords && <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2 rounded-xl bg-white/90 px-3 py-2 text-[11px] font-bold text-[#073B4C] shadow-sm backdrop-blur dark:bg-[#073B4C]/90 dark:text-white"><UserRound className="h-3.5 w-3.5 text-[#087E8B]" />Your location is being used to sort results</div>}</div>{selectedLocation && <LocationDetails location={selectedLocation} service={selectedService ?? govMapServices.find(service => selectedLocation.serviceIds.includes(service.id)) ?? govMapServices[0]} userCoords={userCoords} onDirections={() => getDirections(selectedLocation)} onClose={() => setSelectedLocationId(null)} />}</div></div></section></div><div className="flex items-start gap-3 rounded-2xl border border-[#f0df9d] bg-[#fff9e8] p-4 text-xs leading-6 text-[#735800] dark:border-[#6b5a1b] dark:bg-[#403711] dark:text-[#f7df80]"><ShieldCheck className="mt-1 h-4 w-4 shrink-0" /><span>Location data is clearly labelled as verified or demo. Never rely on an address, fee, opening hour or service availability here without confirming it with the responsible organisation.</span></div></div>;
}
