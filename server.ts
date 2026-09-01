import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { 
  Vehicle, 
  Driver, 
  TripRequest, 
  TravelLog, 
  SMSAlert, 
  FuelRecord, 
  MaintenanceRecord, 
  TripBookingCategory, 
  TripStatus, 
  NotificationChannel 
} from "./src/types";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Multi-User Cross-Origin & Live Sync Headers
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  if (req.path.startsWith("/api/")) {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");
  }
  next();
});

// Lazy-safe Gemini initialization
let aiClient: GoogleGenAI | null = null;
function getAIClient() {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// In-Memory Database
const researchCenters = [
  { id: "hq", name: "OARI Headquarter", location: "Finfinnee (Addis Ababa)", lat: 9.032, lng: 38.746 },
  { id: "sinana", name: "Sinana Agricultural Research Center", location: "Bale, Robe", lat: 7.123, lng: 40.012 },
  { id: "bako", name: "Bako Agricultural Research Center", location: "West Shoa, Bako", lat: 9.133, lng: 37.054 },
  { id: "adami_tulu", name: "Adami Tulu Agricultural Research Center", location: "East Shoa, Zway", lat: 7.863, lng: 38.718 },
  { id: "kulumsa", name: "Kulumsa Agricultural Research Center", location: "Arsi, Asella", lat: 8.016, lng: 39.155 },
  { id: "bishoftu", name: "Bishoftu / Melkasa Research Center", location: "Bishoftu / Adama", lat: 8.742, lng: 38.984 },
  { id: "jimma", name: "Jimma Agricultural Research Center", location: "Jimma, Melko", lat: 7.674, lng: 36.834 },
  { id: "fedis", name: "Fedis Agricultural Research Center", location: "East Hararghe, Harar", lat: 9.112, lng: 42.044 },
  { id: "bore", name: "Bore Agricultural Research Center", location: "Guji, Bore", lat: 6.352, lng: 38.618 },
  { id: "bedele", name: "Bedele Agricultural Research Center", location: "Buno Bedele", lat: 8.455, lng: 36.353 },
  { id: "yabello", name: "Yabello Pastoral Research Center", location: "Borana, Yabello", lat: 4.883, lng: 38.083 },
];

const initialVehicles: Vehicle[] = [
  {
    id: "v-01",
    plateNumber: "4-45210 ET",
    code: "OARI-FLT-01",
    model: "Toyota Land Cruiser HZJ79 4x4",
    type: "Land Cruiser Hardtop",
    stationBase: "Sinana Agricultural Research Center",
    year: 2023,
    fuelType: "Diesel",
    fuelTankCapacity: 130,
    currentFuelLevel: 98,
    odometerKm: 42350,
    status: "Available",
    assignedDriverId: "d-01",
    assignedDriverName: "Tolessa Gemechu",
    driverPhone: "+251 911 234 567",
    nextServiceKm: 45000,
    lastServiceDate: "2026-06-15",
    coordinates: { lat: 7.123, lng: 40.012 },
    features: ["Heavy Duty Snorkel", "Winch 12000lb", "Dual Spare Tires", "All-Terrain Diff Lock"],
    notes: "Highland field-ready. Excellent for Bale & Arsi rugged field stations."
  },
  {
    id: "v-02",
    plateNumber: "3-89104 OR",
    code: "OARI-FLT-02",
    model: "Toyota Hilux Double Cab 2.8 GD-6 4WD",
    type: "4WD Pickup",
    stationBase: "OARI Headquarter",
    year: 2024,
    fuelType: "Diesel",
    fuelTankCapacity: 80,
    currentFuelLevel: 65,
    odometerKm: 28400,
    status: "Available",
    assignedDriverId: "d-02",
    assignedDriverName: "Bekele Dibaba",
    driverPhone: "+251 922 456 789",
    nextServiceKm: 30000,
    lastServiceDate: "2026-07-10",
    coordinates: { lat: 9.032, lng: 38.746 },
    features: ["Canopy Cover", "Bedliner", "Tow Bar", "GPS Tracking Unit"],
    notes: "Primary seed sample transport vehicle for Central Oromia."
  },
  {
    id: "v-03",
    plateNumber: "4-11892 ET",
    code: "OARI-FLT-03",
    model: "Isuzu D-Max V-Cross 4x4",
    type: "4WD Pickup",
    stationBase: "Bako Agricultural Research Center",
    year: 2022,
    fuelType: "Diesel",
    fuelTankCapacity: 76,
    currentFuelLevel: 32,
    odometerKm: 56120,
    status: "On Mission",
    assignedDriverId: "d-03",
    assignedDriverName: "Chala Merga",
    driverPhone: "+251 933 789 012",
    nextServiceKm: 60000,
    lastServiceDate: "2026-05-20",
    coordinates: { lat: 9.133, lng: 37.054 },
    features: ["Off-road Suspension", "Roof Rack", "Sample Cooler 12V"],
    notes: "Currently on hybrid maize inspection across West Shoa."
  },
  {
    id: "v-04",
    plateNumber: "3-55671 OR",
    code: "OARI-FLT-04",
    model: "Toyota Land Cruiser Prado TXL",
    type: "SUV / Prado",
    stationBase: "OARI Headquarter",
    year: 2023,
    fuelType: "Diesel",
    fuelTankCapacity: 87,
    currentFuelLevel: 75,
    odometerKm: 34500,
    status: "Available",
    assignedDriverId: "d-04",
    assignedDriverName: "Girma Abera",
    driverPhone: "+251 944 112 233",
    nextServiceKm: 40000,
    lastServiceDate: "2026-07-02",
    coordinates: { lat: 9.032, lng: 38.746 },
    features: ["Leather Seating", "Advanced Safety Pack", "Long Range Fuel Tank", "Dual Zone AC"],
    notes: "Director & International Partner delegates field missions."
  },
  {
    id: "v-05",
    plateNumber: "4-67290 ET",
    code: "OARI-FLT-05",
    model: "Toyota HiAce Commuter 4WD 15-Seater",
    type: "Minibus / Crew",
    stationBase: "Kulumsa Agricultural Research Center",
    year: 2021,
    fuelType: "Diesel",
    fuelTankCapacity: 70,
    currentFuelLevel: 55,
    odometerKm: 68900,
    status: "Available",
    assignedDriverId: "d-05",
    assignedDriverName: "Dawit Feyisa",
    driverPhone: "+251 955 889 900",
    nextServiceKm: 70000,
    lastServiceDate: "2026-06-25",
    coordinates: { lat: 8.016, lng: 39.155 },
    features: ["15 High-back Seats", "Rear Luggage Cage", "PA System for Field Day"],
    notes: "Ideal for researcher teams, agronomists & farmer field days."
  },
  {
    id: "v-06",
    plateNumber: "3-90342 OR",
    code: "OARI-FLT-06",
    model: "Toyota Hilux Single Cab 4x4 with Tool Box",
    type: "4WD Pickup",
    stationBase: "Adami Tulu Agricultural Research Center",
    year: 2022,
    fuelType: "Diesel",
    fuelTankCapacity: 80,
    currentFuelLevel: 20,
    odometerKm: 49800,
    status: "In Maintenance",
    assignedDriverId: "d-06",
    assignedDriverName: "Tesfaye Urgessa",
    driverPhone: "+251 966 334 455",
    nextServiceKm: 50000,
    lastServiceDate: "2026-04-18",
    coordinates: { lat: 7.863, lng: 38.718 },
    features: ["Heavy Cargo Tray", "Veterinary Vaccine Freezer Box"],
    notes: "Undergoing 50,000 km scheduled differential service."
  },
  {
    id: "v-07",
    plateNumber: "4-32091 ET",
    code: "OARI-FLT-07",
    model: "Toyota Land Cruiser HZJ78 Troop Carrier",
    type: "Land Cruiser Hardtop",
    stationBase: "Jimma Agricultural Research Center",
    year: 2023,
    fuelType: "Diesel",
    fuelTankCapacity: 180,
    currentFuelLevel: 140,
    odometerKm: 31200,
    status: "Available",
    assignedDriverId: "d-07",
    assignedDriverName: "Muktar Kedir",
    driverPhone: "+251 977 556 677",
    nextServiceKm: 35000,
    lastServiceDate: "2026-07-28",
    coordinates: { lat: 7.674, lng: 36.834 },
    features: ["Sub-tank 90L+90L", "Dual AC", "Mud-Terrain Cooper Tires", "Satellite GPS"],
    notes: "Deployed for deep forest wild coffee biodiversity expeditions."
  }
];

const initialDrivers: Driver[] = [
  { id: "d-01", name: "Tolessa Gemechu", phone: "+251 911 234 567", licenseNumber: "ET-ORM-DL-7741", stationBase: "Sinana Agricultural Research Center", experienceYears: 14, rating: 4.9, status: "Active / Available", currentVehicleId: "v-01" },
  { id: "d-02", name: "Bekele Dibaba", phone: "+251 922 456 789", licenseNumber: "ET-ORM-DL-5520", stationBase: "OARI Headquarter", experienceYears: 11, rating: 4.8, status: "Active / Available", currentVehicleId: "v-02" },
  { id: "d-03", name: "Chala Merga", phone: "+251 933 789 012", licenseNumber: "ET-ORM-DL-3389", stationBase: "Bako Agricultural Research Center", experienceYears: 8, rating: 4.7, status: "On Trip", currentVehicleId: "v-03" },
  { id: "d-04", name: "Girma Abera", phone: "+251 944 112 233", licenseNumber: "ET-ORM-DL-9912", stationBase: "OARI Headquarter", experienceYears: 16, rating: 5.0, status: "Active / Available", currentVehicleId: "v-04" },
  { id: "d-05", name: "Dawit Feyisa", phone: "+251 955 889 900", licenseNumber: "ET-ORM-DL-6643", stationBase: "Kulumsa Agricultural Research Center", experienceYears: 9, rating: 4.8, status: "Active / Available", currentVehicleId: "v-05" },
  { id: "d-06", name: "Tesfaye Urgessa", phone: "+251 966 334 455", licenseNumber: "ET-ORM-DL-1102", stationBase: "Adami Tulu Agricultural Research Center", experienceYears: 12, rating: 4.6, status: "Active / Available", currentVehicleId: "v-06" },
  { id: "d-07", name: "Muktar Kedir", phone: "+251 977 556 677", licenseNumber: "ET-ORM-DL-8821", stationBase: "Jimma Agricultural Research Center", experienceYears: 10, rating: 4.9, status: "Active / Available", currentVehicleId: "v-07" },
];

const initialTripRequests: TripRequest[] = [
  {
    id: "req-01",
    requestNumber: "OARI-REQ-2026-081",
    requesterName: "Dr. Ayantu Tadesse",
    requesterTitle: "Senior Plant Breeder & Cereal Lead",
    department: "Crops & Horticulture Research Directorate",
    requesterPhone: "+251 911 882 341",
    requesterEmail: "ayantu.tadesse@oari.gov.et",
    requesterTelegram: "@ayantu_tadesse",
    stationBase: "Sinana Agricultural Research Center",
    tripCategory: "Outside Town",
    origin: "Sinana Research Center (Bale)",
    destination: "Agarfa & Goba Experimental Farms",
    waypoints: ["Robe Seed Multiplication", "Agarfa TVET Farm"],
    departureDate: "2026-08-21T07:30:00",
    returnDate: "2026-08-23T18:00:00",
    purpose: "Field Crop Research & Phenotyping",
    passengerCount: 4,
    passengerNames: ["Dr. Ayantu Tadesse", "Diriba Wakgari (Agronomist)", "Sintayehu Kebede (Lab Tech)", "Hana Gutu (Pathology)"],
    cargoDescription: "Rust-resistant wheat breeder seeds, GPS loggers, leaf tissue sample cooler",
    cargoWeightKg: 160,
    urgency: "High",
    status: "Pending Director Approval",
    createdAt: "2026-08-19T14:15:00",
    estimatedKm: 340,
    estimatedFuelLiters: 48,
    telegramBotUrl: "https://t.me/cariqqobot?start=req_081"
  },
  {
    id: "req-04",
    requestNumber: "OARI-REQ-2026-085",
    requesterName: "Kumsa Dibaba",
    requesterTitle: "Seed Certification Officer",
    department: "Crops & Horticulture Research Directorate",
    requesterPhone: "+251 912 334 556",
    requesterEmail: "kumsa.dibaba@oari.gov.et",
    requesterTelegram: "@kumsa_seed",
    stationBase: "OARI Headquarter",
    tripCategory: "Inside Town",
    insideTownDestination: "Ministry of Agriculture (MoA) - CMC & National Soil Testing Lab - Kality",
    insideTownPickupTime: "08:30",
    insideTownReturnTime: "17:00",
    origin: "OARI Headquarter (Addis Ababa)",
    destination: "Ministry of Agriculture - CMC & Kality Soil Lab",
    waypoints: ["MoA CMC Block B", "Kality Seed Lab"],
    departureDate: "2026-08-21T08:30:00",
    returnDate: "2026-08-21T17:00:00",
    purpose: "Inside Town Official Run",
    passengerCount: 2,
    passengerNames: ["Kumsa Dibaba", "Tigist Alemu"],
    cargoDescription: "Seed certification trial binders & sample calibration bags",
    cargoWeightKg: 35,
    urgency: "Normal",
    status: "Pending Fleet Manager Authorization",
    directorApprovedBy: "Dr. Ayantu Tadesse (Director of Crops Directorate)",
    directorApprovedAt: "2026-08-20T10:15:00Z",
    directorNotes: "Permitted for official inter-agency seed trial certification.",
    createdAt: "2026-08-20T09:00:00Z",
    estimatedKm: 42,
    estimatedFuelLiters: 8,
    telegramBotUrl: "https://t.me/cariqqobot?start=req_085"
  },
  {
    id: "req-02",
    requestNumber: "OARI-REQ-2026-079",
    requesterName: "Dr. Gamachu Keneni",
    requesterTitle: "Lead Agro-Ecologist & Soil Specialist",
    department: "Natural Resources Management Directorate",
    requesterPhone: "+251 912 667 890",
    requesterEmail: "gamachu.keneni@oari.gov.et",
    requesterTelegram: "@gamachu_soil",
    stationBase: "Bako Agricultural Research Center",
    tripCategory: "Outside Town",
    origin: "Bako Research Center",
    destination: "Tibe & Sire Demonstration Watersheds",
    departureDate: "2026-08-19T06:00:00",
    returnDate: "2026-08-20T17:00:00",
    purpose: "Soil & Water Sampling",
    passengerCount: 3,
    passengerNames: ["Dr. Gamachu Keneni", "Kumsa Banti", "Fikadu Regassa"],
    cargoDescription: "Soil augers, moisture sensors, core sampling boxes",
    cargoWeightKg: 120,
    urgency: "Normal",
    status: "In Progress",
    directorApprovedBy: "Dr. Tadesse Dinsa (Director)",
    directorApprovedAt: "2026-08-18T14:00:00",
    fleetManagerApprovedBy: "Eng. Wondimu Bedada (Transport Logistics Officer)",
    fleetManagerApprovedAt: "2026-08-18T16:00:00",
    assignedVehicleId: "v-03",
    assignedVehiclePlate: "4-11892 ET (Isuzu D-Max 4x4)",
    assignedDriverId: "d-03",
    assignedDriverName: "Chala Merga",
    assignedDriverPhone: "+251 933 789 012",
    assignedDriverTelegram: "@chala_driver",
    approvedBy: "Eng. Wondimu Bedada (Transport Logistics Officer)",
    approvedAt: "2026-08-18T16:00:00",
    createdAt: "2026-08-18T10:00:00",
    estimatedKm: 210,
    estimatedFuelLiters: 32,
    telegramBotUrl: "https://t.me/cariqqobot?start=req_079"
  },
  {
    id: "req-03",
    requestNumber: "OARI-REQ-2026-074",
    requesterName: "W/ro Aster Worku",
    requesterTitle: "Directorate Director",
    department: "Agricultural Extension & Socio-Economics",
    requesterPhone: "+251 913 445 566",
    requesterEmail: "aster.worku@oari.gov.et",
    requesterTelegram: "@aster_worku",
    stationBase: "OARI Headquarter",
    tripCategory: "Outside Town",
    origin: "OARI Headquarter (Addis Ababa)",
    destination: "Adami Tulu & Kulumsa Research Centers",
    departureDate: "2026-08-15T08:00:00",
    returnDate: "2026-08-17T17:30:00",
    purpose: "Farmer Training & Field Day",
    passengerCount: 5,
    passengerNames: ["Aster Worku", "Tsegaye Hunde", "Bontu Abdisa", "Kassahun Leta", "Yohannes Mitiku"],
    cargoDescription: "Farmer training manuals, projector, demonstration wheat seed bags",
    cargoWeightKg: 200,
    urgency: "Normal",
    status: "Completed",
    directorApprovedBy: "Dr. Gemechu Keneni (Deputy DG)",
    directorApprovedAt: "2026-08-14T10:00:00",
    fleetManagerApprovedBy: "Eng. Wondimu Bedada (Transport Logistics Officer)",
    fleetManagerApprovedAt: "2026-08-14T11:20:00",
    assignedVehicleId: "v-02",
    assignedVehiclePlate: "3-89104 OR (Toyota Hilux 4WD)",
    assignedDriverId: "d-02",
    assignedDriverName: "Bekele Dibaba",
    assignedDriverPhone: "+251 922 456 789",
    assignedDriverTelegram: "@bekele_driver",
    approvedBy: "Eng. Wondimu Bedada (Transport Logistics Officer)",
    approvedAt: "2026-08-14T11:20:00",
    createdAt: "2026-08-14T09:10:00",
    estimatedKm: 460,
    estimatedFuelLiters: 65,
    telegramBotUrl: "https://t.me/cariqqobot?start=req_074"
  }
];

const initialTravelLogs: TravelLog[] = [
  {
    id: "log-01",
    logNumber: "OARI-LOG-2026-112",
    tripRequestId: "req-02",
    vehicleId: "v-03",
    vehiclePlate: "4-11892 ET",
    driverName: "Chala Merga",
    requesterName: "Dr. Gamachu Keneni",
    origin: "Bako Research Center",
    destination: "Tibe & Sire Watersheds",
    startOdometerKm: 55910,
    startTime: "2026-08-19T06:15:00",
    fuelIssuedLiters: 40,
    fuelCostEtb: 3880,
    purpose: "Soil & Water Sampling",
    status: "Active Mission",
    officerRemarks: "Authorized by Bako Station Transport Officer. Approved for off-road mud tracks."
  },
  {
    id: "log-02",
    logNumber: "OARI-LOG-2026-108",
    tripRequestId: "req-03",
    vehicleId: "v-02",
    vehiclePlate: "3-89104 OR",
    driverName: "Bekele Dibaba",
    requesterName: "W/ro Aster Worku",
    origin: "OARI Headquarter",
    destination: "Adami Tulu & Kulumsa",
    startOdometerKm: 27930,
    endOdometerKm: 28400,
    totalDistanceKm: 470,
    startTime: "2026-08-15T08:10:00",
    endTime: "2026-08-17T17:45:00",
    fuelIssuedLiters: 65,
    fuelCostEtb: 6305,
    purpose: "Farmer Training & Field Day",
    status: "Completed",
    officerRemarks: "Successfully completed. Seed packages distributed. Vehicle returned clean."
  }
];

const initialSmsAlerts: SMSAlert[] = [
  {
    id: "sms-01",
    recipientType: "Customer",
    recipientName: "Dr. Gamachu Keneni",
    recipientPhone: "+251 912 667 890",
    tripRequestNumber: "OARI-REQ-2026-079",
    message: "OARI FLEET ALERT: Your trip to Tibe & Sire has been APPROVED. Assigned Driver: Chala Merga (0933789012), Vehicle: 4-11892 ET (Isuzu D-Max 4x4). Pickup: 19/08/2026 06:00 AM.",
    status: "Delivered",
    sentAt: "2026-08-18T16:01:12",
    gatewayRef: "ETHIO-SMS-992140",
    costEtb: 0.00
  },
  {
    id: "sms-02",
    recipientType: "Driver",
    recipientName: "Chala Merga",
    recipientPhone: "+251 933 789 012",
    tripRequestNumber: "OARI-REQ-2026-079",
    message: "OARI DISPATCH NOTICE: Assigned Mission #OARI-REQ-2026-079. Client: Dr. Gamachu Keneni (0912667890). Dest: Tibe & Sire. Depart: 19/08/2026 06:00 AM. Vehicle: 4-11892 ET. Travel Voucher ready.",
    status: "Delivered",
    sentAt: "2026-08-18T16:01:14",
    gatewayRef: "ETHIO-SMS-992141",
    costEtb: 0.00
  }
];

const initialFuelRecords: FuelRecord[] = [
  {
    id: "f-01",
    voucherNumber: "OARI-FUEL-2026-301",
    vehicleId: "v-01",
    vehiclePlate: "4-45210 ET",
    stationBase: "Sinana Agricultural Research Center",
    fuelStationName: "National Oil Ethiopia (NOC) - Robe Station",
    liters: 95,
    unitPriceEtb: 97.00,
    totalCostEtb: 9215.00,
    odometerAtRefuel: 41800,
    date: "2026-08-12",
    driverName: "Tolessa Gemechu",
    approvedBy: "Aman Negash (Bale Station Logistics)"
  },
  {
    id: "f-02",
    voucherNumber: "OARI-FUEL-2026-298",
    vehicleId: "v-02",
    vehiclePlate: "3-89104 OR",
    stationBase: "OARI Headquarter",
    fuelStationName: "TotalEnergies - Bole Airport Station",
    liters: 70,
    unitPriceEtb: 97.00,
    totalCostEtb: 6790.00,
    odometerAtRefuel: 27900,
    date: "2026-08-14",
    driverName: "Bekele Dibaba",
    approvedBy: "Eng. Wondimu Bedada"
  },
  {
    id: "f-03",
    voucherNumber: "OARI-FUEL-2026-295",
    vehicleId: "v-03",
    vehiclePlate: "4-11892 ET",
    stationBase: "Bako Agricultural Research Center",
    fuelStationName: "OiLibya - Bako Town Depot",
    liters: 65,
    unitPriceEtb: 97.00,
    totalCostEtb: 6305.00,
    odometerAtRefuel: 55400,
    date: "2026-08-17",
    driverName: "Chala Merga",
    approvedBy: "Diriba Fayera"
  },
  {
    id: "f-04",
    voucherNumber: "OARI-FUEL-2026-290",
    vehicleId: "v-07",
    vehiclePlate: "4-32091 ET",
    stationBase: "Jimma Agricultural Research Center",
    fuelStationName: "NOC - Jimma Melko Branch",
    liters: 110,
    unitPriceEtb: 97.00,
    totalCostEtb: 10670.00,
    odometerAtRefuel: 30850,
    date: "2026-08-10",
    driverName: "Muktar Kedir",
    approvedBy: "Abdi Hussen"
  }
];

const initialMaintenanceRecords: MaintenanceRecord[] = [
  {
    id: "m-01",
    jobCardNumber: "OARI-MAINT-2026-88",
    vehicleId: "v-06",
    vehiclePlate: "3-55671 OR",
    serviceType: "Periodic Oil & Filter",
    status: "In Workshop",
    scheduledDate: "2026-08-18",
    workshopName: "OARI Central Mechanical Workshop - Finfinnee",
    odometerKm: 49800,
    costEtb: 18450.00,
    technicianNotes: "50,000 km full preventive maintenance, synthetic diesel engine oil, fuel & air filter replacement.",
    partsReplaced: ["15W-40 Synthetic Oil (10L)", "Genuine Toyota Oil Filter", "Primary Diesel Fuel Filter", "Air Filter Element"]
  },
  {
    id: "m-02",
    jobCardNumber: "OARI-MAINT-2026-82",
    vehicleId: "v-01",
    vehiclePlate: "4-45210 ET",
    serviceType: "4WD Transmission & Differential",
    status: "Completed",
    scheduledDate: "2026-06-15",
    completionDate: "2026-06-16",
    workshopName: "Robe Auto Service & Logistics",
    odometerKm: 40000,
    costEtb: 24200.00,
    technicianNotes: "Front & Rear differential gear oil change, transfer case inspection, propeller shaft grease.",
    partsReplaced: ["80W-90 Gear Oil (8L)", "Grease Cartridges", "Differential Drain Gaskets"]
  },
  {
    id: "m-03",
    jobCardNumber: "OARI-MAINT-2026-75",
    vehicleId: "v-05",
    vehiclePlate: "4-67290 ET",
    serviceType: "Brake System & Suspension",
    status: "Completed",
    scheduledDate: "2026-06-25",
    completionDate: "2026-06-27",
    workshopName: "Asella Automotive Garage",
    odometerKm: 65000,
    costEtb: 31000.00,
    technicianNotes: "Front brake pads replaced, rear brake shoe adjustment, shock absorber bushing inspection.",
    partsReplaced: ["Heavy Duty Brake Pads Front", "Brake Fluid DOT 4 (2L)", "Suspension Rubber Bushings"]
  }
];

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

const initialOfficers: InstitutionalOfficer[] = [
  {
    id: "off-01",
    roleType: "Director",
    fullName: "Dr. Gemechu Keneni",
    officialTitle: "Director of Crops & Horticulture Research",
    department: "Crops & Horticulture Research Directorate",
    phoneNumber: "+251 911 776 543",
    email: "gemechu.keneni@oari.gov.et",
    telegramHandle: "@dr_gemechu_director",
    stationOrCenter: "OARI Headquarters, Addis Ababa",
    signatureSealText: "SEAL-OARI-DIR-CROPS-01",
    isPrimaryForRole: true,
    password: "director@2026"
  },
  {
    id: "off-02",
    roleType: "Director",
    fullName: "Dr. Tadesse Dinsa",
    officialTitle: "Director of Natural Resources Management",
    department: "Natural Resources Management Directorate",
    phoneNumber: "+251 911 884 920",
    email: "tadesse.dinsa@oari.gov.et",
    telegramHandle: "@dr_tadesse_dinsa",
    stationOrCenter: "OARI Headquarters, Addis Ababa",
    signatureSealText: "SEAL-OARI-DIR-NRM-02",
    isPrimaryForRole: false,
    password: "director@2026"
  },
  {
    id: "off-03",
    roleType: "Director",
    fullName: "Dr. Teshale Sori",
    officialTitle: "Director of Livestock & Animal Health",
    department: "Livestock & Animal Health Directorate",
    phoneNumber: "+251 911 332 119",
    email: "teshale.sori@oari.gov.et",
    telegramHandle: "@dr_teshale_sori",
    stationOrCenter: "OARI Headquarters, Addis Ababa",
    signatureSealText: "SEAL-OARI-DIR-LVST-03",
    isPrimaryForRole: false,
    password: "director@2026"
  },
  {
    id: "off-04",
    roleType: "Director",
    fullName: "Dr. Bedada Girma",
    officialTitle: "Director of Socio-Economics & Extension",
    department: "Agricultural Socio-Economics & Extension Directorate",
    phoneNumber: "+251 911 445 678",
    email: "bedada.girma@oari.gov.et",
    telegramHandle: "@dr_bedada_girma",
    stationOrCenter: "OARI Headquarters, Addis Ababa",
    signatureSealText: "SEAL-OARI-DIR-ECON-04",
    isPrimaryForRole: false,
    password: "director@2026"
  },
  {
    id: "off-05",
    roleType: "Supervisor",
    fullName: "Dr. Tolera Fufa",
    officialTitle: "Center Director",
    department: "Sinana Agricultural Research Center",
    phoneNumber: "+251 912 667 890",
    email: "tolera.fufa@oari.gov.et",
    telegramHandle: "@dr_tolera_sinana",
    stationOrCenter: "Sinana Research Station, Bale",
    signatureSealText: "SEAL-OARI-DIR-SIN-05",
    isPrimaryForRole: false,
    password: "director@2026"
  },
  {
    id: "off-06",
    roleType: "Supervisor",
    fullName: "Dr. Fikadu Tadesse",
    officialTitle: "Center Director",
    department: "Bako Agricultural Research Center",
    phoneNumber: "+251 911 998 877",
    email: "fikadu.tadesse@oari.gov.et",
    telegramHandle: "@dr_fikadu_bako",
    stationOrCenter: "Bako Research Station, West Shewa",
    signatureSealText: "SEAL-OARI-DIR-BAK-06",
    isPrimaryForRole: false,
    password: "director@2026"
  },
  {
    id: "off-07",
    roleType: "Fleet Manager",
    fullName: "Eng. Wondimu Bedada",
    officialTitle: "Chief Transport & Fleet Logistics Officer",
    department: "Institutional Transport & Logistics Directorate",
    phoneNumber: "+251 911 223 344",
    email: "wondimu.bedada@oari.gov.et",
    telegramHandle: "@wondimu_fleet_admin",
    stationOrCenter: "OARI Central Fleet Depot",
    signatureSealText: "SEAL-OARI-FLT-SUP-01",
    isPrimaryForRole: true,
    password: "fleet@2026"
  },
  {
    id: "off-08",
    roleType: "Fleet Manager",
    fullName: "Ato Dereje Negash",
    officialTitle: "Senior Dispatch & Maintenance Supervisor",
    department: "Institutional Transport & Logistics Directorate",
    phoneNumber: "+251 911 654 321",
    email: "dereje.negash@oari.gov.et",
    telegramHandle: "@dereje_fleet_ops",
    stationOrCenter: "OARI Central Fleet Depot",
    signatureSealText: "SEAL-OARI-FLT-DISP-02",
    isPrimaryForRole: false,
    password: "fleet@2026"
  }
];

// Persistent File-based Database Storage
const DB_FILE = path.join(process.cwd(), "server_storage.json");

interface DatabaseState {
  vehicles: Vehicle[];
  drivers: Driver[];
  tripRequests: TripRequest[];
  travelLogs: TravelLog[];
  smsAlerts: SMSAlert[];
  fuelRecords: FuelRecord[];
  maintenanceRecords: MaintenanceRecord[];
  officers?: InstitutionalOfficer[];
}

function loadDatabase(): DatabaseState {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        return {
          vehicles: Array.isArray(parsed.vehicles) && parsed.vehicles.length > 0 ? parsed.vehicles : initialVehicles,
          drivers: Array.isArray(parsed.drivers) && parsed.drivers.length > 0 ? parsed.drivers : initialDrivers,
          tripRequests: Array.isArray(parsed.tripRequests) ? parsed.tripRequests : initialTripRequests,
          travelLogs: Array.isArray(parsed.travelLogs) ? parsed.travelLogs : initialTravelLogs,
          smsAlerts: Array.isArray(parsed.smsAlerts) ? parsed.smsAlerts : initialSmsAlerts,
          fuelRecords: Array.isArray(parsed.fuelRecords) ? parsed.fuelRecords : initialFuelRecords,
          maintenanceRecords: Array.isArray(parsed.maintenanceRecords) ? parsed.maintenanceRecords : initialMaintenanceRecords,
          officers: Array.isArray(parsed.officers) && parsed.officers.length > 0 ? parsed.officers : initialOfficers
        };
      }
    }
  } catch (err) {
    console.error("Error reading storage file, falling back to initial data:", err);
  }
  return {
    vehicles: initialVehicles,
    drivers: initialDrivers,
    tripRequests: initialTripRequests,
    travelLogs: initialTravelLogs,
    smsAlerts: initialSmsAlerts,
    fuelRecords: initialFuelRecords,
    maintenanceRecords: initialMaintenanceRecords,
    officers: initialOfficers
  };
}

