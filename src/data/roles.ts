import { Role } from "../types";

export interface RoleConfig {
  role: Role;
  name: string;
  title: string;
  password: string;
  badgeClass: string;
  avatarBg: string;
  borderClass: string;
  department: string;
  defaultUserName: string;
  defaultEmail: string;
  defaultPhone: string;
  defaultTelegram: string;
  mandateTitle: string;
  mandateSummary: string;
  keyResponsibilities: string[];
  strictlyRestrictedTasks: string[];
  defaultTab: string;
  
  // Specific permissions
  canAllocateVehicleAndDispatch: boolean; // FLEET MANAGER ONLY
  canDirectorReviewStage1: boolean;      // DIRECTOR ONLY
  canSubmitTripBooking: boolean;         // EMPLOYEE, DIRECTOR, FLEET MANAGER
  canExecuteAndCompleteMission: boolean; // DRIVER, FLEET MANAGER
  canManageWorkshopMaintenance: boolean; // MAINTENANCE TECH, FLEET MANAGER
  canManageFuelVouchers: boolean;        // FLEET MANAGER, DRIVER, MAINTENANCE
  canBroadcastCustomAlerts: boolean;     // FLEET MANAGER
}

export const ROLE_CONFIGS: Record<Role, RoleConfig> = {
  "Fleet Manager (Super Admin)": {
    role: "Fleet Manager (Super Admin)",
    name: "Fleet Manager (Super Admin)",
    title: "Chief Transport & Fleet Operations Officer",
    password: "fleet@2026",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
    avatarBg: "bg-emerald-600 text-white",
    borderClass: "border-emerald-500",
    department: "Institutional Transport & Logistics Directorate",
    defaultUserName: "Eng. Wondimu Bedada",
    defaultEmail: "wondimu.bedada@oari.gov.et",
    defaultPhone: "+251 911 223 344",
    defaultTelegram: "@wondimu_fleet_admin",
    mandateTitle: "Vehicle Allocation, Driver Assignment & System Administration",
    mandateSummary: "Exclusive institutional authority to allocate 4WD vehicles, assign certified drivers, approve Stage 2 dispatch, and manage institutional fleet operations.",
    keyResponsibilities: [
      "Allocate 4WD research vehicles from the institutional pool (Stage 2 Dispatch)",
      "Assign vetted drivers and issue official mission dispatch",
      "Broadcast multi-channel notifications via Telegram (@cariqqobot) & SMS Gateway",
      "Manage vehicle asset lifecycle, fuel allocations, and audit travel logs",
      "Override or intervene across all system modules when necessary"
    ],
    strictlyRestrictedTasks: [
      "Must not bypass mandatory Stage 1 Director permission unless marked as urgent institutional emergency"
    ],
    defaultTab: "approvals",
    canAllocateVehicleAndDispatch: true,
    canDirectorReviewStage1: true, // Super admin can oversee
    canSubmitTripBooking: true,
    canExecuteAndCompleteMission: true,
    canManageWorkshopMaintenance: true,
    canManageFuelVouchers: true,
    canBroadcastCustomAlerts: true,
  },

  "Immediate Director / Supervisor": {
    role: "Immediate Director / Supervisor",
    name: "Immediate Director / Supervisor",
    title: "Director of Research Directorate / Center Director",
    password: "director@2026",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
    avatarBg: "bg-amber-600 text-white",
    borderClass: "border-amber-500",
    department: "Crops & Horticulture Research Directorate",
    defaultUserName: "Dr. Gemechu Keneni",
    defaultEmail: "gemechu.keneni@oari.gov.et",
    defaultPhone: "+251 911 776 543",
    defaultTelegram: "@dr_gemechu_director",
    mandateTitle: "Stage 1 Departmental Trip Endorsement (Permit / Deny)",
    mandateSummary: "Reviews research mission proposals submitted by departmental staff to verify institutional relevance, budget justification, and passenger manifest before forwarding to Fleet Management.",
    keyResponsibilities: [
      "Review Stage 1 trip requests from subordinate researchers and technicians",
      "Permit (endorse) legitimate agronomic field research expeditions",
      "Deny (reject) requests with clear institutional justification notes",
      "Submit high-priority administrative or audit trip requests for directorate staff",
      "Review departmental travel history and resource utilization summaries"
    ],
    strictlyRestrictedTasks: [
      "CANNOT allocate physical vehicles or assign drivers (Mandated to Fleet Manager only)",
      "CANNOT modify workshop maintenance job cards or vehicle technical statuses"
    ],
    defaultTab: "approvals",
    canAllocateVehicleAndDispatch: false, // RESTRICTED
    canDirectorReviewStage1: true,
    canSubmitTripBooking: true,
    canExecuteAndCompleteMission: false,
    canManageWorkshopMaintenance: false,
    canManageFuelVouchers: false,
    canBroadcastCustomAlerts: false,
  },

  "Researcher / Employee": {
    role: "Researcher / Employee",
    name: "Researcher / Employee",
    title: "Senior Plant Breeder & Cereal Lead",
    password: "employee@2026",
    badgeClass: "bg-sky-100 text-sky-800 border-sky-300",
    avatarBg: "bg-sky-600 text-white",
    borderClass: "border-sky-500",
    department: "Agronomy & Plant Breeding Department",
    defaultUserName: "Dr. Ayantu Tadesse",
    defaultEmail: "ayantu.tadesse@oari.gov.et",
    defaultPhone: "+251 911 882 341",
    defaultTelegram: "@ayantu_tadesse",
    mandateTitle: "Research Expedition Booking & Status Monitoring",
    mandateSummary: "Books field research expeditions (Outside Town) or official administrative town missions (Inside Town Addis Ababa) and tracks approval and dispatch updates.",
    keyResponsibilities: [
      "Submit Inside Town single-day travel requests with scheduled destinations",
      "Submit Outside Town regional research expedition bookings with waypoint routing & cargo manifest",
      "Track live status of submitted requests across Stage 1 (Director) and Stage 2 (Fleet Manager)",
      "Receive automated instant updates via Telegram Bot (@cariqqobot) and SMS",
      "View live fleet availability and research station locations"
    ],
    strictlyRestrictedTasks: [
      "CANNOT approve, permit, or reject any trip requests",
      "CANNOT allocate vehicles or assign drivers (Mandated to Fleet Manager only)",
      "CANNOT edit travel logs, maintenance records, or fuel allocation vouchers"
    ],
    defaultTab: "booking",
    canAllocateVehicleAndDispatch: false, // RESTRICTED
    canDirectorReviewStage1: false,      // RESTRICTED
    canSubmitTripBooking: true,
    canExecuteAndCompleteMission: false,
    canManageWorkshopMaintenance: false,
    canManageFuelVouchers: false,
    canBroadcastCustomAlerts: false,
  },

  "Driver": {
    role: "Driver",
    name: "Driver",
    title: "Official OARI Field & Heavy Duty Chauffeur",
    password: "driver@2026",
    badgeClass: "bg-indigo-100 text-indigo-800 border-indigo-300",
    avatarBg: "bg-indigo-600 text-white",
    borderClass: "border-indigo-500",
    department: "Fleet Operations & Transport Unit",
    defaultUserName: "Chala Merga",
    defaultEmail: "chala.merga@oari.gov.et",
    defaultPhone: "+251 911 349 812",
    defaultTelegram: "@chala_merga_driver",
    mandateTitle: "Field Mission Execution & Odometer Trip Logs",
    mandateSummary: "Executes authorized research travel missions, follows waypoint itineraries, ensures vehicle passenger safety, and records start/end odometer readings and mission completions.",
    keyResponsibilities: [
      "Inspect assigned 4WD vehicle, tools, spare tires, and cargo manifest",
      "Receive real-time mission dispatch alerts via Telegram (@cariqqobot) & SMS",
      "Start active missions and update travel progress",
      "Complete missions by submitting accurate End-Odometer KM readings and return status",
      "Log fuel refuel vouchers and station receipts"
    ],
    strictlyRestrictedTasks: [
      "CANNOT authorize or approve trip requests",
      "CANNOT allocate vehicles to other drivers (Mandated to Fleet Manager only)",
      "CANNOT modify workshop technician repair records"
    ],
    defaultTab: "approvals",
    canAllocateVehicleAndDispatch: false, // RESTRICTED
    canDirectorReviewStage1: false,      // RESTRICTED
    canSubmitTripBooking: false,
    canExecuteAndCompleteMission: true,
    canManageWorkshopMaintenance: false,
    canManageFuelVouchers: true,
    canBroadcastCustomAlerts: false,
  },

  "Maintenance Tech": {
    role: "Maintenance Tech",
    name: "Maintenance Tech",
    title: "Senior Workshop & Heavy Automotive Specialist",
    password: "maintenance@2026",
    badgeClass: "bg-slate-100 text-slate-800 border-slate-300",
    avatarBg: "bg-slate-700 text-white",
    borderClass: "border-slate-600",
    department: "Central Mechanical Workshop & Maintenance Facility",
    defaultUserName: "Yosef Abera",
    defaultEmail: "yosef.abera@oari.gov.et",
    defaultPhone: "+251 911 556 789",
    defaultTelegram: "@yosef_workshop_tech",
    mandateTitle: "Preventive Servicing, Job Cards & Workshop Repairs",
    mandateSummary: "Performs technical diagnostics, 4WD suspension & engine servicing, oil changes, job card tracking, and vehicle roadworthiness certifications.",
    keyResponsibilities: [
      "Create and track workshop Job Cards for preventive maintenance & repairs",
      "Update vehicle status (Available, In Workshop, Completed)",
      "Record replacement parts (brake pads, oil filters, differential fluid, mud tires)",
      "Log maintenance costs, labor hours, and technician inspection notes",
      "Monitor fleet next-service odometer thresholds"
    ],
    strictlyRestrictedTasks: [
      "CANNOT allocate vehicles for travel dispatch (Mandated to Fleet Manager only)",
      "CANNOT approve, permit, or reject research travel requests"
    ],
    defaultTab: "maintenance",
    canAllocateVehicleAndDispatch: false, // RESTRICTED
    canDirectorReviewStage1: false,      // RESTRICTED
    canSubmitTripBooking: false,
    canExecuteAndCompleteMission: false,
    canManageWorkshopMaintenance: true,
    canManageFuelVouchers: true,
    canBroadcastCustomAlerts: false,
  }
};

export const ROLE_LIST: Role[] = [
  "Fleet Manager (Super Admin)",
  "Immediate Director / Supervisor",
  "Researcher / Employee",
  "Driver",
  "Maintenance Tech"
];
