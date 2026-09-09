export type GovServiceCategory = "Business" | "Transport" | "Identity" | "Social Services" | "Travel" | "Employment & Labour";

export type GovMapService = {
  id: string;
  name: string;
  shortName: string;
  description: string;
  organisation: string;
  department: string;
  category: GovServiceCategory;
  icon: "business" | "transport" | "identity" | "social" | "travel" | "labour";
};

export type GovServiceLocation = {
  id: string;
  name: string;
  organisation: string;
  department: string;
  serviceIds: string[];
  province: string;
  city: string;
  municipality?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  website?: string;
  openingHours?: string;
  verified: boolean;
  lastVerified?: string;
  dataNote: string;
};

export const provinces = [
  "Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", "Limpopo", "Mpumalanga", "Northern Cape", "North West", "Western Cape",
] as const;

export const govMapServices: GovMapService[] = [
  { id: "business-registration", name: "Business (Company) Registration", shortName: "Business Registration", description: "Register a company with CIPC.", organisation: "CIPC", department: "Department of Trade, Industry and Competition (the dtic)", category: "Business", icon: "business" },
  { id: "driving-licence", name: "Driving Licence", shortName: "Driving Licence", description: "Apply for or renew a driving licence.", organisation: "Department of Transport", department: "Department of Transport", category: "Transport", icon: "transport" },
  { id: "learners-licence", name: "Learner's Licence", shortName: "Learner's Licence", description: "Prepare for your learner's licence test.", organisation: "Department of Transport", department: "Department of Transport", category: "Transport", icon: "transport" },
  { id: "vehicle-licence-renewal", name: "Motor Vehicle Licence Renewal", shortName: "Vehicle Licence Renewal", description: "Renew a motor vehicle licence disc.", organisation: "Department of Transport", department: "Department of Transport", category: "Transport", icon: "transport" },
  { id: "smart-id", name: "Smart ID Card", shortName: "Smart ID Card", description: "Apply for or replace your South African ID.", organisation: "Department of Home Affairs", department: "Department of Home Affairs", category: "Identity", icon: "identity" },
  { id: "social-grants", name: "Social Grants", shortName: "Social Grants", description: "Get help with SASSA social assistance.", organisation: "SASSA", department: "Department of Social Development", category: "Social Services", icon: "social" },
  { id: "passport", name: "South African Passport", shortName: "South African Passport", description: "Apply for or renew a passport.", organisation: "Department of Home Affairs", department: "Department of Home Affairs", category: "Travel", icon: "travel" },
  { id: "uif-benefits", name: "UIF Benefits", shortName: "UIF Benefits", description: "Find help with UIF claims and benefits.", organisation: "Department of Employment and Labour", department: "Department of Employment and Labour", category: "Employment & Labour", icon: "labour" },
];

// This starter dataset is intentionally labelled unverified. Replace or augment it with imported official records before production use.
export const govServiceLocations: GovServiceLocation[] = [];

// Verified records can be imported into the database without changing the service-first UI.

export const allOrganisations = Array.from(new Set(govMapServices.map(service => service.organisation)));
export const serviceCategories: Array<"All" | GovServiceCategory> = ["All", "Business", "Transport", "Identity", "Social Services", "Travel", "Employment & Labour"];