const dbState = loadDatabase();
let vehicles: Vehicle[] = dbState.vehicles;
let drivers: Driver[] = dbState.drivers;
let tripRequests: TripRequest[] = dbState.tripRequests;
let travelLogs: TravelLog[] = dbState.travelLogs;
let smsAlerts: SMSAlert[] = dbState.smsAlerts;
let fuelRecords: FuelRecord[] = dbState.fuelRecords;
let maintenanceRecords: MaintenanceRecord[] = dbState.maintenanceRecords;
let officers: InstitutionalOfficer[] = dbState.officers || initialOfficers;

function saveDatabase() {
  try {
    const data: DatabaseState = {
      vehicles,
      drivers,
      tripRequests,
      travelLogs,
      smsAlerts,
      fuelRecords,
      maintenanceRecords,
      officers
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving database state to disk:", err);
  }
}

// Ensure database file exists on disk immediately
try {
  if (!fs.existsSync(DB_FILE)) {
    saveDatabase();
  }
} catch (e) {
  console.error("Failed to initialize database file:", e);
}

// Helper to auto-discover subscriber chats from Telegram Bot API
let knownTelegramChatIds: Set<string> = new Set();

async function discoverTelegramSubscriberChats(botToken: string): Promise<string[]> {
  try {
    const resp = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates?timeout=1`);
    const data = (await resp.json()) as any;
    if (data.ok && Array.isArray(data.result)) {
      data.result.forEach((u: any) => {
        const cId = u.message?.chat?.id || u.channel_post?.chat?.id || u.callback_query?.message?.chat?.id || u.my_chat_member?.chat?.id;
        if (cId) {
          const strId = String(cId).trim();
          // Valid Telegram chat IDs are numeric with at least 5 digits or negative group IDs
          if (/^-?\d{5,}$/.test(strId)) {
            knownTelegramChatIds.add(strId);
          }
        }
      });
    }
  } catch (err: any) {
    // Non-critical network/discovery notice
  }
  return Array.from(knownTelegramChatIds);
}

// Helper to forward real Telegram messages via Telegram Bot API (@cariqqobot)
async function forwardToTelegram(message: string, recipientHandleOrChatId?: string): Promise<{ success: boolean; deliveredTo?: string[]; error?: string }> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return { success: true, error: "TELEGRAM_BOT_TOKEN not configured" };
  }

  const targetChatIds = new Set<string>();

  // 1. If explicit numeric chat ID is passed (valid chat IDs have at least 5 digits or negative prefix)
  if (recipientHandleOrChatId && /^-?\d{5,}$/.test(recipientHandleOrChatId.trim())) {
    targetChatIds.add(recipientHandleOrChatId.trim());
  }

  // 2. If environment variable TELEGRAM_CHAT_ID is set
  if (process.env.TELEGRAM_CHAT_ID && /^-?\d{5,}$/.test(process.env.TELEGRAM_CHAT_ID.trim())) {
    targetChatIds.add(process.env.TELEGRAM_CHAT_ID.trim());
  }

  // 3. Auto-discover all chats that have messaged or /started the bot
  const discoveredChats = await discoverTelegramSubscriberChats(botToken);
  discoveredChats.forEach(id => {
    if (/^-?\d{5,}$/.test(id)) {
      targetChatIds.add(id);
    }
  });

  if (targetChatIds.size === 0) {
    return { success: true, deliveredTo: [], error: "No subscribers found. Open @cariqqobot on Telegram and tap /start." };
  }

  const deliveredTo: string[] = [];
  for (const chatId of Array.from(targetChatIds)) {
    try {
      const resp = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "Markdown"
        })
      });
      const data = (await resp.json()) as any;
      if (data.ok) {
        deliveredTo.push(chatId);
      } else {
        const desc = String(data.description || "");
        // If chat is not found, blocked, or deactivated, prune from subscriber pool
        if (desc.toLowerCase().includes("not found") || 
            desc.toLowerCase().includes("chat not found") || 
            desc.toLowerCase().includes("forbidden") || 
            desc.toLowerCase().includes("deactivated") || 
            desc.toLowerCase().includes("blocked")) {
          knownTelegramChatIds.delete(chatId);
        } else if (desc.toLowerCase().includes("parse") || desc.toLowerCase().includes("entity") || desc.toLowerCase().includes("entities")) {
          // Retry sending as plain text without Markdown formatting
          try {
            const retryResp = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: chatId,
                text: message.replace(/[*_`\[\]]/g, '')
              })
            });
            const retryData = (await retryResp.json()) as any;
            if (retryData.ok) {
              deliveredTo.push(chatId);
            }
          } catch {
            // Ignore retry error
          }
        }
      }
    } catch {
      // Network dispatch gracefully caught
    }
  }

  return { success: deliveredTo.length > 0, deliveredTo };
}

