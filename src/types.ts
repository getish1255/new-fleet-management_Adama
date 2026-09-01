export type Role = 
  | "Fleet Manager (Super Admin)" 
  | "Immediate Director / Supervisor" 
  | "Researcher / Employee" 
  | "Driver" 
  | "Maintenance Tech";

export type Language = "en" | "om" | "am";

export type TripBookingCategory = "Inside Town" | "Outside Town";

export type TripStatus = 
  | "Pending" 
  | "Pending Director Approval" 
  | "Rejected by Director" 
  | "Pending Fleet Manager Authorization" 
  | "Rejected by Fleet Manager" 
  | "Approved" 
  | "In Progress" 
  | "Completed" 
  | "Cancelled";

export interface ResearchCenter {
  id: string;
  name: string;
  location: string;
  lat: number;
  lng: number;
  coordinates?: { lat: number; lng: number };
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  code: string;
  model: string;
  type: "4WD Pickup" | "Land Cruiser Hardtop" | "SUV / Prado" | "Station Wagon" | "Minibus / Crew" | "Agri-Truck";
  stationBase: string;
  year: number;
  fuelType: "Diesel" | "Petrol";
  fuelTankCapacity: number;
  currentFuelLevel: number;
  odometerKm: number;
  status: "Available" | "On Mission" | "In Maintenance" | "Reserved";
  assignedDriverId?: string;
  assignedDriverName?: string;
  driverPhone?: string;
  nextServiceKm: number;
  lastServiceDate: string;
  coordinates: { lat: number; lng: number };
  features: string[];
  notes?: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  telegramHandle?: string;
  licenseNumber: string;
  stationBase: string;
  experienceYears: number;
  rating: number;
  status: "Active / Available" | "On Trip" | "On Leave";
  currentVehicleId?: string;
  assignedVehicleId?: string;
  assignedVehiclePlate?: string;
}

export interface TripRequest {
  id: string;
  requestNumber: string;
  requesterName: string;
  requesterTitle: string;
  department: string;
  requesterPhone: string;
  requesterEmail: string;
  requesterTelegram?: string;
  stationBase: string;
  tripCategory: TripBookingCategory;
  insideTownDestination?: string;
  insideTownPickupTime?: string;
  insideTownReturnTime?: string;
  origin: string;
  destination: string;
  waypoints?: string[];
  departureDate: string;
  returnDate: string;
  purpose: "Seed Distribution" | "Field Crop Research & Phenotyping" | "Soil & Water Sampling" | "Farmer Training & Field Day" | "Livestock Breed Assessment" | "Administrative & Audit Mission" | "Emergency Farm Outreach" | "Inside Town Official Run" | string;
  passengerCount: number;
  passengerNames: string[];
  cargoDescription: string;
  cargoWeightKg: number;
  urgency: "Normal" | "High" | "Critical / Emergency";
  status: TripStatus;
  
  // Phase 1: Director Review
  directorApprovedBy?: string;
  directorApprovedAt?: string;
  directorNotes?: string;
  directorRejectionReason?: string;

  // Phase 2: Fleet Manager Authorization & Assignment
  fleetManagerApprovedBy?: string;
  fleetManagerApprovedAt?: string;
  fleetManagerRejectionReason?: string;
  assignedVehicleId?: string;
  assignedVehiclePlate?: string;
  assignedDriverId?: string;
  assignedDriverName?: string;
  assignedDriverPhone?: string;
  assignedDriverTelegram?: string;
  
  // General Approval
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  
  notificationChannels?: ("SMS" | "Telegram" | "Email")[];
  telegramBotUrl?: string;
  createdAt: string;
  estimatedKm: number;
  estimatedFuelLiters: number;
}

export interface TravelLog {
  id: string;
  logNumber: string;
  tripRequestId: string;
  vehicleId: string;
  vehiclePlate: string;
  driverId?: string;
  driverName: string;
  requesterName: string;
  origin: string;
  destination: string;
  startOdometerKm: number;
  endOdometerKm?: number;
  totalDistanceKm?: number;
  startTime: string;
  endTime?: string;
  fuelIssuedLiters: number;
  fuelCostEtb: number;
  voucherNumber?: string;
  purpose: string;
  status: "Active Mission" | "Completed" | "Audited";
  officerRemarks?: string;
}

export type NotificationChannel = "SMS" | "Telegram" | "Email";

export interface NotificationAlert {
  id: string;
  channel?: NotificationChannel;
  recipientType: "Customer" | "Driver" | "Fleet Manager" | "Director";
  recipientName: string;
  recipientPhone: string;
  recipientEmail?: string;
  recipientTelegram?: string;
  tripRequestNumber: string;
  subject?: string;
  message: string;
  status: "Delivered" | "Sent" | "Queued";
  sentAt: string;
  gatewayRef: string;
  costEtb: number;
  telegramDirectUrl?: string;
}

export type SMSAlert = NotificationAlert;

export interface FuelRecord {
  id: string;
  voucherNumber: string;
  vehicleId: string;
  vehiclePlate: string;
  stationBase: string;
  fuelStationName: string;
  liters: number;
  unitPriceEtb: number;
  totalCostEtb: number;
  odometerAtRefuel: number;
  date: string;
  driverName: string;
  approvedBy: string;
}

export interface MaintenanceRecord {
  id: string;
  jobCardNumber: string;
  vehicleId: string;
  vehiclePlate: string;
  serviceType: "Periodic Oil & Filter" | "4WD Transmission & Differential" | "Brake System & Suspension" | "Tire Replacement" | "Engine Overhaul" | "Electrical & AC Service";
  status: "Scheduled" | "In Workshop" | "Completed";
  scheduledDate: string;
  completionDate?: string;
  workshopName: string;
  odometerKm: number;
  costEtb: number;
  technicianNotes: string;
  partsReplaced: string[];
}

export interface InstitutionalOfficer {
  id: string;
  roleType: "Director" | "Fleet Manager" | "Supervisor";
  fullName: string;
  officialTitle: string;
  department: string;
  phoneNumber: string;
  email: string;
  telegramHandle: string;
  stationOrCenter?: string;
  signatureSealText?: string;
  isPrimaryForRole?: boolean;
  password?: string;
}
