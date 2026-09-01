import React, { useState, useEffect } from "react";
import { 
  Send, 
  Car, 
  MapPin, 
  Calendar, 
  Users, 
  Package, 
  AlertTriangle, 
  Sparkles, 
  Compass, 
  Fuel, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  Plus, 
  Trash2,
  Info,
  Building2,
  Navigation,
  Check,
  ExternalLink,
  MessageSquare
} from "lucide-react";
import { TripRequest, Vehicle, TripBookingCategory } from "../types";
import { OARI_CENTERS, ADDIS_ABABA_DESTINATIONS, OARI_DEPARTMENTS } from "../data/mockData";

interface BookingFormProps {
  preselectedVehicle: Vehicle | null;
  onSubmitRequest: (request: Partial<TripRequest>) => void;
  onClearPreselectedVehicle: () => void;
}

export const BookingForm: React.FC<BookingFormProps> = ({
  preselectedVehicle,
  onSubmitRequest,
  onClearPreselectedVehicle
}) => {
  const [tripCategory, setTripCategory] = useState<TripBookingCategory>("Outside Town");

  const [requesterName, setRequesterName] = useState("Dr. Ayantu Tadesse");
  const [requesterTitle, setRequesterTitle] = useState("Senior Plant Breeder & Cereal Lead");
  const [department, setDepartment] = useState("Crop Research");
  const [requesterPhone, setRequesterPhone] = useState("+251 911 882 341");
  const [requesterEmail, setRequesterEmail] = useState("ayantu.tadesse@oari.gov.et");
  const [requesterTelegram, setRequesterTelegram] = useState("@ayantu_tadesse");
  const [stationBase, setStationBase] = useState("Sinana Agricultural Research Center");

  // Outside town fields
  const [origin, setOrigin] = useState("Sinana Agricultural Research Center");
  const [destination, setDestination] = useState("Agarfa & Goba Experimental Farms");
  const [waypointInput, setWaypointInput] = useState("");
  const [waypoints, setWaypoints] = useState<string[]>(["Robe Seed Multiplication", "Agarfa TVET Farm"]);
  const [departureDate, setDepartureDate] = useState("2026-08-21T07:30");
  const [returnDate, setReturnDate] = useState("2026-08-23T18:00");

  // Inside town fields (Addis Ababa single day)
  const [insideTownDate, setInsideTownDate] = useState("2026-08-21");
  const [insideTownPickupTime, setInsideTownPickupTime] = useState("08:30");
  const [insideTownReturnTime, setInsideTownReturnTime] = useState("17:00");
  const [selectedInsideTownDest, setSelectedInsideTownDest] = useState(ADDIS_ABABA_DESTINATIONS[0].name);
  const [customInsideTownDest, setCustomInsideTownDest] = useState("");

  const [purpose, setPurpose] = useState<TripRequest["purpose"]>("Field Crop Research & Phenotyping");

  const [coPassengers, setCoPassengers] = useState<string[]>([
    "Diriba Wakgari (Agronomist)",
    "Sintayehu Kebede (Lab Tech)",
    "Hana Gutu (Pathology Assistant)"
  ]);
  const [passengerInput, setPassengerInput] = useState("");

  // Auto-sync passenger manifest team leader with Section 1 Researcher Name
  const teamLeaderEntry = `${requesterName.trim() || "Lead Researcher"} (Team Leader)`;
  const passengerNames = [teamLeaderEntry, ...coPassengers];
  const passengerCount = passengerNames.length;

  const [cargoDescription, setCargoDescription] = useState("Rust-resistant wheat breeder seeds, GPS loggers, leaf tissue sample cooler");
  const [cargoWeightKg, setCargoWeightKg] = useState(160);
  const [urgency, setUrgency] = useState<TripRequest["urgency"]>("High");
  const [preferredVehicleType, setPreferredVehicleType] = useState<string>(
    preselectedVehicle ? preselectedVehicle.type : "4WD Pickup"
  );

  // AI Route Optimizer State
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [aiRouteData, setAiRouteData] = useState<{
    estimatedKm: number;
    estimatedHours: number;
    fuelEstimateLiters: number;
    recommendedVehicle: string;
    terrainAdvisory: string;
    safetyChecklist: string[];
    aiGenerated?: boolean;
  } | null>(null);

  useEffect(() => {
    if (preselectedVehicle) {
      setPreferredVehicleType(preselectedVehicle.type);
      setStationBase(preselectedVehicle.stationBase);
      setOrigin(preselectedVehicle.stationBase);
    }
  }, [preselectedVehicle]);

  // When switching categories, adapt presets
  useEffect(() => {
    if (tripCategory === "Inside Town") {
      setOrigin("OARI Headquarter (Addis Ababa)");
      setPurpose("Inside Town Official Run");
      setPreferredVehicleType("4WD Pickup");
    } else {
      setOrigin(stationBase);
      setPurpose("Field Crop Research & Phenotyping");
    }
  }, [tripCategory, stationBase]);

  const handleAddWaypoint = () => {
    if (waypointInput.trim()) {
      setWaypoints([...waypoints, waypointInput.trim()]);
      setWaypointInput("");
    }
  };

  const handleRemoveWaypoint = (index: number) => {
    setWaypoints(waypoints.filter((_, i) => i !== index));
  };

  const handleAddPassenger = () => {
    if (passengerInput.trim()) {
      setCoPassengers([...coPassengers, passengerInput.trim()]);
      setPassengerInput("");
    }
  };

  const handleRemovePassenger = (coIndex: number) => {
    const updated = coPassengers.filter((_, i) => i !== coIndex);
    setCoPassengers(updated);
  };

  const handleRunAiRouteOptimizer = async () => {
    setIsOptimizing(true);
    const targetDest = tripCategory === "Inside Town" 
      ? (customInsideTownDest || selectedInsideTownDest) 
      : destination;

    try {
      const res = await fetch("/api/gemini/optimize-route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin,
          destination: targetDest,
          vehicleType: preferredVehicleType,
          passengerCount,
          cargoWeightKg,
          tripCategory,
          season: tripCategory === "Inside Town" ? "Addis Ababa urban traffic & corridor transit" : "Highland agricultural rainy/off-road field operations"
        })
      });
      const data = await res.json();
      setAiRouteData(data);
    } catch (err) {
      console.error(err);
      if (tripCategory === "Inside Town") {
        setAiRouteData({
          estimatedKm: 38,
          estimatedHours: 1.8,
          fuelEstimateLiters: 8,
          recommendedVehicle: "4WD Pickup or Station Sedan (City Pool)",
          terrainAdvisory: "Addis Ababa municipal arterial roads (CMC / Bole / Kality / Megenagna). Peak morning traffic expected.",
          safetyChecklist: ["Verify city parking permit", "Carry institutional vehicle gate pass", "Confirm return fuel meter"],
          aiGenerated: false
        });
      } else {
        setAiRouteData({
          estimatedKm: 340,
          estimatedHours: 5.2,
          fuelEstimateLiters: 48,
          recommendedVehicle: "4WD Pickup (Toyota Hilux / Land Cruiser)",
          terrainAdvisory: "Highland agricultural corridor with unpaved farm access roads. High ground clearance and active 4WD recommended.",
          safetyChecklist: ["Verify dual spare tire pressure", "Pack winch controller & tow strap", "Check radiator coolant & battery", "Confirm emergency contact with station director"],
          aiGenerated: false
        });
      }
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let finalOrigin = origin;
    let finalDestination = destination;
    let finalDepDate = departureDate;
    let finalRetDate = returnDate;
    let finalKm = aiRouteData?.estimatedKm || (tripCategory === "Inside Town" ? 35 : 320);
    let finalFuel = aiRouteData?.fuelEstimateLiters || (tripCategory === "Inside Town" ? 8 : 45);

    if (tripCategory === "Inside Town") {
      finalOrigin = "OARI Headquarter (Addis Ababa)";
      finalDestination = customInsideTownDest.trim() ? customInsideTownDest.trim() : selectedInsideTownDest;
      finalDepDate = `${insideTownDate}T${insideTownPickupTime}`;
      finalRetDate = `${insideTownDate}T${insideTownReturnTime}`;
    }

    onSubmitRequest({
      requesterName,
      requesterTitle,
      department,
      requesterPhone,
      requesterEmail,
      requesterTelegram,
      stationBase,
      tripCategory,
      insideTownDestination: tripCategory === "Inside Town" ? finalDestination : undefined,
      insideTownPickupTime: tripCategory === "Inside Town" ? insideTownPickupTime : undefined,
      insideTownReturnTime: tripCategory === "Inside Town" ? insideTownReturnTime : undefined,
      origin: finalOrigin,
      destination: finalDestination,
      waypoints: tripCategory === "Inside Town" ? [] : waypoints,
      departureDate: finalDepDate,
      returnDate: finalRetDate,
      purpose,
      passengerCount,
      passengerNames,
      cargoDescription,
      cargoWeightKg: Number(cargoWeightKg),
      urgency,
      estimatedKm: finalKm,
      estimatedFuelLiters: finalFuel,
      telegramBotUrl: "https://t.me/cariqqobot"
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Banner / Guide */}
      <div className="bg-gradient-to-r from-[#0c2217] via-[#122e20] to-[#1c3e2d] rounded-2xl p-5 text-white shadow-md border border-emerald-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white p-1 rounded-xl shadow-md border-2 border-emerald-400/50 flex items-center justify-center shrink-0">
            <img
              src="https://iqqo.gov.et/sites/default/files/logo200.jpg"
              alt="IQQO Logo"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain rounded"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>IQQO Agricultural Transport Service Booking</span>
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/30">
                Official Form
              </span>
            </div>
            <p className="text-xs text-emerald-200/90 mt-1 max-w-2xl leading-relaxed">
              Official vehicle dispatch portal for agricultural research missions, breeder seed distribution, soil surveying, biotechnology field trials, and pastoral outreach across Oromia.
            </p>
          </div>
        </div>

        {preselectedVehicle && (
          <div className={`rounded-lg p-3 text-xs flex items-center justify-between gap-3 border ${
            preselectedVehicle.status === "Available"
              ? "bg-emerald-900/90 border-emerald-400/40"
              : "bg-rose-950/90 border-rose-400/40"
          }`}>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-semibold ${preselectedVehicle.status === "Available" ? "text-emerald-300" : "text-rose-300"}`}>
                  Pre-selected Vehicle:
                </span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                  preselectedVehicle.status === "Available" ? "bg-emerald-500/30 text-emerald-200" : "bg-rose-500/30 text-rose-200"
                }`}>
                  {preselectedVehicle.status === "Available" ? "🟢 Available" : `🔴 ${preselectedVehicle.status} (In Field)`}
                </span>
              </div>
              <div className="font-bold text-white font-mono text-sm mt-0.5">{preselectedVehicle.plateNumber}</div>
              <div className="text-slate-300 text-[11px]">{preselectedVehicle.model} • {preselectedVehicle.stationBase}</div>
              {preselectedVehicle.status !== "Available" && (
                <div className="text-rose-200 text-[10px] mt-1 font-medium">
                  ⚠️ Notice: This vehicle is currently on field mission and cannot be dispatched until it returns. Fleet Manager will assign an available vehicle from the active pool upon approval.
                </div>
              )}
            </div>
            <button
              onClick={onClearPreselectedVehicle}
              className="text-[11px] text-amber-300 hover:text-amber-200 underline font-semibold shrink-0"
            >
              Clear / Change
            </button>
          </div>
        )}
      </div>

      {/* 4-STAGE APPROVAL & DISPATCH WORKFLOW EXPLAINER */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
          <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Mandated 2-Stage Institutional Approval & Telegram Bot Dispatch Workflow
          </span>
          <a
            href="https://t.me/cariqqobot"
            target="_blank"
            rel="noreferrer"
            className="text-[11px] font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 bg-sky-50 px-2 py-0.5 rounded border border-sky-200"
          >
            <MessageSquare className="w-3 h-3" />
            Telegram Bot: @cariqqobot
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
          <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
            <div className="flex items-center gap-1.5 font-bold text-emerald-800">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">1</span>
              <span>Employee Booking</span>
            </div>
            <p className="text-[11px] text-emerald-900/80 mt-1">
              Researcher submits mission parameters (Inside Town or Outside Town) with passenger & cargo details.
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200">
            <div className="flex items-center gap-1.5 font-bold text-amber-800">
              <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px]">2</span>
              <span>Director Permit/Deny</span>
            </div>
            <p className="text-[11px] text-amber-900/80 mt-1">
              Immediate Directorate Director permits or denies the request with written explanation.
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200">
            <div className="flex items-center gap-1.5 font-bold text-blue-800">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">3</span>
              <span>Fleet Manager Review</span>
            </div>
            <p className="text-[11px] text-blue-900/80 mt-1">
              Fleet Super Admin authorizes mission, allocates matching vehicle, driver, and diesel quota.
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-purple-50 border border-purple-200">
            <div className="flex items-center gap-1.5 font-bold text-purple-800">
              <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px]">4</span>
              <span>Telegram & SMS Dispatch</span>
            </div>
            <p className="text-[11px] text-purple-900/80 mt-1">
              Instant alerts sent to Requester & Driver via Telegram (@cariqqobot) & Ethio Telecom SMS.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* CATEGORY SELECTOR (Inside Town vs Outside Town) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Car className="w-4 h-4 text-emerald-600" />
              <span>Select Booking Category</span>
            </h3>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              Category Requirement
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setTripCategory("Inside Town")}
              className={`p-4 rounded-xl border text-left transition relative flex flex-col justify-between ${
                tripCategory === "Inside Town"
                  ? "border-emerald-600 bg-emerald-50/70 shadow-sm ring-2 ring-emerald-500/30"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className={`w-5 h-5 ${tripCategory === "Inside Town" ? "text-emerald-700" : "text-slate-500"}`} />
                    <span className="font-bold text-sm text-slate-800">Inside Town (Addis Ababa)</span>
                  </div>
                  {tripCategory === "Inside Town" && (
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-2">
                  Single-day official runs within Addis Ababa metropolitan area (e.g., Ministry of Agriculture CMC, National Soil Lab Kality, Ethiopian Institute of Agricultural Research EIAR, Bole Cargo, Customs).
                </p>
              </div>
              <div className="mt-3 flex items-center gap-2 text-[11px] font-medium text-emerald-800 bg-white/80 p-1.5 rounded-lg border border-emerald-200">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Single-day duty: Pickup & Return within same working day</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setTripCategory("Outside Town")}
              className={`p-4 rounded-xl border text-left transition relative flex flex-col justify-between ${
                tripCategory === "Outside Town"
                  ? "border-emerald-600 bg-emerald-50/70 shadow-sm ring-2 ring-emerald-500/30"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Navigation className={`w-5 h-5 ${tripCategory === "Outside Town" ? "text-emerald-700" : "text-slate-500"}`} />
                    <span className="font-bold text-sm text-slate-800">Outside Town (Field Expedition)</span>
                  </div>
                  {tripCategory === "Outside Town" && (
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-2">
                  Multi-day or single-day research field expeditions across Oromia research centers, woreda demonstration plots, seed multiplication farms, and off-road watersheds.
                </p>
              </div>
              <div className="mt-3 flex items-center gap-2 text-[11px] font-medium text-emerald-800 bg-white/80 p-1.5 rounded-lg border border-emerald-200">
                <Compass className="w-3.5 h-3.5 text-emerald-600" />
                <span>Supports multiple waypoints, overnight stays & heavy field equipment</span>
              </div>
            </button>
          </div>
        </div>

        {/* SECTION 1: Requester & Research Directorate Profile */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
            <Users className="w-4 h-4 text-emerald-600" />
            <span>1. Researcher / Employee Information</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={requesterName}
                onChange={(e) => setRequesterName(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Job Title / Designation *</label>
              <input
                type="text"
                required
                value={requesterTitle}
                onChange={(e) => setRequesterTitle(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Directorate / Department *</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                {OARI_DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mobile Phone (+251) * (Ethio Telecom SMS)</label>
              <input
                type="text"
                required
                placeholder="+251 911 234 567"
                value={requesterPhone}
                onChange={(e) => setRequesterPhone(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium text-emerald-900"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Instant SMS alert with driver phone & vehicle plate will be sent to this number.
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">Telegram Handle (@username) *</label>
                <a
                  href="https://t.me/cariqqobot"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-sky-600 hover:underline flex items-center gap-0.5"
                >
                  Join @cariqqobot <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
              <input
                type="text"
                required
                placeholder="@your_telegram_username"
                value={requesterTelegram}
                onChange={(e) => setRequesterTelegram(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 font-mono text-sky-900 bg-sky-50/40"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Real-time booking approval/rejection updates delivered via bot: <strong>https://t.me/cariqqobot</strong>
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Home Research Station *</label>
              <select
                value={stationBase}
                onChange={(e) => setStationBase(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                {OARI_CENTERS.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 2: Route & Schedule (Diverges by Category) */}
        {tripCategory === "Inside Town" ? (
          /* INSIDE TOWN (ADDIS ABABA) SECTION */
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span>2. Inside Town (Addis Ababa) Single-Day Mission Details</span>
              </h3>
              <button
                type="button"
                onClick={handleRunAiRouteOptimizer}
                disabled={isOptimizing}
                className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 font-semibold transition"
              >
                <Sparkles className={`w-3.5 h-3.5 text-amber-500 ${isOptimizing ? 'animate-spin' : ''}`} />
                <span>{isOptimizing ? "Analyzing City Route..." : "AI Traffic & Route Estimate"}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Origin / Departure Point</label>
                <input
                  type="text"
                  disabled
                  value="OARI Headquarter (Addis Ababa)"
                  className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-700 font-medium"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">Central vehicle dispatch pool at OARI HQ</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Addis Ababa Institutional Destination *</label>
                <select
                  value={selectedInsideTownDest}
                  onChange={(e) => setSelectedInsideTownDest(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  {ADDIS_ABABA_DESTINATIONS.map((d, i) => (
                    <option key={i} value={d.name}>{d.name} ({d.zone})</option>
                  ))}
                  <option value="Other Custom Institutional Location">Other / Custom Government Agency</option>
                </select>
              </div>
            </div>

            {selectedInsideTownDest === "Other Custom Institutional Location" && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Specify Exact Location / Office Building *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ethiopian Biodiversity Institute, Kazanchis / Oromia Regional Bureau, Sarbet"
                  value={customInsideTownDest}
                  onChange={(e) => setCustomInsideTownDest(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}

            {/* Single Day Timing */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mission Date (Single Day) *</label>
                <input
                  type="date"
                  required
                  value={insideTownDate}
                  onChange={(e) => setInsideTownDate(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">HQ Departure / Pickup Time *</label>
                <input
                  type="time"
                  required
                  value={insideTownPickupTime}
                  onChange={(e) => setInsideTownPickupTime(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Estimated Return Time (Same Day) *</label>
                <input
                  type="time"
                  required
                  value={insideTownReturnTime}
                  onChange={(e) => setInsideTownReturnTime(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>
            </div>

            <div className="pt-1">
              <label className="block font-semibold text-slate-700 mb-1">Mission Purpose Category *</label>
              <input
                type="text"
                required
                list="mission-purpose-suggestions"
                placeholder="e.g. Official Ministry Meeting, Laboratory Reagents Procurement, Liaison Run..."
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>
          </div>
        ) : (
          /* OUTSIDE TOWN (FIELD MISSION) SECTION */
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>2. Route, Schedule & Mission Objective (Outside Town)</span>
              </h3>
              <button
                type="button"
                onClick={handleRunAiRouteOptimizer}
                disabled={isOptimizing}
                className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 font-semibold transition"
              >
                <Sparkles className={`w-3.5 h-3.5 text-amber-500 ${isOptimizing ? 'animate-spin' : ''}`} />
                <span>{isOptimizing ? "Optimizing Route..." : "AI Route & Terrain Analysis"}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Origin / Departure Station *</label>
                <input
                  type="text"
                  required
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Final Destination / Research Site *</label>
                <input
                  type="text"
                  required
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Waypoints / Research Stops */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Intermediate Research Stops / Waypoints</label>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Add sub-station, farmer demonstration site, or nursery..."
                  value={waypointInput}
                  onChange={(e) => setWaypointInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddWaypoint(); } }}
                  className="flex-1 p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleAddWaypoint}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Stop
                </button>
              </div>

              {waypoints.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {waypoints.map((wp, idx) => (
                    <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                      <span className="w-4 h-4 rounded-full bg-emerald-200 text-emerald-900 flex items-center justify-center text-[10px] font-bold mr-1.5">
                        {idx + 1}
                      </span>
                      {wp}
                      <button
                        type="button"
                        onClick={() => handleRemoveWaypoint(idx)}
                        className="ml-1.5 text-emerald-700 hover:text-rose-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Dates & Purpose */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Departure Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Estimated Return Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mission Purpose Category *</label>
                <input
                  type="text"
                  required
                  list="mission-purpose-suggestions"
                  placeholder="e.g. Field Crop Research & Phenotyping, Soil Sampling, Seed Distribution..."
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>
            </div>

            {/* Shared Datalist for Purpose Suggestions */}
            <datalist id="mission-purpose-suggestions">
              <option value="Field Crop Research & Phenotyping" />
              <option value="Seed Distribution & Multiplication" />
              <option value="Soil & Water Sampling" />
              <option value="Farmer Training & Field Day Demonstration" />
              <option value="Livestock Breed Assessment & Veterinary Survey" />
              <option value="Pest & Plant Disease Emergency Outreach" />
              <option value="Administrative & Financial Audit Mission" />
              <option value="Inside Town Official Run & Liaison" />
            </datalist>
          </div>
        )}

        {/* AI Route Optimizer Output Card (if generated) */}
        {aiRouteData && (
          <div className="bg-emerald-950 text-white p-5 rounded-xl border border-emerald-600/50 shadow-lg space-y-3">
            <div className="flex items-center justify-between border-b border-emerald-800 pb-2">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                <span className="font-bold text-sm text-emerald-300">Gemini AI Mission & Logistics Assessment</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-800/80 text-emerald-200 font-mono">
                {tripCategory === "Inside Town" ? "Addis Ababa City Corridor" : "OARI Regional Route Heuristics"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center">
              <div className="bg-slate-900/80 p-3 rounded-lg border border-emerald-800/60">
                <div className="text-slate-400 text-[11px]">Estimated Distance</div>
                <div className="text-base font-bold text-emerald-400 font-mono">{aiRouteData.estimatedKm} km</div>
                <div className="text-[10px] text-slate-400">Round trip incl. access trails</div>
              </div>
              <div className="bg-slate-900/80 p-3 rounded-lg border border-emerald-800/60">
                <div className="text-slate-400 text-[11px]">Travel Duration</div>
                <div className="text-base font-bold text-amber-300 font-mono">{aiRouteData.estimatedHours} Hours</div>
                <div className="text-[10px] text-slate-400">Terrain & traffic adjusted</div>
              </div>
              <div className="bg-slate-900/80 p-3 rounded-lg border border-emerald-800/60">
                <div className="text-slate-400 text-[11px]">Estimated Fuel Needed</div>
                <div className="text-base font-bold text-sky-400 font-mono">{aiRouteData.fuelEstimateLiters} Liters</div>
                <div className="text-[10px] text-slate-400">~ETB {(aiRouteData.fuelEstimateLiters * 97).toFixed(0)}</div>
              </div>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-lg border border-emerald-900 text-slate-300 text-xs">
              <div className="font-semibold text-emerald-300 mb-1 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-amber-400" />
                <span>Road Condition & Terrain Advisory:</span>
              </div>
              <p>{aiRouteData.terrainAdvisory}</p>
            </div>

            {aiRouteData.safetyChecklist && aiRouteData.safetyChecklist.length > 0 && (
              <div className="pt-1">
                <div className="text-[11px] font-semibold text-slate-300 mb-1.5">Safety & Protocol Checklist:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {aiRouteData.safetyChecklist.map((item, idx) => (
                    <div key={idx} className="flex items-center space-x-1.5 text-slate-300 text-[11px]">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SECTION 3: Passenger Manifest & Payload Specifications */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
            <Package className="w-4 h-4 text-emerald-600" />
            <span>3. Passenger Manifest & Cargo Specifications</span>
          </h3>

          {/* Passengers */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-slate-700">Passenger Manifest ({passengerNames.length} persons)</label>
              <span className="text-slate-500 text-[11px]">Required for official travel manifest & insurance</span>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                placeholder="Enter researcher name, designation or team role..."
                value={passengerInput}
                onChange={(e) => setPassengerInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddPassenger(); } }}
                className="flex-1 p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={handleAddPassenger}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Passenger
              </button>
            </div>

            <div className="space-y-2">
              {/* Passenger 1: Team Leader (Auto-synced with Researcher Name) */}
              <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200 text-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-2xs">
                    1
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{requesterName || "Principal Researcher"}</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-200/90 text-emerald-900 text-[10px] font-extrabold flex items-center gap-1 border border-emerald-300">
                        <Check className="w-3 h-3 text-emerald-700" />
                        <span>Team Leader</span>
                      </span>
                    </div>
                    <div className="text-[11px] text-emerald-800 font-medium">
                      Auto-synced with Section 1: {requesterTitle || "Lead Scientist"} ({department})
                    </div>
                  </div>
                </div>
                <div className="text-[11px] text-emerald-700 font-bold bg-white px-2.5 py-1 rounded-md border border-emerald-200 shadow-2xs">
                  Manifest Lead
                </div>
              </div>

              {/* Additional Co-Passengers */}
              {coPassengers.map((pName, coIdx) => (
                <div key={coIdx} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-slate-700 hover:bg-slate-100/70 transition">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold">
                      {coIdx + 2}
                    </span>
                    <span className="font-medium text-slate-800">{pName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemovePassenger(coIdx)}
                    className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition"
                    title="Remove co-passenger"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Cargo & Payload */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Cargo / Sample / Equipment Description</label>
              <textarea
                rows={2}
                value={cargoDescription}
                onChange={(e) => setCargoDescription(e.target.value)}
                placeholder="Describe seed sacks, soil augers, lab reagents, cool boxes, plant samples, trial binders..."
                className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Approx. Weight (kg)</label>
              <input
                type="number"
                value={cargoWeightKg}
                onChange={(e) => setCargoWeightKg(Number(e.target.value))}
                className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Standard Hilux payload capacity: 800 kg
              </span>
            </div>
          </div>

          {/* Preferred Vehicle & Urgency */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Requested Vehicle Class</label>
              <select
                value={preferredVehicleType}
                onChange={(e) => setPreferredVehicleType(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="4WD Pickup">4WD Pickup (Toyota Hilux / Isuzu D-Max)</option>
                <option value="Land Cruiser Hardtop">Land Cruiser Hardtop (HZJ79 / 78 Troop Carrier)</option>
                <option value="SUV / Prado">SUV / Toyota Prado (Field Delegations / Senior Management)</option>
                <option value="Minibus / Crew">Minibus (HiAce 15-Seater Researcher Crew)</option>
                <option value="Agri-Truck">Agri-Truck (Bulk Seed / Fertilizer Transport)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mission Urgency Level</label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as TripRequest["urgency"])}
                className={`w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 font-semibold ${
                  urgency === "Critical / Emergency" ? "bg-rose-50 border-rose-300 text-rose-800" :
                  urgency === "High" ? "bg-amber-50 border-amber-300 text-amber-800" : "bg-white border-slate-200 text-slate-700"
                }`}
              >
                <option value="Normal">Normal (Standard research schedule)</option>
                <option value="High">High (Planting season / time-critical phenotyping)</option>
                <option value="Critical / Emergency">Critical / Emergency (Pest outbreak / immediate farm audit)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submit & Automated Telegram Notice */}
        <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <MessageSquare className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-slate-800 text-xs">Real-Time Telegram (@cariqqobot) & Ethio Telecom SMS Notification</div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Upon submitting, your request enters <strong>Stage 1: Immediate Director Review</strong>. Once permitted, it advances to <strong>Stage 2: Fleet Manager Authorization</strong>. Real-time approval links and rejection reasons are instantly delivered to your Telegram and SMS.
              </p>
            </div>
          </div>

          <button
            type="submit"
            className="flex items-center justify-center space-x-2 px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition whitespace-nowrap"
          >
            <Send className="w-4 h-4" />
            <span>Submit Car Booking Request</span>
          </button>
        </div>
      </form>
    </div>
  );
};