// Helper to trigger automated Multi-Channel Alert (SMS, Telegram Bot @cariqqobot, Email)
function sendAutomatedNotifications(tripReq: TripRequest, vehicle: Vehicle, driver: Driver, channels: ("SMS" | "Telegram" | "Email")[] = ["SMS", "Telegram", "Email"]) {
  const timestamp = new Date().toISOString();
  const createdAlerts: SMSAlert[] = [];

  const depTime = new Date(tripReq.departureDate).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  const tgHandle = tripReq.requesterTelegram || `@${tripReq.requesterName.toLowerCase().replace(/\s+/g, '_')}`;
  const driverTg = tripReq.assignedDriverTelegram || `@${driver.name.toLowerCase().replace(/\s+/g, '_')}_driver`;
  const reqEmail = tripReq.requesterEmail || `${tripReq.requesterName.toLowerCase().replace(/\s+/g, '.')}@oari.gov.et`;
  const botUrl = "https://t.me/cariqqobot";

  // 1. ETHIO TELECOM SMS
  if (channels.includes("SMS")) {
    const customerSMS: SMSAlert = {
      id: `sms-${Date.now()}-1`,
      channel: "SMS",
      recipientType: "Customer",
      recipientName: tripReq.requesterName,
      recipientPhone: tripReq.requesterPhone,
      recipientEmail: reqEmail,
      recipientTelegram: tgHandle,
      tripRequestNumber: tripReq.requestNumber,
      message: `[OARI TRANSPORT] Your mission #${tripReq.requestNumber} (${tripReq.tripCategory}) to ${tripReq.destination} is APPROVED & DISPATCHED. Driver: ${driver.name} (📞 ${driver.phone}). Vehicle: ${vehicle.plateNumber} (${vehicle.model}). Departure: ${depTime}. Travel Safe!`,
      status: "Delivered",
      sentAt: timestamp,
      gatewayRef: `ETHIO-SMS-${Math.floor(100000 + Math.random() * 900000)}`,
      costEtb: 0.00,
      telegramDirectUrl: botUrl
    };

    const driverSMS: SMSAlert = {
      id: `sms-${Date.now()}-2`,
      channel: "SMS",
      recipientType: "Driver",
      recipientName: driver.name,
      recipientPhone: driver.phone,
      recipientEmail: "driver.dispatch@oari.gov.et",
      recipientTelegram: driverTg,
      tripRequestNumber: tripReq.requestNumber,
      message: `[OARI DISPATCH] Assigned Mission #${tripReq.requestNumber}. Requester: ${tripReq.requesterName} (📞 ${tripReq.requesterPhone}). Route: ${tripReq.origin} -> ${tripReq.destination}. Vehicle: ${vehicle.plateNumber}. Dep: ${depTime}. Manifest issued.`,
      status: "Delivered",
      sentAt: timestamp,
      gatewayRef: `ETHIO-SMS-${Math.floor(100000 + Math.random() * 900000)}`,
      costEtb: 0.00,
      telegramDirectUrl: botUrl
    };

    createdAlerts.push(customerSMS, driverSMS);
  }

  // 2. TELEGRAM BOT NOTIFICATION (@cariqqobot)
  if (channels.includes("Telegram")) {
    const customerTG: SMSAlert = {
      id: `tg-${Date.now()}-1`,
      channel: "Telegram",
      recipientType: "Customer",
      recipientName: tripReq.requesterName,
      recipientPhone: tripReq.requesterPhone,
      recipientTelegram: tgHandle,
      tripRequestNumber: tripReq.requestNumber,
      subject: `🤖 OARI Telegram Bot (@cariqqobot) • Mission #${tripReq.requestNumber} Authorized`,
      message: `🚗 *[OARI FLEET DISPATCH - @cariqqobot]*\n` +
               `✅ *MISSION FULLY AUTHORIZED #${tripReq.requestNumber}*\n\n` +
               `🏷 *Category:* ${tripReq.tripCategory === "Inside Town" ? "🏙 Inside Town (Addis Ababa Single Day)" : "🌾 Outside Town (Field Expedition)"}\n` +
               `🏛 *Station Base:* ${tripReq.stationBase}\n` +
               `📍 *Destination:* ${tripReq.destination} (~${tripReq.estimatedKm || 30} km)\n` +
               `🚘 *Vehicle:* ${vehicle.plateNumber} — ${vehicle.model}\n` +
               `👤 *Assigned Driver:* ${driver.name} (📞 ${driver.phone} | ${driverTg})\n` +
               `📅 *Departure:* ${depTime}\n` +
               `⛽ *Fuel Allocation:* ${tripReq.estimatedFuelLiters || 15} Liters Diesel\n\n` +
               `👉 *Interact with Bot:* ${botUrl}`,
      status: "Delivered",
      sentAt: timestamp,
      gatewayRef: `TG-BOT-${Math.floor(100000 + Math.random() * 900000)}`,
      costEtb: 0.00,
      telegramDirectUrl: botUrl
    };

    const driverTG: SMSAlert = {
      id: `tg-${Date.now()}-2`,
      channel: "Telegram",
      recipientType: "Driver",
      recipientName: driver.name,
      recipientPhone: driver.phone,
      recipientTelegram: driverTg,
      tripRequestNumber: tripReq.requestNumber,
      subject: `🤖 OARI Telegram Bot (@cariqqobot) • New Driver Dispatch Manifest`,
      message: `📋 *[NEW DRIVER MISSION - @cariqqobot]*\n\n` +
               `🆔 *Trip ID:* #${tripReq.requestNumber} (${tripReq.tripCategory})\n` +
               `👨‍🔬 *Requester:* ${tripReq.requesterName} (${tripReq.department})\n` +
               `📞 *Contact:* ${tripReq.requesterPhone} (${tgHandle})\n` +
               `🗺 *Route:* ${tripReq.origin} ➔ ${tripReq.destination}\n` +
               `🚙 *Car Plate:* ${vehicle.plateNumber} (Odometer: ${vehicle.odometerKm} km)\n` +
               `⏰ *Schedule:* ${depTime}\n\n` +
               `👉 *Confirm on Bot:* ${botUrl}`,
      status: "Delivered",
      sentAt: timestamp,
      gatewayRef: `TG-BOT-${Math.floor(100000 + Math.random() * 900000)}`,
      costEtb: 0.00,
      telegramDirectUrl: botUrl
    };

    createdAlerts.push(customerTG, driverTG);
    forwardToTelegram(customerTG.message);
    forwardToTelegram(driverTG.message);
  }

  // 3. OFFICIAL EMAIL DISPATCH (transport@oari.gov.et)
  if (channels.includes("Email")) {
    const customerEmail: SMSAlert = {
      id: `email-${Date.now()}-1`,
      channel: "Email",
      recipientType: "Customer",
      recipientName: tripReq.requesterName,
      recipientPhone: tripReq.requesterPhone,
      recipientEmail: reqEmail,
      recipientTelegram: tgHandle,
      tripRequestNumber: tripReq.requestNumber,
      subject: `[OARI Logistics] Official Travel Authorization & Vehicle Dispatch #${tripReq.requestNumber}`,
      message: `Dear ${tripReq.requesterName},\n\n` +
               `Your transportation request #${tripReq.requestNumber} (${tripReq.tripCategory}) has been authorized by Immediate Directorate & Fleet Logistics.\n\n` +
               `DISPATCH DETAILS:\n` +
               `• Destination: ${tripReq.destination}\n` +
               `• Allocated Vehicle: ${vehicle.plateNumber} (${vehicle.model})\n` +
               `• Official Driver: ${driver.name} (Phone: ${driver.phone})\n` +
               `• Departure Schedule: ${depTime}\n` +
               `• Station Base: ${tripReq.stationBase}\n` +
               `• Telegram Bot: https://t.me/cariqqobot\n\n` +
               `Transport & Fleet Management Directorate\nOromia Agricultural Research Institute`,
      status: "Delivered",
      sentAt: timestamp,
      gatewayRef: `SMTP-OARI-${Math.floor(100000 + Math.random() * 900000)}`,
      costEtb: 0.00,
      telegramDirectUrl: botUrl
    };

    createdAlerts.push(customerEmail);
  }

  smsAlerts.unshift(...createdAlerts);
  return createdAlerts;
}

// -------------------------------------------------------------
// REST API ROUTES
// -------------------------------------------------------------

// System metadata & Research centers
app.get("/api/centers", (req, res) => {
  res.json({ centers: researchCenters });
});

// Vehicles
app.get("/api/vehicles", (req, res) => {
  res.json({ vehicles });
});

app.post("/api/vehicles", (req, res) => {
  const newVehicle: Vehicle = {
    id: req.body.id || `v-${Date.now()}`,
    code: req.body.code || `OARI-FLT-${String(vehicles.length + 1).padStart(2, '0')}`,
    plateNumber: req.body.plateNumber || "4-45000 ET",
    model: req.body.model || "Toyota Hilux 4x4",
    type: req.body.type || "4WD Pickup",
    stationBase: req.body.stationBase || "OARI Headquarter",
    year: Number(req.body.year) || 2024,
    fuelType: req.body.fuelType || "Diesel",
    fuelTankCapacity: Number(req.body.fuelTankCapacity) || 80,
    currentFuelLevel: Number(req.body.currentFuelLevel) || 70,
    odometerKm: Number(req.body.odometerKm) || 20000,
    status: req.body.status || "Available",
    assignedDriverName: req.body.assignedDriverName || "Station Pool Driver",
    driverPhone: req.body.driverPhone || "+251 911 000 000",
    nextServiceKm: Number(req.body.nextServiceKm) || 25000,
    lastServiceDate: req.body.lastServiceDate || new Date().toISOString().split('T')[0],
    features: req.body.features || ["Heavy Duty 4WD", "High Clearance", "GPS Tracker"],
    coordinates: req.body.coordinates || { lat: 9.032, lng: 38.746 },
    ...req.body
  };

  // If assigned driver was set
  if (newVehicle.assignedDriverName && newVehicle.assignedDriverName !== "Station Pool Driver" && newVehicle.assignedDriverName !== "Unassigned / Pool Driver") {
    const matchedDriver = drivers.find(d => d.id === newVehicle.assignedDriverId || d.name.toLowerCase() === newVehicle.assignedDriverName?.toLowerCase());
    if (matchedDriver) {
      matchedDriver.assignedVehiclePlate = newVehicle.plateNumber;
      matchedDriver.currentVehicleId = newVehicle.id;
      matchedDriver.stationBase = newVehicle.stationBase || matchedDriver.stationBase;
      if (newVehicle.driverPhone) matchedDriver.phone = newVehicle.driverPhone;
    }
  }

  vehicles.unshift(newVehicle);
  saveDatabase();
  res.status(201).json({ vehicle: newVehicle, message: "Vehicle registered successfully" });
});

// Full Vehicle Update
app.put("/api/vehicles/:id", (req, res) => {
  const { id } = req.params;
  const index = vehicles.findIndex(v => v.id === id || v.plateNumber === id);
  if (index === -1) {
    // If not found, upsert
    const newVehicle: Vehicle = {
      id: id || `v-${Date.now()}`,
      code: req.body.code || `OARI-FLT-${String(vehicles.length + 1).padStart(2, '0')}`,
      plateNumber: req.body.plateNumber || "4-45000 ET",
      model: req.body.model || "Toyota Hilux 4x4",
      type: req.body.type || "4WD Pickup",
      stationBase: req.body.stationBase || "OARI Headquarter",
      year: Number(req.body.year) || 2024,
      fuelType: req.body.fuelType || "Diesel",
      fuelTankCapacity: Number(req.body.fuelTankCapacity) || 80,
      currentFuelLevel: Number(req.body.currentFuelLevel) || 70,
      odometerKm: Number(req.body.odometerKm) || 20000,
      status: req.body.status || "Available",
      assignedDriverName: req.body.assignedDriverName || "Station Pool Driver",
      driverPhone: req.body.driverPhone || "+251 911 000 000",
      nextServiceKm: Number(req.body.nextServiceKm) || 25000,
      lastServiceDate: req.body.lastServiceDate || new Date().toISOString().split('T')[0],
      features: req.body.features || ["Heavy Duty 4WD", "High Clearance", "GPS Tracker"],
      coordinates: req.body.coordinates || { lat: 9.032, lng: 38.746 },
      ...req.body
    };
    vehicles.unshift(newVehicle);
    saveDatabase();
    return res.json({ vehicle: newVehicle, message: "Vehicle created and saved" });
  }

  const oldVehicle = { ...vehicles[index] };
  vehicles[index] = {
    ...vehicles[index],
    ...req.body,
    id: vehicles[index].id // preserve internal id
  };

  const updatedVehicle = vehicles[index];

  // Cascading Driver assignment sync
  if (updatedVehicle.assignedDriverName && updatedVehicle.assignedDriverName !== "Station Pool Driver" && updatedVehicle.assignedDriverName !== "Unassigned / Pool Driver") {
    const matchedDriver = drivers.find(d => d.id === updatedVehicle.assignedDriverId || d.name.toLowerCase() === updatedVehicle.assignedDriverName?.toLowerCase());
    if (matchedDriver) {
      matchedDriver.assignedVehiclePlate = updatedVehicle.plateNumber;
      matchedDriver.currentVehicleId = updatedVehicle.id;
      matchedDriver.stationBase = updatedVehicle.stationBase || matchedDriver.stationBase;
      if (updatedVehicle.driverPhone) matchedDriver.phone = updatedVehicle.driverPhone;

      // Clear any other driver that had this plate
      drivers.forEach(d => {
        if (d.id !== matchedDriver.id && d.assignedVehiclePlate === updatedVehicle.plateNumber) {
          d.assignedVehiclePlate = "Unassigned / Pool Car";
        }
      });
    }
  } else if (!updatedVehicle.assignedDriverName || updatedVehicle.assignedDriverName === "Station Pool Driver" || updatedVehicle.assignedDriverName === "Unassigned / Pool Driver") {
    // Unassign driver from this vehicle
    drivers.forEach(d => {
      if (d.assignedVehiclePlate === oldVehicle.plateNumber || d.assignedVehiclePlate === updatedVehicle.plateNumber) {
        d.assignedVehiclePlate = "Unassigned / Pool Car";
      }
    });
  }

  // Cascading Sync: Update travelLogs referencing this vehicle
  travelLogs.forEach(log => {
    if (log.vehicleId === id || log.vehiclePlate === oldVehicle.plateNumber) {
      log.vehiclePlate = updatedVehicle.plateNumber;
      if (updatedVehicle.assignedDriverName && updatedVehicle.assignedDriverName !== "Station Pool Driver") {
        log.driverName = updatedVehicle.assignedDriverName;
      }
    }
  });

  // Cascading Sync: Update tripRequests referencing this vehicle
  tripRequests.forEach(reqItem => {
    if (reqItem.assignedVehicleId === id || reqItem.assignedVehiclePlate === oldVehicle.plateNumber) {
      reqItem.assignedVehiclePlate = updatedVehicle.plateNumber;
      if (updatedVehicle.assignedDriverName) reqItem.assignedDriverName = updatedVehicle.assignedDriverName;
      if (updatedVehicle.driverPhone) reqItem.assignedDriverPhone = updatedVehicle.driverPhone;
    }
  });

  saveDatabase();
  res.json({ vehicle: vehicles[index], message: "Vehicle details updated and synchronized across fleet, drivers, travel logs & requests." });
});

// Delete Vehicle
app.delete("/api/vehicles/:id", (req, res) => {
  const { id } = req.params;
  const index = vehicles.findIndex(v => v.id === id || v.plateNumber === id);
  if (index === -1) {
    return res.status(404).json({ error: "Vehicle not found" });
  }

  const deleted = vehicles.splice(index, 1)[0];

  // Unassign drivers linked to this vehicle
  drivers.forEach(d => {
    if (d.assignedVehiclePlate === deleted.plateNumber || d.currentVehicleId === deleted.id) {
      d.assignedVehiclePlate = "Unassigned / Pool Car";
    }
  });

  saveDatabase();
  res.json({ message: "Vehicle deleted from fleet successfully", vehicle: deleted });
});

app.patch("/api/vehicles/:id/status", (req, res) => {
  const { id } = req.params;
  const { status, odometerKm, currentFuelLevel } = req.body;
  const vehicle = vehicles.find(v => v.id === id || v.plateNumber === id);
  if (!vehicle) {
    return res.status(404).json({ error: "Vehicle not found" });
  }
  if (status) vehicle.status = status;
  if (odometerKm !== undefined) vehicle.odometerKm = Number(odometerKm);
  if (currentFuelLevel !== undefined) vehicle.currentFuelLevel = Number(currentFuelLevel);
  saveDatabase();
  res.json({ vehicle, message: "Vehicle status updated" });
});

// Drivers Management & Cascading Sync
app.get("/api/drivers", (req, res) => {
  res.json({ drivers });
});

app.post("/api/drivers", (req, res) => {
  const newDriver: Driver = {
    id: req.body.id || `d-${Date.now()}`,
    name: req.body.name || "New Driver",
    phone: req.body.phone || "+251 911 000 000",
    telegramHandle: req.body.telegramHandle || `@${(req.body.name || 'driver').toLowerCase().replace(/\s+/g, '_')}`,
    licenseNumber: req.body.licenseNumber || `ETH-DL-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    stationBase: req.body.stationBase || "OARI Headquarter",
    experienceYears: Number(req.body.experienceYears) || 5,
    rating: Number(req.body.rating) || 5.0,
    status: req.body.status || "Active / Available",
    assignedVehiclePlate: req.body.assignedVehiclePlate || "Unassigned / Pool Car",
    ...req.body
  };

  // If assigned to a registered vehicle, update that vehicle
  if (newDriver.assignedVehiclePlate && newDriver.assignedVehiclePlate !== "Unassigned / Pool Car" && newDriver.assignedVehiclePlate !== "Station Pool" && newDriver.assignedVehiclePlate !== "None") {
    const targetVeh = vehicles.find(v => v.plateNumber === newDriver.assignedVehiclePlate || v.id === newDriver.assignedVehicleId);
    if (targetVeh) {
      targetVeh.assignedDriverId = newDriver.id;
      targetVeh.assignedDriverName = newDriver.name;
      targetVeh.driverPhone = newDriver.phone;
      targetVeh.stationBase = newDriver.stationBase || targetVeh.stationBase;
      newDriver.assignedVehiclePlate = targetVeh.plateNumber;
    }
  }

  drivers.push(newDriver);
  saveDatabase();
  res.status(201).json({ driver: newDriver, message: "Driver profile created and assigned successfully" });
});

// Update Driver & Cascade Updates to Vehicles, Travel Logs & Trip Requests
app.put("/api/drivers/:id", (req, res) => {
  const { id } = req.params;
  const index = drivers.findIndex(d => d.id === id);
  if (index === -1) {
    // If not found, upsert
    const newDriver: Driver = {
      id: id || `d-${Date.now()}`,
      name: req.body.name || "New Driver",
      phone: req.body.phone || "+251 911 000 000",
      telegramHandle: req.body.telegramHandle || `@${(req.body.name || 'driver').toLowerCase().replace(/\s+/g, '_')}`,
      licenseNumber: req.body.licenseNumber || `ETH-DL-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      stationBase: req.body.stationBase || "OARI Headquarter",
      experienceYears: Number(req.body.experienceYears) || 5,
      rating: Number(req.body.rating) || 5.0,
      status: req.body.status || "Active / Available",
      assignedVehiclePlate: req.body.assignedVehiclePlate || "Unassigned / Pool Car",
      ...req.body
    };
    drivers.push(newDriver);
    saveDatabase();
    return res.json({ driver: newDriver, message: "Driver created and saved" });
  }

  const oldDriver = { ...drivers[index] };
  drivers[index] = {
    ...drivers[index],
    ...req.body,
    id // preserve id
  };
  const updatedDriver = drivers[index];

  // 1. If assignedVehiclePlate is specified, link or unlink
  if (updatedDriver.assignedVehiclePlate && updatedDriver.assignedVehiclePlate !== "Unassigned / Pool Car" && updatedDriver.assignedVehiclePlate !== "Station Pool" && updatedDriver.assignedVehiclePlate !== "None") {
    const targetVeh = vehicles.find(v => v.plateNumber === updatedDriver.assignedVehiclePlate || v.id === updatedDriver.assignedVehicleId);
    if (targetVeh) {
      targetVeh.assignedDriverId = updatedDriver.id;
      targetVeh.assignedDriverName = updatedDriver.name;
      targetVeh.driverPhone = updatedDriver.phone;
      targetVeh.stationBase = updatedDriver.stationBase || targetVeh.stationBase;
      updatedDriver.assignedVehiclePlate = targetVeh.plateNumber;

      // Clear any other vehicles that had this driver
      vehicles.forEach(v => {
        if (v.id !== targetVeh.id && (v.assignedDriverId === updatedDriver.id || (v.assignedDriverName === oldDriver.name && v.plateNumber !== targetVeh.plateNumber))) {
          v.assignedDriverName = "Station Pool Driver";
          v.driverPhone = "+251 911 000 000";
          v.assignedDriverId = undefined;
        }
      });
    }
  } else if (updatedDriver.assignedVehiclePlate === "Unassigned / Pool Car" || updatedDriver.assignedVehiclePlate === "Station Pool" || !updatedDriver.assignedVehiclePlate) {
    // Unassign from vehicles
    vehicles.forEach(v => {
      if (v.assignedDriverId === id || v.assignedDriverName === oldDriver.name) {
        v.assignedDriverName = "Station Pool Driver";
        v.driverPhone = "+251 911 000 000";
        v.assignedDriverId = undefined;
      }
    });
  }

  // 2. Cascade update to all vehicles already assigned to this driver
  vehicles.forEach(v => {
    if (v.assignedDriverId === id || v.assignedDriverName === oldDriver.name) {
      v.assignedDriverName = updatedDriver.name;
      v.driverPhone = updatedDriver.phone;
      if (updatedDriver.stationBase) v.stationBase = updatedDriver.stationBase;
    }
  });

  // 3. Cascade update to all travelLogs featuring this driver
  travelLogs.forEach(log => {
    if (log.driverId === id || log.driverName === oldDriver.name) {
      log.driverName = updatedDriver.name;
    }
  });

  // 4. Cascade update to all tripRequests assigned to this driver
  tripRequests.forEach(reqItem => {
    if (reqItem.assignedDriverId === id || reqItem.assignedDriverName === oldDriver.name) {
      reqItem.assignedDriverName = updatedDriver.name;
      reqItem.assignedDriverPhone = updatedDriver.phone;
      if (updatedDriver.telegramHandle) reqItem.assignedDriverTelegram = updatedDriver.telegramHandle;
    }
  });

  saveDatabase();
  res.json({
    driver: updatedDriver,
    message: "Driver profile updated and synchronized across all vehicles, travel logs, and manifest registers."
  });
});

// Delete Driver
app.delete("/api/drivers/:id", (req, res) => {
  const { id } = req.params;
  const index = drivers.findIndex(d => d.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Driver not found" });
  }
  const deleted = drivers.splice(index, 1)[0];

  // Unassign from vehicles
  vehicles.forEach(v => {
    if (v.assignedDriverId === id || v.assignedDriverName === deleted.name) {
      v.assignedDriverName = "Station Pool Driver";
      v.driverPhone = "+251 911 000 000";
      v.assignedDriverId = undefined;
    }
  });

  saveDatabase();
  res.json({ message: "Driver removed from registry", driver: deleted });
});

// -------------------------------------------------------------
// INSTITUTIONAL OFFICERS (Directors, Supervisors & Fleet Managers)
// -------------------------------------------------------------
app.get("/api/officers", (req, res) => {
  res.json({ officers });
});

app.post("/api/officers", (req, res) => {
  const { roleType, fullName, officialTitle, department, phoneNumber, email, telegramHandle, stationOrCenter, signatureSealText, isPrimaryForRole } = req.body;
  if (!fullName || !officialTitle || !department) {
    return res.status(400).json({ error: "Full Name, Official Title and Directorate/Department are required." });
  }

  // If this officer is marked as primary for this role type, unmark other primary officers of this type
  if (isPrimaryForRole) {
    officers.forEach(o => {
      if (o.roleType === roleType) o.isPrimaryForRole = false;
    });
  }

  const newOfficer: InstitutionalOfficer = {
    id: `off-${Date.now()}`,
    roleType: roleType || "Director",
    fullName,
    officialTitle,
    department,
    phoneNumber: phoneNumber || "+251 911 000 000",
    email: email || `${fullName.toLowerCase().replace(/\s+/g, '.')}@oari.gov.et`,
    telegramHandle: telegramHandle || `@${fullName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
    stationOrCenter: stationOrCenter || "OARI Headquarter, Addis Ababa",
    signatureSealText: signatureSealText || `SEAL-OARI-${(roleType || 'DIR').substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
    isPrimaryForRole: Boolean(isPrimaryForRole)
  };

  officers.push(newOfficer);
  saveDatabase();
  res.status(201).json({ officer: newOfficer, message: `${roleType} profile registered successfully.` });
});

app.put("/api/officers/:id", (req, res) => {
  const { id } = req.params;
  const index = officers.findIndex(o => o.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Officer not found" });
  }

  const oldOfficer = { ...officers[index] };
  const updatedOfficer = {
    ...officers[index],
    ...req.body,
    id
  };

  // If set to primary, demote other officers of same role
  if (req.body.isPrimaryForRole) {
    officers.forEach(o => {
      if (o.id !== id && o.roleType === updatedOfficer.roleType) {
        o.isPrimaryForRole = false;
      }
    });
  }

  officers[index] = updatedOfficer;
  saveDatabase();
  res.json({
    officer: updatedOfficer,
    message: `${updatedOfficer.fullName} (${updatedOfficer.officialTitle}) profile updated in institutional registry.`
  });
});

app.post("/api/officers/set-active", (req, res) => {
  const { officerId, roleType } = req.body;
  const target = officers.find(o => o.id === officerId);
  if (!target) {
    return res.status(404).json({ error: "Officer not found" });
  }

  officers.forEach(o => {
    if (o.roleType === (roleType || target.roleType)) {
      o.isPrimaryForRole = (o.id === officerId);
    }
  });

  saveDatabase();
  res.json({
    message: `${target.fullName} is now set as the active designated authority for ${target.roleType} approvals and reports.`,
    officers
  });
});

app.delete("/api/officers/:id", (req, res) => {
  const { id } = req.params;
  const index = officers.findIndex(o => o.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Officer not found" });
  }

  // Ensure at least one Director and one Fleet Manager remains
  const officerToDelete = officers[index];
  const sameRoleCount = officers.filter(o => o.roleType === officerToDelete.roleType).length;
  if (sameRoleCount <= 1) {
    return res.status(400).json({ error: `Cannot delete the only registered ${officerToDelete.roleType}. Register a replacement first.` });
  }

  const deleted = officers.splice(index, 1)[0];
  
  // If deleted officer was primary, promote the first remaining of that role
  if (deleted.isPrimaryForRole) {
    const nextPrimary = officers.find(o => o.roleType === deleted.roleType);
    if (nextPrimary) nextPrimary.isPrimaryForRole = true;
  }

  saveDatabase();
  res.json({ message: "Officer removed from registry", officer: deleted });
});

// Update Officer Password
app.post("/api/officers/:id/update-password", (req, res) => {
  const { id } = req.params;
  const { currentPassword, newPassword } = req.body;

  if (!newPassword || newPassword.trim().length < 4) {
    return res.status(400).json({ error: "New password must be at least 4 characters long." });
  }

  const officer = officers.find(o => o.id === id);
  if (!officer) {
    return res.status(404).json({ error: "Officer record not found." });
  }

  // If current password provided, verify it
  const existingPassword = officer.password || (officer.roleType === "Fleet Manager" ? "fleet@2026" : "director@2026");
  if (currentPassword && currentPassword.trim() !== existingPassword) {
    return res.status(401).json({ error: "Current password entered does not match." });
  }

  officer.password = newPassword.trim();
  saveDatabase();

  // Also log email confirmation dispatch
  const emailAlert: SMSAlert = {
    id: `email-pwd-${Date.now()}`,
    channel: "Email",
    recipientType: officer.roleType === "Fleet Manager" ? "Fleet Manager" : "Director",
    recipientName: officer.fullName,
    recipientPhone: officer.phoneNumber,
    recipientEmail: officer.email,
    recipientTelegram: officer.telegramHandle,
    tripRequestNumber: "SEC-PWD-UPDATE",
    subject: `[OARI Security] Password Updated for ${officer.fullName}`,
    message: `Dear ${officer.fullName},\n\n` +
             `Your institutional account password for ${officer.officialTitle} has been updated successfully.\n\n` +
             `New Password: ${newPassword.trim()}\n` +
             `Updated At: ${new Date().toLocaleString()}\n\n` +
             `If you did not make this change, please contact OARI Institutional Transport & Logistics IT immediately.\n\n` +
             `OARI Security Directorate`,
    status: "Delivered",
    sentAt: new Date().toISOString(),
    gatewayRef: `SMTP-SEC-${Math.floor(100000 + Math.random() * 900000)}`,
    costEtb: 0.00
  };
  smsAlerts.unshift(emailAlert);
  saveDatabase();

  res.json({
    success: true,
    message: `Password updated successfully for ${officer.fullName}. Notification sent to ${officer.email}.`,
    officer
  });
});

// Forgot Password - Send Password to Officer's Email
app.post("/api/officers/forgot-password", (req, res) => {
  const { email, officerId, role } = req.body;

  let targetOfficer: InstitutionalOfficer | undefined;

  if (officerId) {
    targetOfficer = officers.find(o => o.id === officerId);
  } else if (email) {
    const cleanEmail = email.trim().toLowerCase();
    targetOfficer = officers.find(o => o.email.toLowerCase() === cleanEmail || o.fullName.toLowerCase().includes(cleanEmail));
  } else if (role) {
    targetOfficer = officers.find(o => o.roleType === (role.includes("Fleet") ? "Fleet Manager" : "Director") && o.isPrimaryForRole) ||
                    officers.find(o => o.roleType === (role.includes("Fleet") ? "Fleet Manager" : "Director"));
  }

  // Fallback to first director if not found
  if (!targetOfficer) {
    targetOfficer = officers[0];
  }

  const recoveryPin = `OARI-PIN-${Math.floor(100000 + Math.random() * 900000)}`;
  const currentPassword = targetOfficer.password || (targetOfficer.roleType === "Fleet Manager" ? "fleet@2026" : "director@2026");
  const recipientEmail = (email && email.includes("@")) ? email.trim() : targetOfficer.email;

  const emailAlert: SMSAlert = {
    id: `email-reset-${Date.now()}`,
    channel: "Email",
    recipientType: targetOfficer.roleType === "Fleet Manager" ? "Fleet Manager" : "Director",
    recipientName: targetOfficer.fullName,
    recipientPhone: targetOfficer.phoneNumber,
    recipientEmail: recipientEmail,
    recipientTelegram: targetOfficer.telegramHandle,
    tripRequestNumber: "SEC-RECOVERY",
    subject: `[OARI Security] Password Recovery Credentials for ${targetOfficer.fullName}`,
    message: `Dear ${targetOfficer.fullName},\n\n` +
             `Here are your requested account credentials for the Oromia Agricultural Research Institute (OARI) Fleet Management System:\n\n` +
             `👤 Official Title: ${targetOfficer.officialTitle}\n` +
             `🏛 Directorate / Center: ${targetOfficer.department}\n` +
             `📧 Registered Email: ${recipientEmail}\n` +
             `🔑 Current Password: ${currentPassword}\n` +
             `🔢 One-Time Recovery PIN: ${recoveryPin}\n\n` +
             `You can use this password to authenticate immediately, or use the "Update Password" tool in the login dialog to set a new password.\n\n` +
             `Transport & Fleet Logistics Directorate\n` +
             `Oromia Agricultural Research Institute (OARI)\n` +
             `Inistiitiyuutii Qorannoo Qonnaa Oromiyaa (IQQO)`,
    status: "Delivered",
    sentAt: new Date().toISOString(),
    gatewayRef: `SMTP-OARI-RECOVER-${Math.floor(100000 + Math.random() * 900000)}`,
    costEtb: 0.00
  };

  smsAlerts.unshift(emailAlert);
  saveDatabase();

  res.json({
    success: true,
    message: `Password credentials and recovery PIN have been dispatched to ${recipientEmail}.`,
    recipientEmail,
    officerName: targetOfficer.fullName,
    currentPassword,
    recoveryPin,
    alert: emailAlert
  });
});

// Telegram Forwarding & Webhook Bridge Endpoint (@cariqqobot)
app.get("/api/telegram/status", async (req, res) => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return res.json({
      configured: false,
      botHandle: "@cariqqobot",
      message: "TELEGRAM_BOT_TOKEN is not set in environment settings.",
      activeSubscribers: Array.from(knownTelegramChatIds)
    });
  }

  try {
    const [meResp, updatesResp] = await Promise.all([
      fetch(`https://api.telegram.org/bot${botToken}/getMe`),
      fetch(`https://api.telegram.org/bot${botToken}/getUpdates?timeout=1`)
    ]);
    const meData = (await meResp.json()) as any;
    const updatesData = (await updatesResp.json()) as any;

    if (updatesData.ok && Array.isArray(updatesData.result)) {
      updatesData.result.forEach((u: any) => {
        const cId = u.message?.chat?.id || u.channel_post?.chat?.id || u.callback_query?.message?.chat?.id;
        if (cId) knownTelegramChatIds.add(String(cId));
      });
    }

    res.json({
      configured: true,
      botInfo: meData.result,
      activeSubscribersCount: knownTelegramChatIds.size,
      activeSubscribers: Array.from(knownTelegramChatIds),
      botHandle: meData.result?.username ? `@${meData.result.username}` : "@cariqqobot"
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Failed to query Telegram API" });
  }
});

app.post("/api/telegram/send", async (req, res) => {
  const { message, text, recipientTelegram, tripRequestNumber, channel } = req.body;
  const content = message || text || "Test broadcast from OARI Fleet Control System.";
  const botUrl = "https://t.me/cariqqobot";

  // Forward to real Telegram Bot API if token configured
  const tgResult = await forwardToTelegram(content, recipientTelegram);

  const timestamp = new Date().toISOString();
  const alertEntry: SMSAlert = {
    id: `tg-${Date.now()}-fwd`,
    channel: "Telegram",
    recipientType: "Customer",
    recipientName: recipientTelegram || "OARI Bot Subscriber",
    recipientPhone: "+251 911 000 000",
    recipientTelegram: recipientTelegram || "@cariqqobot",
    tripRequestNumber: tripRequestNumber || "OARI-BROADCAST",
    subject: `🤖 Telegram Bot Forwarding (@cariqqobot)`,
    message: content,
    status: "Delivered",
    sentAt: timestamp,
    gatewayRef: `TG-DIRECT-${Math.floor(100000 + Math.random() * 900000)}`,
    costEtb: 0.00,
    telegramDirectUrl: botUrl
  };

  smsAlerts.unshift(alertEntry);
  saveDatabase();

  res.json({
    success: true,
    message: "Message dispatched to Telegram Bot gateway (@cariqqobot)",
    telegramBotUrl: botUrl,
    alert: alertEntry,
    liveApiResult: tgResult
  });
});

// Trip Requests
app.get("/api/requests", (req, res) => {
  res.json({ requests: tripRequests });
});

app.post("/api/requests", (req, res) => {
  const count = tripRequests.length + 1;
  const reqNum = `OARI-REQ-2026-${String(80 + count).padStart(3, '0')}`;
  const botUrl = "https://t.me/cariqqobot";
  const newReq: TripRequest = {
    origin: req.body.origin || "OARI Headquarter",
    destination: req.body.destination || "Sinana Agricultural Research Center",
    departureDate: req.body.departureDate || new Date().toISOString(),
    returnDate: req.body.returnDate || new Date().toISOString(),
    purpose: req.body.purpose || "Official Research Field Operations",
    department: req.body.department || "Crops Directorate",
    requesterName: req.body.requesterName || "OARI Staff",
    requesterPhone: req.body.requesterPhone || "+251 911 000 000",
    requesterEmail: req.body.requesterEmail || "staff@oari.gov.et",
    stationBase: req.body.stationBase || "OARI Headquarter",
    passengerCount: Number(req.body.passengerCount) || 1,
    passengerNames: req.body.passengerNames || [],
    cargoDescription: req.body.cargoDescription || "",
    cargoWeightKg: Number(req.body.cargoWeightKg) || 0,
    urgency: req.body.urgency || "Normal",
    estimatedKm: Number(req.body.estimatedKm) || 120,
    estimatedFuelLiters: Number(req.body.estimatedFuelLiters) || 25,
    tripCategory: req.body.tripCategory || "Outside Town",
    ...req.body,
    // Guarantee required identifiers and initial state
    id: `req-${Date.now()}`,
    requestNumber: reqNum,
    createdAt: new Date().toISOString(),
    status: "Pending Director Approval",
    telegramBotUrl: `${botUrl}?start=${reqNum.toLowerCase().replace(/-/g, '_')}`
  };
  tripRequests.unshift(newReq);

  // Send Immediate Director Telegram & SMS Notifications
  const timestamp = new Date().toISOString();
  const reqTg = newReq.requesterTelegram || `@${newReq.requesterName.toLowerCase().replace(/\s+/g, '_')}`;

  const dirTgNotice: SMSAlert = {
    id: `tg-${Date.now()}-dir-req`,
    channel: "Telegram",
    recipientType: "Director",
    recipientName: "Directorate Director",
    recipientPhone: "+251 911 000 000",
    recipientTelegram: "@director_oari",
    tripRequestNumber: newReq.requestNumber,
    subject: `🤖 OARI Telegram Bot (@cariqqobot) • New Request Awaiting Director Review`,
    message: `📋 *[NEW CAR BOOKING - STAGE 1 DIRECTOR REVIEW REQUIRED]*\n\n` +
             `🆔 *Request:* #${newReq.requestNumber}\n` +
             `🏷 *Category:* ${newReq.tripCategory === "Inside Town" ? "🏙 Inside Town (Addis Ababa Single Day)" : "🌾 Outside Town (Field Expedition)"}\n` +
             `👨‍🔬 *Requester:* ${newReq.requesterName} (${newReq.department})\n` +
             `📞 *Contact:* ${newReq.requesterPhone} (${reqTg})\n` +
             `📍 *Destination:* ${newReq.destination} (Base: ${newReq.stationBase})\n` +
             `📅 *Date:* ${newReq.departureDate}\n` +
             `🎯 *Purpose:* ${newReq.purpose}\n\n` +
             `👉 *Review & Permit/Deny on Bot:* ${botUrl}`,
    status: "Delivered",
    sentAt: timestamp,
    gatewayRef: `TG-BOT-${Math.floor(100000 + Math.random() * 900000)}`,
    costEtb: 0.00,
    telegramDirectUrl: botUrl
  };

  const dirSmsNotice: SMSAlert = {
    id: `sms-${Date.now()}-dir-req`,
    channel: "SMS",
    recipientType: "Director",
    recipientName: "Directorate Director",
    recipientPhone: "+251 911 000 000",
    tripRequestNumber: newReq.requestNumber,
    message: `[OARI DISPATCH] New Trip Request #${newReq.requestNumber} from ${newReq.requesterName} (${newReq.department}) to ${newReq.destination} requires your Stage 1 endorsement. Review at system or Telegram @cariqqobot`,
    status: "Delivered",
    sentAt: timestamp,
    gatewayRef: `ETHIO-SMS-${Math.floor(100000 + Math.random() * 900000)}`,
    costEtb: 0.00,
    telegramDirectUrl: botUrl
  };

  const empTgNotice: SMSAlert = {
    id: `tg-${Date.now()}-emp-sub`,
    channel: "Telegram",
    recipientType: "Customer",
    recipientName: newReq.requesterName,
    recipientPhone: newReq.requesterPhone,
    recipientTelegram: reqTg,
    tripRequestNumber: newReq.requestNumber,
    subject: `🤖 OARI Telegram Bot (@cariqqobot) • Request Submitted Successfully`,
    message: `🚗 *[OARI CAR BOOKING SUBMITTED - @cariqqobot]*\n\n` +
             `Your trip request #${newReq.requestNumber} to *${newReq.destination}* was successfully queued for Stage 1 Immediate Director Endorsement.\n\n` +
             `Once your director permits the trip, the Fleet Manager will allocate a vehicle & driver.\n\n` +
             `👉 *Track on Bot:* ${botUrl}`,
    status: "Delivered",
    sentAt: timestamp,
    gatewayRef: `TG-BOT-${Math.floor(100000 + Math.random() * 900000)}`,
    costEtb: 0.00,
    telegramDirectUrl: botUrl
  };

  const empSmsNotice: SMSAlert = {
    id: `sms-${Date.now()}-emp-sub`,
    channel: "SMS",
    recipientType: "Customer",
    recipientName: newReq.requesterName,
    recipientPhone: newReq.requesterPhone,
    tripRequestNumber: newReq.requestNumber,
    message: `[OARI NOTICE] Your trip booking #${newReq.requestNumber} to ${newReq.destination} is submitted and queued for Immediate Director review. Bot: ${botUrl}`,
    status: "Delivered",
    sentAt: timestamp,
    gatewayRef: `ETHIO-SMS-${Math.floor(100000 + Math.random() * 900000)}`,
    costEtb: 0.00,
    telegramDirectUrl: botUrl
  };

  smsAlerts.unshift(dirTgNotice, dirSmsNotice, empTgNotice, empSmsNotice);
  forwardToTelegram(dirTgNotice.message);
  forwardToTelegram(empTgNotice.message);
  saveDatabase();

  res.status(201).json({
    request: newReq,
    alerts: [dirTgNotice, dirSmsNotice, empTgNotice, empSmsNotice],
    message: "Trip service request submitted and forwarded immediately for Stage 1 Director Review."
  });
});

// STAGE 1: Immediate Director Permit or Deny
app.post("/api/requests/:id/director-review", (req, res) => {
  const { id } = req.params;
  const { action, directorName = "Immediate Directorate Director", directorNotes, notes, rejectionReason } = req.body;
  const tripReq = tripRequests.find(r => r.id === id);
  if (!tripReq) {
    return res.status(404).json({ error: "Request not found" });
  }

  const timestamp = new Date().toISOString();
  const botUrl = "https://t.me/cariqqobot";
  const reqTg = tripReq.requesterTelegram || `@${tripReq.requesterName.toLowerCase().replace(/\s+/g, '_')}`;
  const effectiveNotes = directorNotes || notes || "Permitted for official research operations.";

  if (action === "permit") {
    tripReq.status = "Pending Fleet Manager Authorization";
    tripReq.directorApprovedBy = directorName;
    tripReq.directorApprovedAt = timestamp;
    tripReq.directorNotes = effectiveNotes;

    // 1. Alert Fleet Manager via Telegram
    const fleetTgAlert: SMSAlert = {
      id: `tg-${Date.now()}-fm`,
      channel: "Telegram",
      recipientType: "Fleet Manager",
      recipientName: "Eng. Wondimu Bedada (Fleet Super Admin)",
      recipientPhone: "+251 911 200 300",
      recipientTelegram: "@wondimu_fleet",
      tripRequestNumber: tripReq.requestNumber,
      subject: `🤖 OARI Telegram Bot (@cariqqobot) • Request Permitted by Director`,
      message: `📥 *[STAGE 1 PERMITTED ➔ STAGE 2 FLEET AUTHORIZATION REQUIRED]*\n\n` +
               `Trip Request #${tripReq.requestNumber} was *PERMITTED* by Director ${directorName}.\n\n` +
               `🏷 *Category:* ${tripReq.tripCategory}\n` +
               `👨‍🔬 *Requester:* ${tripReq.requesterName} (${tripReq.department})\n` +
               `📍 *Destination:* ${tripReq.destination}\n` +
               `📅 *Departure:* ${tripReq.departureDate}\n` +
               `📝 *Director Remarks:* "${tripReq.directorNotes}"\n\n` +
               `👉 *Allocate Vehicle & Driver on Bot:* ${botUrl}`,
      status: "Delivered",
      sentAt: timestamp,
      gatewayRef: `TG-BOT-${Math.floor(100000 + Math.random() * 900000)}`,
      costEtb: 0.00,
      telegramDirectUrl: botUrl
    };

    // 2. Alert Fleet Manager via SMS
    const fleetSmsAlert: SMSAlert = {
      id: `sms-${Date.now()}-fm`,
      channel: "SMS",
      recipientType: "Fleet Manager",
      recipientName: "Eng. Wondimu Bedada",
      recipientPhone: "+251 911 200 300",
      tripRequestNumber: tripReq.requestNumber,
      message: `[OARI FLEET ALERT] Mission #${tripReq.requestNumber} permitted by Director ${directorName}. Action needed: Allocate vehicle and driver. Bot: ${botUrl}`,
      status: "Delivered",
      sentAt: timestamp,
      gatewayRef: `ETHIO-SMS-${Math.floor(100000 + Math.random() * 900000)}`,
      costEtb: 0.00,
      telegramDirectUrl: botUrl
    };

    // 3. Inform Requester via Telegram
    const employeeTgAlert: SMSAlert = {
      id: `tg-${Date.now()}-emp`,
      channel: "Telegram",
      recipientType: "Customer",
      recipientName: tripReq.requesterName,
      recipientPhone: tripReq.requesterPhone,
      recipientTelegram: reqTg,
      tripRequestNumber: tripReq.requestNumber,
      subject: `🤖 OARI Telegram Bot (@cariqqobot) • Director Permitted Your Trip`,
      message: `👍 *[DIRECTOR APPROVAL STAGE PASSED]*\n\n` +
               `Your car booking request #${tripReq.requestNumber} to ${tripReq.destination} has been *PERMITTED* by Director ${directorName}.\n\n` +
               `It has been forwarded to Fleet Manager for vehicle and driver allocation.\n\n` +
               `👉 *Check Status on Bot:* ${botUrl}`,
      status: "Delivered",
      sentAt: timestamp,
      gatewayRef: `TG-BOT-${Math.floor(100000 + Math.random() * 900000)}`,
      costEtb: 0.00,
      telegramDirectUrl: botUrl
    };

    // 4. Inform Requester via SMS
    const employeeSmsAlert: SMSAlert = {
      id: `sms-${Date.now()}-emp`,
      channel: "SMS",
      recipientType: "Customer",
      recipientName: tripReq.requesterName,
      recipientPhone: tripReq.requesterPhone,
      tripRequestNumber: tripReq.requestNumber,
      message: `[OARI DISPATCH] Request #${tripReq.requestNumber} PERMITTED by Director ${directorName}. Forwarded to Fleet Manager for vehicle dispatch.`,
      status: "Delivered",
      sentAt: timestamp,
      gatewayRef: `ETHIO-SMS-${Math.floor(100000 + Math.random() * 900000)}`,
      costEtb: 0.00,
      telegramDirectUrl: botUrl
    };

    smsAlerts.unshift(fleetTgAlert, fleetSmsAlert, employeeTgAlert, employeeSmsAlert);
    forwardToTelegram(fleetTgAlert.message);
    forwardToTelegram(employeeTgAlert.message);
    saveDatabase();

    return res.json({
      message: "Request permitted by Director and forwarded to Fleet Manager for vehicle & driver allocation.",
      request: tripReq,
      alerts: [fleetTgAlert, fleetSmsAlert, employeeTgAlert, employeeSmsAlert]
    });
  } else {
    // Denied by Director
    tripReq.status = "Rejected by Director";
    tripReq.directorApprovedBy = directorName;
    tripReq.directorRejectionReason = rejectionReason || "Resource or schedule conflict identified by Directorate.";

    // Telegram Rejection Alert to Employee
    const tgDenyAlert: SMSAlert = {
      id: `tg-${Date.now()}-dir-deny`,
      channel: "Telegram",
      recipientType: "Customer",
      recipientName: tripReq.requesterName,
      recipientPhone: tripReq.requesterPhone,
      recipientTelegram: reqTg,
      tripRequestNumber: tripReq.requestNumber,
      subject: `🤖 OARI Telegram Bot (@cariqqobot) • Request Denied by Director`,
      message: `❌ *[DIRECTOR REVIEW: REQUEST DENIED]*\n\n` +
               `Your booking request #${tripReq.requestNumber} to ${tripReq.destination} was *DENIED* by Immediate Director ${directorName}.\n\n` +
               `⚠️ *Reason:* ${tripReq.directorRejectionReason}\n\n` +
               `Please consult your department directorate or revise trip arrangements.\n\n` +
               `👉 *Bot:* ${botUrl}`,
      status: "Delivered",
      sentAt: timestamp,
      gatewayRef: `TG-BOT-${Math.floor(100000 + Math.random() * 900000)}`,
      costEtb: 0.00,
      telegramDirectUrl: botUrl
    };

    // SMS Rejection to Employee
    const smsDenyAlert: SMSAlert = {
      id: `sms-${Date.now()}-dir-deny`,
      channel: "SMS",
      recipientType: "Customer",
      recipientName: tripReq.requesterName,
      recipientPhone: tripReq.requesterPhone,
      tripRequestNumber: tripReq.requestNumber,
      message: `[OARI NOTICE] Your trip #${tripReq.requestNumber} was DENIED by Director. Reason: ${tripReq.directorRejectionReason}. Bot: ${botUrl}`,
      status: "Delivered",
      sentAt: timestamp,
      gatewayRef: `ETHIO-SMS-${Math.floor(100000 + Math.random() * 900000)}`,
      costEtb: 0.00,
      telegramDirectUrl: botUrl
    };

    smsAlerts.unshift(tgDenyAlert, smsDenyAlert);
    forwardToTelegram(tgDenyAlert.message);
    saveDatabase();

    return res.json({
      message: "Request denied by Director. Explanation forwarded to employee via Telegram & SMS.",
      request: tripReq,
      alerts: [tgDenyAlert, smsDenyAlert]
    });
  }
});

// STAGE 2: Fleet Manager Approve (Permit) & Auto Dispatch SMS / Telegram / Email + Travel Log
app.post("/api/requests/:id/approve", (req, res) => {
  const { id } = req.params;
  const { vehicleId, driverId, approverName = "Eng. Wondimu Bedada (Fleet Super Admin)", channels = ["SMS", "Telegram", "Email"] } = req.body;

  const tripReq = tripRequests.find(r => r.id === id);
  if (!tripReq) {
    return res.status(404).json({ error: "Request not found" });
  }

  // If request is in Pending Director Approval or Pending stage, fast-track Stage 1 endorsement upon dispatch
  if (tripReq.status === "Pending Director Approval" || (tripReq.status as string) === "Pending") {
    tripReq.directorApprovedBy = "Directorate Permitted (Fleet Admin Direct Dispatch)";
    tripReq.directorApprovedAt = new Date().toISOString();
    tripReq.directorNotes = tripReq.directorNotes || "Permitted for official OARI research operations.";
  }

  const vehicle = vehicles.find(v => v.id === vehicleId);
  const driver = drivers.find(d => d.id === driverId);

  if (!vehicle || !driver) {
    return res.status(400).json({ error: "A valid vehicle and certified driver must be selected for Fleet Manager approval" });
  }

  // 1. Strict Vehicle Status Validation
  if (vehicle.status !== "Available") {
    return res.status(400).json({ 
      error: `Vehicle ${vehicle.plateNumber} cannot be allocated because it is currently "${vehicle.status}". It must complete its mission/service and return to depot before it can be assigned.` 
    });
  }

  // 2. Check if Vehicle is already on active/pending mission
  const activeVehMission = tripRequests.find(r => 
    r.id !== tripReq.id && 
    r.assignedVehicleId === vehicle.id && 
    (r.status === "Approved" || r.status === "In Progress")
  );
  if (activeVehMission) {
    return res.status(400).json({
      error: `Vehicle ${vehicle.plateNumber} is already deployed on active mission #${activeVehMission.requestNumber}. It must return and be audited before re-allocation.`
    });
  }

  // 3. Strict Driver Status Validation
  const isDriverAvail = driver.status === "Active / Available";
  if (!isDriverAvail) {
    return res.status(400).json({ 
      error: `Driver ${driver.name} cannot be assigned because they are currently "${driver.status}". The driver must return and complete their current trip before being allocated.` 
    });
  }

  // 4. Check if Driver is already on active/pending mission
  const activeDrvMission = tripRequests.find(r => 
    r.id !== tripReq.id && 
    r.assignedDriverId === driver.id && 
    (r.status === "Approved" || r.status === "In Progress")
  );
  if (activeDrvMission) {
    return res.status(400).json({
      error: `Driver ${driver.name} is already assigned to active mission #${activeDrvMission.requestNumber}. They must complete their trip before new dispatch.`
    });
  }

  // Update Trip Request
  tripReq.status = "Approved";
  tripReq.fleetManagerApprovedBy = approverName;
  tripReq.fleetManagerApprovedAt = new Date().toISOString();
  tripReq.assignedVehicleId = vehicle.id;
  tripReq.assignedVehiclePlate = `${vehicle.plateNumber} (${vehicle.model})`;
  tripReq.assignedDriverId = driver.id;
  tripReq.assignedDriverName = driver.name;
  tripReq.assignedDriverPhone = driver.phone;
  tripReq.assignedDriverTelegram = `@${driver.name.toLowerCase().replace(/\s+/g, '_')}_driver`;
  tripReq.approvedBy = approverName;
  tripReq.approvedAt = new Date().toISOString();
  tripReq.notificationChannels = channels;

  // Update Vehicle and Driver Status
  vehicle.status = "On Mission";
  driver.status = "On Trip";

  // Create Automated Travel Log
  const logNum = `OARI-LOG-2026-${String(115 + travelLogs.length).padStart(3, '0')}`;
  const travelLog: TravelLog = {
    id: `log-${Date.now()}`,
    logNumber: logNum,
    tripRequestId: tripReq.id,
    vehicleId: vehicle.id,
    vehiclePlate: vehicle.plateNumber,
    driverName: driver.name,
    requesterName: tripReq.requesterName,
    origin: tripReq.origin,
    destination: tripReq.destination,
    startOdometerKm: vehicle.odometerKm,
    startTime: tripReq.departureDate,
    fuelIssuedLiters: tripReq.estimatedFuelLiters || (tripReq.tripCategory === "Inside Town" ? 15 : 45),
    fuelCostEtb: (tripReq.estimatedFuelLiters || (tripReq.tripCategory === "Inside Town" ? 15 : 45)) * 97.00,
    purpose: tripReq.purpose,
    status: "Active Mission",
    officerRemarks: `Authorized by Fleet Manager ${approverName}. Dispatched via Telegram @cariqqobot and SMS.`
  };
  travelLogs.unshift(travelLog);

  // Trigger Multi-Channel Notifications (To Requester & Driver)
  const dispatchedAlerts = sendAutomatedNotifications(tripReq, vehicle, driver, channels);
  saveDatabase();

  res.json({
    message: `Request approved by Fleet Manager! Travel Log generated and instant alerts dispatched via Telegram (@cariqqobot) & SMS.`,
    request: tripReq,
    travelLog,
    alerts: dispatchedAlerts
  });
});

// STAGE 2: Fleet Manager Reject (Deny) & Dispatch Multi-channel Notices with Reason
app.post("/api/requests/:id/reject", (req, res) => {
  const { id } = req.params;
  const { 
    reason, 
    rejectionReason = reason || "Fleet vehicle pool temporarily constrained or priority mission conflict for requested dates", 
    approverName = "Eng. Wondimu Bedada (Fleet Super Admin)", 
    channels = ["SMS", "Telegram", "Email"] 
  } = req.body;
  const tripReq = tripRequests.find(r => r.id === id);
  if (!tripReq) {
    return res.status(404).json({ error: "Request not found" });
  }

  // If vehicle/driver were previously assigned, release them back to pool
  if (tripReq.assignedVehicleId) {
    const v = vehicles.find(veh => veh.id === tripReq.assignedVehicleId);
    if (v && v.status === "On Mission") v.status = "Available";
  }
  if (tripReq.assignedDriverId) {
    const d = drivers.find(drv => drv.id === tripReq.assignedDriverId);
    if (d && d.status === "On Trip") d.status = "Active / Available";
  }

  tripReq.status = "Rejected by Fleet Manager";
  tripReq.fleetManagerApprovedBy = approverName;
  tripReq.fleetManagerRejectionReason = rejectionReason;
  tripReq.rejectionReason = rejectionReason;

  const timestamp = new Date().toISOString();
  const botUrl = "https://t.me/cariqqobot";
  const reqTg = tripReq.requesterTelegram || `@${tripReq.requesterName.toLowerCase().replace(/\s+/g, '_')}`;
  const createdNotices: SMSAlert[] = [];

  // Telegram Rejection to Employee
  if (channels.includes("Telegram")) {
    const tg: SMSAlert = {
      id: `tg-${Date.now()}-fm-deny`,
      channel: "Telegram",
      recipientType: "Customer",
      recipientName: tripReq.requesterName,
      recipientPhone: tripReq.requesterPhone,
      recipientTelegram: reqTg,
      tripRequestNumber: tripReq.requestNumber,
      subject: `🤖 OARI Telegram Bot (@cariqqobot) • Fleet Authorization Denied`,
      message: `❌ *[FLEET MANAGEMENT: AUTHORIZATION DENIED]*\n\n` +
               `Your car booking #${tripReq.requestNumber} (${tripReq.tripCategory}) to ${tripReq.destination} could not be authorized by Fleet Directorate.\n\n` +
               `⚠️ *Reason:* ${rejectionReason}\n\n` +
               `_Please contact the Fleet Manager Office or reschedule your departure._\n\n` +
               `👉 *Bot:* ${botUrl}`,
      status: "Delivered",
      sentAt: timestamp,
      gatewayRef: `TG-BOT-${Math.floor(100000 + Math.random() * 900000)}`,
      costEtb: 0.00,
      telegramDirectUrl: botUrl
    };
    createdNotices.push(tg);
    forwardToTelegram(tg.message);
  }

  // SMS Rejection to Employee
  if (channels.includes("SMS")) {
    const sms: SMSAlert = {
      id: `sms-${Date.now()}-fm-deny`,
      channel: "SMS",
      recipientType: "Customer",
      recipientName: tripReq.requesterName,
      recipientPhone: tripReq.requesterPhone,
      tripRequestNumber: tripReq.requestNumber,
      message: `[OARI FLEET NOTICE] Trip #${tripReq.requestNumber} was not authorized by Fleet Manager. Reason: ${rejectionReason}. Bot: ${botUrl}`,
      status: "Delivered",
      sentAt: timestamp,
      gatewayRef: `ETHIO-SMS-${Math.floor(100000 + Math.random() * 900000)}`,
      costEtb: 0.00,
      telegramDirectUrl: botUrl
    };
    createdNotices.push(sms);
  }

  // Email Rejection to Employee
  if (channels.includes("Email") && tripReq.requesterEmail) {
    const emailNotice: SMSAlert = {
      id: `email-${Date.now()}-fm-deny`,
      channel: "Email",
      recipientType: "Customer",
      recipientName: tripReq.requesterName,
      recipientPhone: tripReq.requesterPhone,
      recipientEmail: tripReq.requesterEmail,
      tripRequestNumber: tripReq.requestNumber,
      subject: `[OARI Logistics] Notice of Fleet Allocation Decision #${tripReq.requestNumber}`,
      message: `Dear ${tripReq.requesterName},\n\n` +
               `Your car request #${tripReq.requestNumber} to ${tripReq.destination} could not be allocated at this time.\n\n` +
               `Reason: ${rejectionReason}\n\n` +
               `Transport & Fleet Directorate\nOromia Agricultural Research Institute`,
      status: "Delivered",
      sentAt: timestamp,
      gatewayRef: `SMTP-OARI-${Math.floor(100000 + Math.random() * 900000)}`,
      costEtb: 0.00,
      telegramDirectUrl: botUrl
    };
    createdNotices.push(emailNotice);
  }

  smsAlerts.unshift(...createdNotices);
  saveDatabase();
  res.json({ message: "Trip request denied by Fleet Manager and reason forwarded to employee.", request: tripReq, notices: createdNotices });
});

// Start Trip Mission (Driver sets in-progress)
app.post("/api/requests/:id/start-mission", (req, res) => {
  const { id } = req.params;
  const tripReq = tripRequests.find(r => r.id === id);
  if (!tripReq) {
    return res.status(404).json({ error: "Request not found" });
  }

  tripReq.status = "In Progress";
  const vehicle = vehicles.find(v => v.id === tripReq.assignedVehicleId);
  if (vehicle) {
    vehicle.status = "On Mission";
  }

  const log = travelLogs.find(l => l.tripRequestId === id);
  if (log) {
    log.status = "Active Mission";
  }

  saveDatabase();
  res.json({ message: "Mission started! Vehicle is now en-route.", request: tripReq });
});

// Complete Trip
app.post("/api/requests/:id/complete", (req, res) => {
  const { id } = req.params;
  const { endOdometerKm, endOdometer, notes } = req.body;
  const endOdoVal = endOdometerKm !== undefined ? Number(endOdometerKm) : (endOdometer !== undefined ? Number(endOdometer) : undefined);
  const tripReq = tripRequests.find(r => r.id === id);
  if (!tripReq) {
    return res.status(404).json({ error: "Request not found" });
  }

  tripReq.status = "Completed";

  const vehicle = vehicles.find(v => v.id === tripReq.assignedVehicleId || (tripReq.assignedVehiclePlate && v.plateNumber === tripReq.assignedVehiclePlate));
  if (vehicle) {
    vehicle.status = "Available";
    if (endOdoVal !== undefined && !isNaN(endOdoVal) && endOdoVal > 0) {
      vehicle.odometerKm = endOdoVal;
    }
  }

  const driver = drivers.find(d => d.id === tripReq.assignedDriverId || (tripReq.assignedDriverName && d.name.toLowerCase() === tripReq.assignedDriverName.toLowerCase()));
  if (driver) {
    driver.status = "Active / Available";
  }

  // Update Travel Log
  const log = travelLogs.find(l => l.tripRequestId === id);
  if (log) {
    log.status = "Completed";
    log.endTime = new Date().toISOString();
    if (endOdoVal !== undefined && !isNaN(endOdoVal) && endOdoVal > 0) {
      log.endOdometerKm = endOdoVal;
      log.totalDistanceKm = Math.max(0, log.endOdometerKm - log.startOdometerKm);
    }
    if (notes) log.officerRemarks = (log.officerRemarks || '') + (log.officerRemarks ? " | " : "") + notes;
  }

  saveDatabase();
  res.json({ success: true, message: "Mission marked completed and vehicle returned to available fleet pool", request: tripReq, travelLog: log });
});

// Travel Logs
app.get("/api/travel-logs", (req, res) => {
  res.json({ travelLogs });
});

// SMS / Telegram / Email Alerts & Gateway Logs
app.get("/api/sms-alerts", (req, res) => {
  res.json({ alerts: smsAlerts, gatewayStatus: "Connected (Ethio Telecom SMS Shortcode 8844, Telegram Bot @OARIFleetBot, Institutional SMTP)" });
});

app.post("/api/sms-alerts/send-custom", (req, res) => {
  const { channel = "SMS", recipientType = "Customer", recipientName = "Staff Member", recipientPhone = "+251 900 000 000", recipientEmail, recipientTelegram, tripRequestNumber = "MANUAL-ALERT", subject, message } = req.body;
  const newAlert: SMSAlert = {
    id: `${channel.toLowerCase()}-${Date.now()}`,
    channel: channel as any,
    recipientType: recipientType as any,
    recipientName,
    recipientPhone,
    recipientEmail,
    recipientTelegram,
    tripRequestNumber,
    subject: subject || (channel === "Telegram" ? "🤖 OARI Fleet Bot Broadcast" : channel === "Email" ? "[OARI Transport] Official Notification" : undefined),
    message,
    status: "Delivered",
    sentAt: new Date().toISOString(),
    gatewayRef: channel === "Telegram" ? `TG-BOT-${Math.floor(100000 + Math.random() * 900000)}` : channel === "Email" ? `SMTP-OARI-${Math.floor(100000 + Math.random() * 900000)}` : `ETHIO-SMS-${Math.floor(100000 + Math.random() * 900000)}`,
    costEtb: 0.00
  };
  smsAlerts.unshift(newAlert);
  saveDatabase();
  res.json({ message: `${channel} alert dispatched successfully`, alert: newAlert, sms: newAlert });
});

app.post("/api/sms/send", (req, res) => {
  const { channel = "SMS", recipientType = "Customer", recipientName = "Staff Member", recipientPhone = "+251 900 000 000", recipientEmail, recipientTelegram, tripRequestNumber = "MANUAL-ALERT", subject, message } = req.body;
  const newAlert: SMSAlert = {
    id: `${channel.toLowerCase()}-${Date.now()}`,
    channel: channel as any,
    recipientType: recipientType as any,
    recipientName,
    recipientPhone,
    recipientEmail,
    recipientTelegram,
    tripRequestNumber,
    subject: subject || (channel === "Telegram" ? "🤖 OARI Fleet Bot Broadcast" : channel === "Email" ? "[OARI Transport] Official Notification" : undefined),
    message,
    status: "Delivered",
    sentAt: new Date().toISOString(),
    gatewayRef: channel === "Telegram" ? `TG-BOT-${Math.floor(100000 + Math.random() * 900000)}` : channel === "Email" ? `SMTP-OARI-${Math.floor(100000 + Math.random() * 900000)}` : `ETHIO-SMS-${Math.floor(100000 + Math.random() * 900000)}`,
    costEtb: 0.00
  };
  smsAlerts.unshift(newAlert);
  saveDatabase();
  res.json({ message: `${channel} alert dispatched successfully`, alert: newAlert, sms: newAlert });
});

// Fuel Records
app.get("/api/fuel-records", (req, res) => {
  res.json({ fuelRecords });
});

app.post("/api/fuel-records", (req, res) => {
  const newFuel: FuelRecord = {
    id: `f-${Date.now()}`,
    voucherNumber: `OARI-FUEL-2026-${String(305 + fuelRecords.length).padStart(3, '0')}`,
    date: req.body.date || new Date().toISOString().split('T')[0],
    ...req.body
  };
  fuelRecords.unshift(newFuel);

  // Update vehicle current fuel level & odometer
  const vehicle = vehicles.find(v => v.id === newFuel.vehicleId);
  if (vehicle) {
    vehicle.currentFuelLevel = Math.min(vehicle.fuelTankCapacity, vehicle.currentFuelLevel + Number(newFuel.liters));
    if (newFuel.odometerAtRefuel > vehicle.odometerKm) {
      vehicle.odometerKm = Number(newFuel.odometerAtRefuel);
    }
  }

  saveDatabase();
  res.status(201).json({ fuelRecord: newFuel, message: "Fuel voucher recorded and vehicle fuel tank updated" });
});

// Maintenance Records
app.get("/api/maintenance", (req, res) => {
  res.json({ maintenanceRecords });
});

app.post("/api/maintenance", (req, res) => {
  const newMaint: MaintenanceRecord = {
    id: `m-${Date.now()}`,
    jobCardNumber: `OARI-MAINT-2026-${String(90 + maintenanceRecords.length).padStart(2, '0')}`,
    status: req.body.status || "Scheduled",
    partsReplaced: req.body.partsReplaced || [],
    ...req.body
  };
  maintenanceRecords.unshift(newMaint);

  const vehicle = vehicles.find(v => v.id === newMaint.vehicleId);
  if (vehicle && req.body.status === "In Workshop") {
    vehicle.status = "In Maintenance";
  }

  saveDatabase();
  res.status(201).json({ maintenanceRecord: newMaint, message: "Maintenance service logged" });
});

// Update Maintenance Job Card
app.put("/api/maintenance/:id", (req, res) => {
  const { id } = req.params;
  const index = maintenanceRecords.findIndex(m => m.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Maintenance record not found" });
  }

  maintenanceRecords[index] = {
    ...maintenanceRecords[index],
    ...req.body,
    id
  };

  const updatedMaint = maintenanceRecords[index];
  const vehicle = vehicles.find(v => v.id === updatedMaint.vehicleId);
  if (vehicle) {
    if (updatedMaint.status === "Completed") {
      vehicle.status = "Available";
      if (updatedMaint.odometerKm && updatedMaint.odometerKm > vehicle.odometerKm) {
        vehicle.odometerKm = Number(updatedMaint.odometerKm);
      }
      vehicle.lastServiceDate = updatedMaint.completionDate || new Date().toISOString().split('T')[0];
      vehicle.nextServiceKm = vehicle.odometerKm + 5000;
    } else if (updatedMaint.status === "In Workshop") {
      vehicle.status = "In Maintenance";
    }
  }

  saveDatabase();
  res.json({ maintenanceRecord: updatedMaint, message: "Maintenance record updated" });
});

// Reset System State to Factory Default
app.post("/api/reset", (req, res) => {
  vehicles = JSON.parse(JSON.stringify(initialVehicles));
  drivers = JSON.parse(JSON.stringify(initialDrivers));
  tripRequests = JSON.parse(JSON.stringify(initialTripRequests));
  travelLogs = JSON.parse(JSON.stringify(initialTravelLogs));
  smsAlerts = JSON.parse(JSON.stringify(initialSmsAlerts));
  fuelRecords = JSON.parse(JSON.stringify(initialFuelRecords));
  maintenanceRecords = JSON.parse(JSON.stringify(initialMaintenanceRecords));
  officers = JSON.parse(JSON.stringify(initialOfficers));
  saveDatabase();
  res.json({ message: "System state restored to factory default records." });
});

// -------------------------------------------------------------
// GEMINI AI INTEGRATIONS (Route optimizer, Anomaly diagnostics, Summaries)
// -------------------------------------------------------------

app.post("/api/gemini/optimize-route", async (req, res) => {
  const { origin, destination, vehicleType, passengerCount, cargoWeightKg, season = "Rainy/Off-Road season" } = req.body;
  const ai = getAIClient();

  if (!ai) {
    // Graceful fallback heuristics if no API key
    return res.json({
      estimatedKm: 320,
      estimatedHours: 5.5,
      fuelEstimateLiters: 48,
      recommendedVehicle: "Toyota Land Cruiser HZJ79 4x4 or Hilux Double Cab",
      terrainAdvisory: "Route involves secondary gravel and clay agricultural tracks. High ground clearance and active 4WD low gear required.",
      safetyChecklist: ["Verify dual spare tire pressure (36 PSI)", "Pack winch controller & tow strap", "Check radiator coolant & sample cold-box inverter", "Confirm Ethio Telecom satellite/mobile network coverage points"],
      aiGenerated: false
    });
  }

  try {
    const prompt = `You are the Chief Fleet Logistics Specialist for the Oromia Agricultural Research Institute (OARI) in Ethiopia.
Analyze this agricultural research field transportation mission:
- Origin: ${origin}
- Destination: ${destination}
- Requested Vehicle Type: ${vehicleType}
- Passengers: ${passengerCount}
- Cargo / Samples Weight: ${cargoWeightKg} kg
- Season/Condition: ${season}

Please provide an operational assessment in structured JSON format with:
1. "estimatedKm" (number): round-trip or one-way estimated distance in km
2. "estimatedHours" (number): realistic driving hours considering Ethiopian agricultural roads/topography
3. "fuelEstimateLiters" (number): realistic diesel fuel consumption (accounting for 4WD engagement & terrain)
4. "recommendedVehicle" (string): recommended vehicle class (e.g., 4WD Pickup, Land Cruiser Hardtop, SUV)
5. "terrainAdvisory" (string): 2-3 sentences on road conditions between these Oromia regions (e.g. Bale highlands, Rift valley, West Shoa muddy soil, Hararghe escarpments)
6. "safetyChecklist" (array of 4 strings): operational safety items for researchers and driver.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json({ ...parsed, aiGenerated: true });
  } catch (err: any) {
    console.error("Gemini route optimization error:", err);
    res.json({
      estimatedKm: 290,
      estimatedHours: 4.8,
      fuelEstimateLiters: 42,
      recommendedVehicle: "4WD Pickup (Toyota Hilux / Land Cruiser)",
      terrainAdvisory: "Highland agricultural corridor with unpaved research farm access tracks. 4x4 engagement recommended on farm boundaries.",
      safetyChecklist: ["Ensure spare tire and jack are secured", "Check vehicle battery and cooling system", "Verify sample preservation kit", "Confirm emergency contact with station director"],
      aiGenerated: false
    });
  }
});

app.post("/api/gemini/analyze-fleet-health", async (req, res) => {
  const ai = getAIClient();

  if (!ai) {
    return res.json({
      overallHealthScore: 92,
      fuelEfficiencySummary: "Fleet average is 8.4 km/L across all active 4WD research vehicles, within optimal institutional parameters for rural terrain.",
      flaggedAnomalies: [
        {
          vehiclePlate: "4-11892 ET",
          issue: "Higher fuel burn during West Shoa muddy season missions",
          severity: "Low",
          recommendation: "Inspect air filter after field dusty & rainy operations."
        },
        {
          vehiclePlate: "3-55671 OR",
          issue: "Upcoming 50,000 km differential fluid replacement due",
          severity: "Medium",
          recommendation: "Complete in-workshop maintenance before long-distance Bale mission."
        }
      ],
      aiGenerated: false
    });
  }

  try {
    const fleetSummary = vehicles.map(v => ({
      plate: v.plateNumber,
      model: v.model,
      odometer: v.odometerKm,
      status: v.status,
      nextService: v.nextServiceKm,
      fuelLevel: v.currentFuelLevel
    }));

    const prompt = `As Fleet Intelligence Auditor for Oromia Agricultural Research Institute (OARI), analyze our fleet status:
${JSON.stringify(fleetSummary, null, 2)}
Fuel records count: ${fuelRecords.length}, Active logs: ${travelLogs.length}.

Respond in JSON with:
1. "overallHealthScore" (number 1-100)
2. "fuelEfficiencySummary" (string)
3. "flaggedAnomalies" (array of objects with "vehiclePlate", "issue", "severity" [Low|Medium|High], "recommendation")
4. "directorateAdvice" (string: strategic advice for OARI transport management)`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.3
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json({ ...parsed, aiGenerated: true });
  } catch (err) {
    console.error("Gemini fleet health error:", err);
    res.json({
      overallHealthScore: 89,
      fuelEfficiencySummary: "Fleet operating within standard efficiency ranges for Ethiopian highland & lowland agricultural research.",
      flaggedAnomalies: [
        {
          vehiclePlate: "4-67290 ET",
          issue: "High mileage on crew minibus (68,900 km)",
          severity: "Medium",
          recommendation: "Schedule full suspension and brake checkup."
        }
      ],
      directorateAdvice: "Rotate long-range expeditions evenly between Sinana, Jimma, and Bako stations to balance wear.",
      aiGenerated: false
    });
  }
});

// -------------------------------------------------------------
// VITE MIDDLEWARE & STATIC SERVING
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[OARI Fleet Management] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
