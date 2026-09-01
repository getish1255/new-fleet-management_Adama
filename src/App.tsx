import React, { useState, useEffect, useCallback } from "react";
import { 
  Header 
} from "./components/Header";
import { 
  FleetTracker 
} from "./components/FleetTracker";
import { 
  BookingForm 
} from "./components/BookingForm";
import { 
  ApprovalTravelLogs 
} from "./components/ApprovalTravelLogs";
import { 
  SMSDispatchCenter 
} from "./components/SMSDispatchCenter";
import { 
  FuelManagement 
} from "./components/FuelManagement";
import { 
  MaintenanceHub 
} from "./components/MaintenanceHub";
import { 
  TravelVoucherModal 
} from "./components/TravelVoucherModal";
import { 
  RoleAuthModal 
} from "./components/RoleAuthModal";
import { 
  OfficerManagementModal 
} from "./components/OfficerManagementModal";
import { 
  Vehicle, 
  Driver, 
  TripRequest, 
  TravelLog, 
  SMSAlert, 
  FuelRecord, 
  MaintenanceRecord, 
  Role, 
  Language,
  NotificationChannel,
  InstitutionalOfficer
} from "./types";
import { 
  MOCK_VEHICLES, 
  MOCK_DRIVERS, 
  MOCK_TRIP_REQUESTS, 
  MOCK_TRAVEL_LOGS, 
  MOCK_SMS_ALERTS, 
  MOCK_FUEL_RECORDS, 
  MOCK_MAINTENANCE_RECORDS,
  MOCK_OFFICERS
} from "./data/mockData";
import { ROLE_CONFIGS } from "./data/roles";
import { 
  CheckCircle2, 
  MessageSquare, 
  AlertCircle, 
  X,
  Smartphone,
  Car,
  Fuel,
  Clock,
  Wrench,
  KeyRound,
  ShieldCheck
} from "lucide-react";

export default function App() {
  // Global App States
  const [activeTab, setActiveTab] = useState<string>("booking");
  const [currentRole, setCurrentRole] = useState<Role>(() => {
    const saved = localStorage.getItem("oari_user_role");
    if (saved && ROLE_CONFIGS[saved as Role]) {
      return saved as Role;
    }
    return "Researcher / Employee";
  });
  const [currentLanguage, setCurrentLanguage] = useState<Language>("English");

  // Role Authentication Modal State
  const [isRoleAuthOpen, setIsRoleAuthOpen] = useState<boolean>(false);
  const [targetRolePrompt, setTargetRolePrompt] = useState<Role | null>(null);

  // Core Data Stores with localStorage instant caching
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    try {
      const cached = localStorage.getItem("oari_vehicles_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return MOCK_VEHICLES;
  });

  const [drivers, setDrivers] = useState<Driver[]>(() => {
    try {
      const cached = localStorage.getItem("oari_drivers_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return MOCK_DRIVERS;
  });

  const [tripRequests, setTripRequests] = useState<TripRequest[]>(() => {
    try {
      const cached = localStorage.getItem("oari_trip_requests_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return MOCK_TRIP_REQUESTS;
  });

  const [travelLogs, setTravelLogs] = useState<TravelLog[]>(() => {
    try {
      const cached = localStorage.getItem("oari_travel_logs_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return MOCK_TRAVEL_LOGS;
  });

  const [smsAlerts, setSmsAlerts] = useState<SMSAlert[]>(() => {
    try {
      const cached = localStorage.getItem("oari_sms_alerts_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return MOCK_SMS_ALERTS;
  });

  const [fuelRecords, setFuelRecords] = useState<FuelRecord[]>(() => {
    try {
      const cached = localStorage.getItem("oari_fuel_records_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return MOCK_FUEL_RECORDS;
  });

  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>(() => {
    try {
      const cached = localStorage.getItem("oari_maintenance_records_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return MOCK_MAINTENANCE_RECORDS;
  });

  const [officers, setOfficers] = useState<InstitutionalOfficer[]>(() => {
    try {
      const cached = localStorage.getItem("oari_officers_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return MOCK_OFFICERS;
  });

  // Workflow Modal States
  const [preselectedVehicle, setPreselectedVehicle] = useState<Vehicle | null>(null);
  const [voucherModalRequest, setVoucherModalRequest] = useState<TripRequest | null>(null);
  const [voucherModalLog, setVoucherModalLog] = useState<TravelLog | null>(null);
  const [isOfficerModalOpen, setIsOfficerModalOpen] = useState<boolean>(false);

  // Toast Notification State
  const [toast, setToast] = useState<{
    id: string;
    type: "success" | "sms" | "info" | "error";
    title: string;
    message: string;
  } | null>(null);

  const showToast = (type: "success" | "sms" | "info" | "error", title: string, message: string) => {
    const id = Date.now().toString();
    setToast({ id, type, title, message });
    setTimeout(() => {
      setToast((curr) => (curr?.id === id ? null : curr));
    }, 6000);
  };

  const [lastSyncedAt, setLastSyncedAt] = useState<Date>(new Date());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Fetch live synchronized data from Express backend
  const fetchData = useCallback(async () => {
    try {
      setIsSyncing(true);
      const t = Date.now();
      const headers = { 
        "Cache-Control": "no-cache, no-store, must-revalidate", 
        "Pragma": "no-cache" 
      };

      const [vRes, dRes, rRes, lRes, sRes, fRes, mRes, oRes] = await Promise.all([
        fetch(`/api/vehicles?_t=${t}`, { headers }),
        fetch(`/api/drivers?_t=${t}`, { headers }),
        fetch(`/api/requests?_t=${t}`, { headers }),
        fetch(`/api/travel-logs?_t=${t}`, { headers }),
        fetch(`/api/sms-alerts?_t=${t}`, { headers }),
        fetch(`/api/fuel-records?_t=${t}`, { headers }),
        fetch(`/api/maintenance?_t=${t}`, { headers }),
        fetch(`/api/officers?_t=${t}`, { headers })
      ]);

      if (vRes.ok) {
        const data = await vRes.json();
        const list = Array.isArray(data) ? data : (data.vehicles || []);
        if (Array.isArray(list)) {
          setVehicles(list);
          try { localStorage.setItem("oari_vehicles_cache", JSON.stringify(list)); } catch (e) {}
        }
      }
      if (dRes.ok) {
        const data = await dRes.json();
        const list = Array.isArray(data) ? data : (data.drivers || []);
        if (Array.isArray(list)) {
          setDrivers(list);
          try { localStorage.setItem("oari_drivers_cache", JSON.stringify(list)); } catch (e) {}
        }
      }
      if (rRes.ok) {
        const data = await rRes.json();
        const list = Array.isArray(data) ? data : (data.requests || []);
        if (Array.isArray(list)) {
          setTripRequests(list);
          try { localStorage.setItem("oari_trip_requests_cache", JSON.stringify(list)); } catch (e) {}
        }
      }
      if (lRes.ok) {
        const data = await lRes.json();
        const list = Array.isArray(data) ? data : (data.travelLogs || []);
        if (Array.isArray(list)) {
          setTravelLogs(list);
          try { localStorage.setItem("oari_travel_logs_cache", JSON.stringify(list)); } catch (e) {}
        }
      }
      if (sRes.ok) {
        const data = await sRes.json();
        const list = Array.isArray(data) ? data : (data.alerts || []);
        if (Array.isArray(list)) {
          setSmsAlerts(list);
          try { localStorage.setItem("oari_sms_alerts_cache", JSON.stringify(list)); } catch (e) {}
        }
      }
      if (fRes.ok) {
        const data = await fRes.json();
        const list = Array.isArray(data) ? data : (data.fuelRecords || []);
        if (Array.isArray(list)) {
          setFuelRecords(list);
          try { localStorage.setItem("oari_fuel_records_cache", JSON.stringify(list)); } catch (e) {}
        }
      }
      if (mRes.ok) {
        const data = await mRes.json();
        const list = Array.isArray(data) ? data : (data.maintenanceRecords || []);
        if (Array.isArray(list)) {
          setMaintenanceRecords(list);
          try { localStorage.setItem("oari_maintenance_records_cache", JSON.stringify(list)); } catch (e) {}
        }
      }
      if (oRes.ok) {
        const data = await oRes.json();
        const list = Array.isArray(data) ? data : (data.officers || []);
        if (Array.isArray(list)) {
          setOfficers(list);
          try { localStorage.setItem("oari_officers_cache", JSON.stringify(list)); } catch (e) {}
        }
      }
      setLastSyncedAt(new Date());
    } catch (e) {
      console.warn("Backend API offline, using local state store:", e);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Multi-device real-time sync heartbeat (1.5s interval)
    const interval = setInterval(() => {
      fetchData();
    }, 1500);

    // Immediate refresh on window focus and visibility change
    const handleActiveState = () => {
      fetchData();
    };
    window.addEventListener("focus", handleActiveState);
    window.addEventListener("visibilitychange", handleActiveState);
    window.addEventListener("storage", handleActiveState);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleActiveState);
      window.removeEventListener("visibilitychange", handleActiveState);
      window.removeEventListener("storage", handleActiveState);
    };
  }, [fetchData]);

  // Request Car Action from Fleet Tracker
  const handleRequestVehicleFromFleet = (vehicle: Vehicle) => {
    setPreselectedVehicle(vehicle);
    setActiveTab("booking");
  };

  // Submit New Trip Request (POST /api/requests)
  const handleSubmitBooking = async (requestData: Partial<TripRequest>) => {
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData)
      });

      if (res.ok) {
        const data = await res.json();
        const created: TripRequest = data.request || data;
        setTripRequests(prev => [created, ...prev.filter(r => r.id !== created.id)]);
        setPreselectedVehicle(null);
        await fetchData(); // Immediately fetch alerts & server state
        showToast(
          "sms",
          "Trip Request Submitted!",
          `Mission #${created.requestNumber} queued for Stage 1 Immediate Director review. Instant notifications sent via Telegram (@cariqqobot) & SMS.`
        );
        setActiveTab("approvals");
        return;
      }
    } catch (err) {
      console.error(err);
    }

    // Local fallback
    const fallbackReq: TripRequest = {
      id: `req-${Date.now()}`,
      requestNumber: `OARI-REQ-${Math.floor(1000 + Math.random() * 9000)}`,
      requesterName: requestData.requesterName || "Researcher",
      requesterTitle: requestData.requesterTitle || "Scientist",
      department: requestData.department || "Crops Directorate",
      requesterPhone: requestData.requesterPhone || "+251 911 000 000",
      requesterEmail: requestData.requesterEmail || "research@oari.gov.et",
      requesterTelegram: requestData.requesterTelegram || "@researcher",
      stationBase: requestData.stationBase || "Sinana Agricultural Research Center",
      tripCategory: requestData.tripCategory || "Outside Town",
      origin: requestData.origin || "Sinana",
      destination: requestData.destination || "Agarfa Farms",
      waypoints: requestData.waypoints || [],
      departureDate: requestData.departureDate || new Date().toISOString(),
      returnDate: requestData.returnDate || new Date().toISOString(),
      purpose: requestData.purpose || "Field Crop Research & Phenotyping",
      passengerCount: requestData.passengerCount || 3,
      passengerNames: requestData.passengerNames || [],
      cargoDescription: requestData.cargoDescription || "Seed samples",
      cargoWeightKg: requestData.cargoWeightKg || 100,
      urgency: requestData.urgency || "Normal",
      status: "Pending Director Approval",
      createdAt: new Date().toISOString(),
      estimatedKm: requestData.estimatedKm || 320,
      estimatedFuelLiters: requestData.estimatedFuelLiters || 45
    };
    setTripRequests(prev => [fallbackReq, ...prev]);
    setPreselectedVehicle(null);
    showToast("success", "Request Created", `Request #${fallbackReq.requestNumber} registered and queued for Stage 1 Director Review.`);
    setActiveTab("approvals");
  };

  // Director Review (Stage 1: Permit or Deny)
  const handleDirectorReview = async (
    requestId: string,
    action: "permit" | "deny",
    notes: string,
    directorName: string,
    channels: ("SMS" | "Telegram" | "Email")[] = ["SMS", "Telegram"]
  ) => {
    try {
      const res = await fetch(`/api/requests/${requestId}/director-review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, notes, directorName, channels })
      });

      if (res.ok) {
        await fetchData();
        const req = tripRequests.find(r => r.id === requestId);
        if (action === "permit") {
          showToast(
            "success",
            "Director Endorsement Granted",
            `Request #${req?.requestNumber || requestId} forwarded to Fleet Manager for vehicle/driver authorization.`
          );
        } else {
          showToast(
            "info",
            "Request Denied by Director",
            `Decline notice sent to requester with explanation.`
          );
        }
        return;
      }
    } catch (err) {
      console.error("Director review API error:", err);
    }

    // Local state fallback
    setTripRequests(prev => prev.map(r => {
      if (r.id !== requestId) return r;
      if (action === "permit") {
        return {
          ...r,
          status: "Pending Fleet Manager Authorization",
          directorApprovedBy: directorName,
          directorApprovedAt: new Date().toISOString(),
          directorNotes: notes
        };
      } else {
        return {
          ...r,
          status: "Rejected by Director",
          directorRejectionReason: notes,
          rejectionReason: `Director Decision: ${notes}`
        };
      }
    }));

    if (action === "permit") {
      showToast(
        "success",
        "Director Endorsement Granted",
        "Request permitted and forwarded to Fleet Manager."
      );
    } else {
      showToast(
        "info",
        "Request Denied by Director",
        "Notice sent to employee with justification."
      );
    }
  };

  // Approve Request (Stage 2: Fleet Manager Authorization & Vehicle Dispatch)
  const handleApproveRequest = async (
    requestId: string,
    vehicleId: string,
    driverId: string,
    approverName: string,
    channels: ("SMS" | "Telegram" | "Email")[] = ["SMS", "Telegram", "Email"]
  ) => {
    try {
      const res = await fetch(`/api/requests/${requestId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleId, driverId, approverName, channels })
      });

      if (res.ok) {
        await fetchData();

        const req = tripRequests.find(r => r.id === requestId);
        showToast(
          "sms",
          "Mission Approved & Dispatched!",
          `Alerts dispatched via ${channels.join(', ')} to Driver & Requester (${req?.requesterName || 'Employee'}). Travel log generated.`
        );
        return;
      } else {
        const errorData = await res.json().catch(() => null);
        if (errorData && errorData.error) {
          showToast("info", "Allocation Blocked", errorData.error);
          return;
        }
      }
    } catch (err) {
      console.error("API call failed, checking local state fallback:", err);
    }

    // Local state fallback / instant optimistic update with availability check
    const vehicle = vehicles.find(v => v.id === vehicleId);
    const driver = drivers.find(d => d.id === driverId);
    const req = tripRequests.find(r => r.id === requestId);

    if (!vehicle || vehicle.status !== "Available") {
      showToast("info", "Vehicle Unavailable", `Vehicle ${vehicle?.plateNumber || vehicleId} is currently ${vehicle?.status || 'Unavailable'}. Only returned/available cars can be allocated.`);
      return;
    }

    const isDriverAvail = driver && (driver.status === "Active / Available" || driver.status === "Active" || (driver.status as string) === "Available");
    if (!driver || !isDriverAvail) {
      showToast("info", "Driver Unavailable", `Driver ${driver?.name || driverId} is currently ${driver?.status || 'Unavailable'}. Only available drivers can be assigned.`);
      return;
    }

    if (req && vehicle && driver) {
      // Update request
      const updatedReq: TripRequest = {
        ...req,
        status: "Approved",
        assignedVehicleId: vehicle.id,
        assignedVehiclePlate: vehicle.plateNumber,
        assignedDriverId: driver.id,
        assignedDriverName: driver.name,
        assignedDriverPhone: driver.phone,
        approvedBy: approverName,
        approvedAt: new Date().toISOString(),
        notificationChannels: channels
      };

      // Create Travel Log
      const newLog: TravelLog = {
        id: `log-${Date.now()}`,
        logNumber: `LOG-${req.requestNumber.replace("OARI-REQ-", "")}`,
        tripRequestId: req.id,
        vehicleId: vehicle.id,
        vehiclePlate: vehicle.plateNumber,
        driverId: driver.id,
        driverName: driver.name,
        requesterName: req.requesterName,
        origin: req.origin,
        destination: req.destination,
        startTime: req.departureDate,
        startOdometerKm: vehicle.odometerKm,
        purpose: req.purpose,
        fuelIssuedLiters: req.estimatedFuelLiters || 45,
        fuelCostEtb: (req.estimatedFuelLiters || 45) * 97.00,
        voucherNumber: `OARI-TRV-${Math.floor(1000 + Math.random() * 9000)}`,
        status: "Active Mission"
      };

      const newAlerts: SMSAlert[] = [];
      const depTime = new Date(req.departureDate).toLocaleString();

      if (channels.includes("SMS")) {
        newAlerts.push(
          {
            id: `sms-${Date.now()}-1`,
            channel: "SMS",
            recipientType: "Customer",
            recipientName: req.requesterName,
            recipientPhone: req.requesterPhone,
            tripRequestNumber: req.requestNumber,
            message: `[OARI TRANSPORT] Your mission #${req.requestNumber} to ${req.destination} is APPROVED. Driver: ${driver.name} (📞 ${driver.phone}). Vehicle: ${vehicle.plateNumber} (${vehicle.model}). Safe journey!`,
            status: "Delivered",
            sentAt: new Date().toISOString(),
            gatewayRef: `ETH-SMS-${Math.floor(100000 + Math.random() * 900000)}`,
            costEtb: 0.00
          },
          {
            id: `sms-${Date.now()}-2`,
            channel: "SMS",
            recipientType: "Driver",
            recipientName: driver.name,
            recipientPhone: driver.phone,
            tripRequestNumber: req.requestNumber,
            message: `[OARI DISPATCH] Assigned Mission #${req.requestNumber}. Requester: ${req.requesterName} (📞 ${req.requesterPhone}). Route: ${req.origin} → ${req.destination}. Vehicle: ${vehicle.plateNumber}. Travel Voucher issued.`,
            status: "Delivered",
            sentAt: new Date().toISOString(),
            gatewayRef: `ETH-SMS-${Math.floor(100000 + Math.random() * 900000)}`,
            costEtb: 0.00
          }
        );
      }

      if (channels.includes("Telegram")) {
        newAlerts.push({
          id: `tg-${Date.now()}-1`,
          channel: "Telegram",
          recipientType: "Customer",
          recipientName: req.requesterName,
          recipientPhone: req.requesterPhone,
          recipientTelegram: req.requesterTelegram || `@${req.requesterName.toLowerCase().replace(/\s+/g, '_')}`,
          tripRequestNumber: req.requestNumber,
          subject: `🤖 OARI Fleet Bot • Mission #${req.requestNumber} Authorized`,
          message: `✅ *MISSION APPROVED #${req.requestNumber}*\n\n📍 *Destination:* ${req.destination}\n🚘 *Car:* ${vehicle.plateNumber} (${vehicle.model})\n👤 *Driver:* ${driver.name} (${driver.phone})\n📅 *Dep:* ${depTime}`,
          status: "Delivered",
          sentAt: new Date().toISOString(),
          gatewayRef: `TG-BOT-${Math.floor(100000 + Math.random() * 900000)}`,
          costEtb: 0.00
        });
      }

      if (channels.includes("Email")) {
        newAlerts.push({
          id: `email-${Date.now()}-1`,
          channel: "Email",
          recipientType: "Customer",
          recipientName: req.requesterName,
          recipientPhone: req.requesterPhone,
          recipientEmail: req.requesterEmail || `${req.requesterName.toLowerCase().replace(/\s+/g, '.')}@oari.gov.et`,
          tripRequestNumber: req.requestNumber,
          subject: `[OARI Logistics] Official Travel Authorization & Vehicle Dispatch #${req.requestNumber}`,
          message: `Dear ${req.requesterName},\n\nYour trip #${req.requestNumber} to ${req.destination} has been approved.\nAllocated Vehicle: ${vehicle.plateNumber}\nDriver: ${driver.name} (${driver.phone})`,
          status: "Delivered",
          sentAt: new Date().toISOString(),
          gatewayRef: `SMTP-OARI-${Math.floor(100000 + Math.random() * 900000)}`,
          costEtb: 0.00
        });
      }

      setTripRequests(prev => prev.map(r => r.id === req.id ? updatedReq : r));
      setTravelLogs(prev => [newLog, ...prev]);
      setSmsAlerts(prev => [...newAlerts, ...prev]);
      setVehicles(prev => prev.map(v => v.id === vehicle.id ? { ...v, status: "On Mission" } : v));
      setDrivers(prev => prev.map(d => d.id === driver.id ? { ...d, status: "On Trip" } : d));

      showToast(
        "sms",
        "Mission Approved & Dispatched!",
        `Notified via ${channels.join(', ')} to ${req.requesterName} and Driver ${driver.name}.`
      );
    }
  };

  // Reject Request
  // Reject Request
  const handleRejectRequest = async (
    requestId: string,
    reason: string,
    channels: ("SMS" | "Telegram" | "Email")[] = ["SMS", "Telegram", "Email"]
  ) => {
    // 1. Optimistic instant local update
    const targetReq = tripRequests.find(r => r.id === requestId);
    setTripRequests(prev => prev.map(r => r.id === requestId ? { 
      ...r, 
      status: "Rejected by Fleet Manager", 
      rejectionReason: reason,
      fleetManagerRejectionReason: reason,
      fleetManagerApprovedBy: "Eng. Wondimu Bedada (Fleet Super Admin)"
    } : r));

    if (targetReq?.assignedVehicleId) {
      setVehicles(prev => prev.map(v => v.id === targetReq.assignedVehicleId ? { ...v, status: "Available" } : v));
    }
    if (targetReq?.assignedDriverId) {
      setDrivers(prev => prev.map(d => d.id === targetReq.assignedDriverId ? { ...d, status: "Active / Available" } : d));
    }

    try {
      const res = await fetch(`/api/requests/${requestId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          reason, 
          rejectionReason: reason, 
          channels,
          approverName: "Eng. Wondimu Bedada (Fleet Super Admin)"
        })
      });
      if (res.ok) {
        await fetchData();
        showToast("info", "Request Declined", `Official rejection notice dispatched via ${channels.join(', ')}.`);
      } else {
        showToast("info", "Request Declined", `Rejection logged for #${targetReq?.requestNumber || requestId}.`);
      }
    } catch (err) {
      console.error("Reject request error:", err);
      showToast("info", "Request Declined", "Rejection notice saved locally.");
    }
  };

  // Complete Mission Audit (POST /api/requests/:id/complete)
  const handleCompleteTrip = async (requestId: string, endOdometer: number, notes: string) => {
    const endOdo = Number(endOdometer) || 0;
    const targetReq = tripRequests.find(r => r.id === requestId);

    // 1. Optimistic instant state updates across requests, vehicles, drivers, and travel logs
    setTripRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: "Completed" } : r));

    if (targetReq?.assignedVehicleId) {
      setVehicles(prev => prev.map(v => v.id === targetReq.assignedVehicleId ? { 
        ...v, 
        status: "Available",
        odometerKm: endOdo > 0 ? endOdo : v.odometerKm
      } : v));
    }

    if (targetReq?.assignedDriverId) {
      setDrivers(prev => prev.map(d => d.id === targetReq.assignedDriverId ? { 
        ...d, 
        status: "Active / Available" 
      } : d));
    }

    setTravelLogs(prev => prev.map(l => {
      if (l.tripRequestId === requestId || (targetReq && l.tripRequestId === targetReq.id)) {
        const startKm = l.startOdometerKm || 0;
        const totalDist = endOdo > startKm ? endOdo - startKm : (l.totalDistanceKm || 120);
        return {
          ...l,
          status: "Completed",
          endOdometerKm: endOdo,
          totalDistanceKm: totalDist,
          endTime: new Date().toISOString(),
          officerRemarks: notes ? (l.officerRemarks ? `${l.officerRemarks} | ${notes}` : notes) : l.officerRemarks
        };
      }
      return l;
    }));

    try {
      const res = await fetch(`/api/requests/${requestId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          endOdometerKm: endOdo, 
          endOdometer: endOdo, 
          notes: notes || "Mission successfully completed and audited."
        })
      });
      if (res.ok) {
        await fetchData();
        showToast("success", "Mission Completed & Audited", `Vehicle returned to available fleet pool. Logged ${endOdo.toLocaleString()} km.`);
      } else {
        showToast("success", "Mission Completed & Audited", "Vehicle returned to available fleet pool.");
      }
    } catch (err) {
      console.error("Complete trip error:", err);
      showToast("success", "Mission Completed & Audited", "Vehicle returned to available fleet pool.");
    }
  };

  // Add Fuel Record
  const handleAddFuelRecord = async (record: Partial<FuelRecord>) => {
    try {
      const res = await fetch("/api/fuel-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(record)
      });
      if (res.ok) {
        await fetchData();
        showToast("success", "Fuel Voucher Logged", `Voucher recorded and tank volume reconciled.`);
      }
    } catch (err) {
      console.error(err);
      const newRec: FuelRecord = {
        id: `fuel-${Date.now()}`,
        voucherNumber: `OARI-FL-${Math.floor(1000 + Math.random() * 9000)}`,
        vehicleId: record.vehicleId || vehicles[0].id,
        vehiclePlate: record.vehiclePlate || vehicles[0].plateNumber,
        stationBase: record.stationBase || "Sinana",
        fuelStationName: record.fuelStationName || "NOC Station",
        liters: record.liters || 60,
        unitPriceEtb: record.unitPriceEtb || 97.00,
        totalCostEtb: record.totalCostEtb || 5820,
        odometerAtRefuel: record.odometerAtRefuel || 35000,
        date: record.date || new Date().toISOString().split('T')[0],
        driverName: record.driverName || "Driver",
        approvedBy: record.approvedBy || "Fleet Director"
      };
      setFuelRecords(prev => [newRec, ...prev]);
      showToast("success", "Fuel Voucher Logged", `Voucher #${newRec.voucherNumber} created.`);
    }
  };

  // Add Maintenance Record
  const handleAddMaintenanceRecord = async (record: Partial<MaintenanceRecord>) => {
    try {
      const res = await fetch("/api/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(record)
      });
      if (res.ok) {
        await fetchData();
        showToast("success", "Maintenance Job Card Created", `Job card created for ${record.vehiclePlate}.`);
      }
    } catch (err) {
      console.error(err);
      const newMaint: MaintenanceRecord = {
        id: `maint-${Date.now()}`,
        jobCardNumber: `JC-${Math.floor(1000 + Math.random() * 9000)}`,
        vehicleId: record.vehicleId || vehicles[0].id,
        vehiclePlate: record.vehiclePlate || vehicles[0].plateNumber,
        serviceType: record.serviceType || "Periodic Oil & Filter",
        status: record.status || "Scheduled",
        scheduledDate: record.scheduledDate || new Date().toISOString().split('T')[0],
        workshopName: record.workshopName || "OARI Workshop",
        odometerKm: record.odometerKm || 45000,
        costEtb: record.costEtb || 15000,
        technicianNotes: record.technicianNotes || "Periodic inspection",
        partsReplaced: record.partsReplaced || ["Oil Filter", "Engine Oil"]
      };
      setMaintenanceRecords(prev => [newMaint, ...prev]);
      showToast("success", "Job Card Created", `Job Card #${newMaint.jobCardNumber} created.`);
    }
  };

  // Send Custom SMS or Telegram Alert
  const handleSendCustomSMS = async (data: {
    recipientType: SMSAlert["recipientType"];
    recipientName: string;
    recipientPhone: string;
    message: string;
    tripRequestNumber?: string;
    channel?: NotificationChannel;
  }) => {
    try {
      const res = await fetch("/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        await fetchData();
        showToast("sms", `${data.channel || 'SMS'} Alert Delivered`, `Sent to ${data.recipientName} (${data.recipientPhone}).`);
      }
    } catch (err) {
      console.error(err);
      const newSms: SMSAlert = {
        id: `sms-${Date.now()}`,
        channel: data.channel || "Telegram",
        recipientType: data.recipientType,
        recipientName: data.recipientName,
        recipientPhone: data.recipientPhone,
        tripRequestNumber: data.tripRequestNumber || "OARI-BROADCAST",
        message: data.message,
        status: "Delivered",
        sentAt: new Date().toISOString(),
        gatewayRef: `OARI-ALERT-${Math.floor(100000 + Math.random() * 900000)}`,
        costEtb: 0.00
      };
      setSmsAlerts(prev => [newSms, ...prev]);
      showToast("sms", "Alert Broadcast Delivered", `Sent to ${data.recipientPhone}.`);
    }
  };

  // View & Print Official Travel Voucher
  const handleViewVoucher = (request: TripRequest, log?: TravelLog) => {
    setVoucherModalRequest(request);
    setVoucherModalLog(log || null);
  };

  const handleAddVehicle = async (newVehicle: Partial<Vehicle>) => {
    const vehicleObj: Vehicle = {
      id: newVehicle.id || `v-${Date.now()}`,
      plateNumber: newVehicle.plateNumber || "4-45000 ET",
      model: newVehicle.model || "Toyota Hilux 4x4",
      type: newVehicle.type || "4WD Pickup",
      year: Number(newVehicle.year) || 2024,
      fuelType: newVehicle.fuelType || "Diesel",
      fuelTankCapacity: Number(newVehicle.fuelTankCapacity) || 80,
      currentFuelLevel: Number(newVehicle.currentFuelLevel) || 70,
      odometerKm: Number(newVehicle.odometerKm) || 20000,
      stationBase: newVehicle.stationBase || "OARI Headquarter",
      status: (newVehicle.status as any) || "Available",
      assignedDriverName: newVehicle.assignedDriverName || "Station Pool Driver",
      driverPhone: newVehicle.driverPhone || "+251 911 000 000",
      nextServiceKm: Number(newVehicle.nextServiceKm) || 25000,
      lastServiceDate: newVehicle.lastServiceDate || new Date().toISOString().split('T')[0],
      coordinates: newVehicle.coordinates || { lat: 9.010, lng: 38.761 },
      features: newVehicle.features || ["Heavy Duty 4WD", "High Clearance", "GPS Tracker"],
      code: newVehicle.code || `OARI-${Math.floor(100 + Math.random() * 900)}`
    };

    // Update local state and cache immediately
    setVehicles(prev => {
      const updated = [vehicleObj, ...prev.filter(v => v.id !== vehicleObj.id && v.plateNumber !== vehicleObj.plateNumber)];
      try { localStorage.setItem("oari_vehicles_cache", JSON.stringify(updated)); } catch (e) {}
      return updated;
    });

    // If driver is assigned, update drivers state
    if (vehicleObj.assignedDriverName && vehicleObj.assignedDriverName !== "Station Pool Driver" && vehicleObj.assignedDriverName !== "Unassigned / Pool Driver") {
      setDrivers(prev => {
        const updated = prev.map(d => {
          if (d.id === vehicleObj.assignedDriverId || d.name.toLowerCase() === vehicleObj.assignedDriverName?.toLowerCase()) {
            return { ...d, assignedVehiclePlate: vehicleObj.plateNumber, currentVehicleId: vehicleObj.id, stationBase: vehicleObj.stationBase || d.stationBase };
          }
          return d;
        });
        try { localStorage.setItem("oari_drivers_cache", JSON.stringify(updated)); } catch (e) {}
        return updated;
      });
    }

    showToast("success", "Vehicle Registered", `Car ${vehicleObj.plateNumber} added to OARI fleet.`);

    try {
      const res = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vehicleObj)
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditVehicle = async (id: string, updatedData: Partial<Vehicle>) => {
    // Immediate state & cache update
    setVehicles(prev => {
      const updated = prev.map(v => v.id === id || v.plateNumber === id ? { ...v, ...updatedData } : v);
      try { localStorage.setItem("oari_vehicles_cache", JSON.stringify(updated)); } catch (e) {}
      return updated;
    });

    // If assignedDriverName changed, update driver state
    if (updatedData.assignedDriverName && updatedData.assignedDriverName !== "Station Pool Driver" && updatedData.assignedDriverName !== "Unassigned / Pool Driver") {
      setDrivers(prev => {
        const updated = prev.map(d => {
          if (d.name.toLowerCase() === updatedData.assignedDriverName?.toLowerCase() || d.id === updatedData.assignedDriverId) {
            return { ...d, assignedVehiclePlate: updatedData.plateNumber || d.assignedVehiclePlate, currentVehicleId: id };
          }
          return d;
        });
        try { localStorage.setItem("oari_drivers_cache", JSON.stringify(updated)); } catch (e) {}
        return updated;
      });
    }

    showToast("success", "Vehicle Information Updated", `Changes saved for ${updatedData.plateNumber || 'vehicle'}.`);

    try {
      const res = await fetch(`/api/vehicles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData)
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    const vehicleToDelete = safeVehicles.find(v => v.id === id || v.plateNumber === id);
    
    setVehicles(prev => {
      const updated = prev.filter(v => v.id !== id && v.plateNumber !== id);
      try { localStorage.setItem("oari_vehicles_cache", JSON.stringify(updated)); } catch (e) {}
      return updated;
    });

    // Unassign driver
    setDrivers(prev => {
      const updated = prev.map(d => (d.assignedVehiclePlate === vehicleToDelete?.plateNumber ? { ...d, assignedVehiclePlate: "Unassigned / Pool Car" } : d));
      try { localStorage.setItem("oari_drivers_cache", JSON.stringify(updated)); } catch (e) {}
      return updated;
    });

    showToast("info", "Vehicle Removed", `Vehicle ${vehicleToDelete?.plateNumber || ''} removed from fleet.`);

    try {
      const res = await fetch(`/api/vehicles/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateVehicleStatus = (id: string, updates: { status?: Vehicle["status"]; odometerKm?: number; currentFuelLevel?: number }) => {
    setVehicles(prev => {
      const updated = prev.map(v => v.id === id ? { ...v, ...updates } : v);
      try { localStorage.setItem("oari_vehicles_cache", JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
    showToast("success", "Vehicle Updated", "Fleet status updated successfully.");
  };

  const handleAddDriver = async (newDriver: Partial<Driver>) => {
    const driverObj: Driver = {
      id: newDriver.id || `d-${Date.now()}`,
      name: newDriver.name || "New Driver",
      phone: newDriver.phone || "+251 911 000 000",
      telegramHandle: newDriver.telegramHandle || `@${(newDriver.name || "driver").toLowerCase().replace(/\s+/g, '_')}`,
      licenseNumber: newDriver.licenseNumber || `OR-DL-${Math.floor(10000 + Math.random() * 90000)}`,
      stationBase: newDriver.stationBase || "OARI Headquarter",
      experienceYears: Number(newDriver.experienceYears) || 5,
      rating: 4.8,
      status: (newDriver.status as any) || "Active / Available",
      assignedVehiclePlate: newDriver.assignedVehiclePlate || "Unassigned / Pool Car",
      assignedVehicleId: newDriver.assignedVehicleId
    };

    setDrivers(prev => {
      const updated = [driverObj, ...prev.filter(d => d.id !== driverObj.id)];
      try { localStorage.setItem("oari_drivers_cache", JSON.stringify(updated)); } catch (e) {}
      return updated;
    });

    // If assigned to a registered car, update that vehicle
    if (driverObj.assignedVehiclePlate && driverObj.assignedVehiclePlate !== "Unassigned / Pool Car" && driverObj.assignedVehiclePlate !== "Station Pool" && driverObj.assignedVehiclePlate !== "None") {
      setVehicles(prev => {
        const updated = prev.map(v => {
          if (v.plateNumber === driverObj.assignedVehiclePlate || v.id === driverObj.assignedVehicleId) {
            return {
              ...v,
              assignedDriverId: driverObj.id,
              assignedDriverName: driverObj.name,
              driverPhone: driverObj.phone,
              stationBase: driverObj.stationBase || v.stationBase
            };
          }
          return v;
        });
        try { localStorage.setItem("oari_vehicles_cache", JSON.stringify(updated)); } catch (e) {}
        return updated;
      });
    }

    showToast("success", "Driver Registered", `Driver ${driverObj.name} profile registered and assigned.`);

    try {
      const res = await fetch("/api/drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(driverObj)
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditDriver = async (id: string, updatedData: Partial<Driver>) => {
    setDrivers(prev => {
      const updated = prev.map(d => d.id === id ? { ...d, ...updatedData } : d);
      try { localStorage.setItem("oari_drivers_cache", JSON.stringify(updated)); } catch (e) {}
      return updated;
    });

    // If driver's assigned car or name/phone changed, update vehicles
    if (updatedData.assignedVehiclePlate && updatedData.assignedVehiclePlate !== "Unassigned / Pool Car" && updatedData.assignedVehiclePlate !== "Station Pool" && updatedData.assignedVehiclePlate !== "None") {
      setVehicles(prev => {
        const updated = prev.map(v => {
          if (v.plateNumber === updatedData.assignedVehiclePlate || v.id === updatedData.assignedVehicleId) {
            return {
              ...v,
              assignedDriverId: id,
              assignedDriverName: updatedData.name || v.assignedDriverName,
              driverPhone: updatedData.phone || v.driverPhone,
              stationBase: updatedData.stationBase || v.stationBase
            };
          }
          // Clear any old car
          if (v.assignedDriverId === id && v.plateNumber !== updatedData.assignedVehiclePlate) {
            return { ...v, assignedDriverName: "Station Pool Driver", driverPhone: "+251 911 000 000", assignedDriverId: undefined };
          }
          return v;
        });
        try { localStorage.setItem("oari_vehicles_cache", JSON.stringify(updated)); } catch (e) {}
        return updated;
      });
    } else if (updatedData.name || updatedData.phone) {
      setVehicles(prev => {
        const updated = prev.map(v => {
          if (v.assignedDriverId === id) {
            return {
              ...v,
              assignedDriverName: updatedData.name || v.assignedDriverName,
              driverPhone: updatedData.phone || v.driverPhone
            };
          }
          return v;
        });
        try { localStorage.setItem("oari_vehicles_cache", JSON.stringify(updated)); } catch (e) {}
        return updated;
      });
    }

    if (updatedData.name) {
      setTripRequests(prev => prev.map(r => r.assignedDriverId === id ? { ...r, assignedDriverName: updatedData.name! } : r));
      setTravelLogs(prev => prev.map(l => l.driverId === id ? { ...l, driverName: updatedData.name! } : l));
    }

    showToast("success", "Driver Information Updated", `Changes saved for ${updatedData.name || 'driver'}. All records synchronized.`);

    try {
      const res = await fetch(`/api/drivers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData)
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteDriver = async (id: string) => {
    const driverToDelete = safeDrivers.find(d => d.id === id);

    setDrivers(prev => {
      const updated = prev.filter(d => d.id !== id);
      try { localStorage.setItem("oari_drivers_cache", JSON.stringify(updated)); } catch (e) {}
      return updated;
    });

    // Unassign in vehicles
    setVehicles(prev => {
      const updated = prev.map(v => (v.assignedDriverId === id || v.assignedDriverName === driverToDelete?.name ? {
        ...v,
        assignedDriverName: "Station Pool Driver",
        driverPhone: "+251 911 000 000",
        assignedDriverId: undefined
      } : v));
      try { localStorage.setItem("oari_vehicles_cache", JSON.stringify(updated)); } catch (e) {}
      return updated;
    });

    showToast("info", "Driver Removed", `Driver ${driverToDelete?.name || ''} removed from registry.`);

    try {
      const res = await fetch(`/api/drivers/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Institutional Officer Management Handlers
  const handleRegisterOfficer = async (officerData: Omit<InstitutionalOfficer, "id">) => {
    const newOfficer: InstitutionalOfficer = {
      ...officerData,
      id: `off-${Date.now()}`
    };

    setOfficers(prev => {
      const updated = officerData.isPrimaryForRole
        ? [...prev.map(o => o.roleType === officerData.roleType ? { ...o, isPrimaryForRole: false } : o), newOfficer]
        : [...prev, newOfficer];
      try { localStorage.setItem("oari_officers_cache", JSON.stringify(updated)); } catch (e) {}
      return updated;
    });

    try {
      const res = await fetch("/api/officers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(officerData)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.officer) {
          setOfficers(prev => {
            const list = prev.map(o => o.id === newOfficer.id ? data.officer : o);
            try { localStorage.setItem("oari_officers_cache", JSON.stringify(list)); } catch (e) {}
            return list;
          });
        }
        await fetchData();
        showToast("success", "Officer Profile Registered", `${officerData.fullName} registered as institutional ${officerData.roleType}.`);
        return;
      }
    } catch (err) {
      console.error(err);
    }
    showToast("success", "Officer Profile Registered", `${officerData.fullName} registered as ${officerData.roleType}.`);
  };

  const handleUpdateOfficer = async (updatedOfficer: InstitutionalOfficer) => {
    // Instant optimistic update with localStorage persistence
    setOfficers(prev => {
      const updated = prev.map(o => {
        if (o.id === updatedOfficer.id) return updatedOfficer;
        if (updatedOfficer.isPrimaryForRole && o.roleType === updatedOfficer.roleType) {
          return { ...o, isPrimaryForRole: false };
        }
        return o;
      });
      try { localStorage.setItem("oari_officers_cache", JSON.stringify(updated)); } catch (e) {}
      return updated;
    });

    try {
      const res = await fetch(`/api/officers/${updatedOfficer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedOfficer)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.officer) {
          setOfficers(prev => {
            const updated = prev.map(o => {
              if (o.id === updatedOfficer.id) return data.officer;
              if (data.officer.isPrimaryForRole && o.roleType === data.officer.roleType) {
                return { ...o, isPrimaryForRole: false };
              }
              return o;
            });
            try { localStorage.setItem("oari_officers_cache", JSON.stringify(updated)); } catch (e) {}
            return updated;
          });
        }
        await fetchData();
        showToast("success", "Officer Profile Updated", `Details updated for ${updatedOfficer.fullName}.`);
        return;
      }
    } catch (err) {
      console.error(err);
    }
    showToast("success", "Officer Profile Updated", `Details updated for ${updatedOfficer.fullName}.`);
  };

  const handleDeleteOfficer = async (id: string) => {
    const officerToDelete = officers.find(o => o.id === id);
    setOfficers(prev => {
      const updated = prev.filter(o => o.id !== id);
      try { localStorage.setItem("oari_officers_cache", JSON.stringify(updated)); } catch (e) {}
      return updated;
    });

    try {
      const res = await fetch(`/api/officers/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        await fetchData();
        showToast("info", "Officer Profile Removed", `${officerToDelete?.fullName || 'Officer'} removed.`);
        return;
      }
    } catch (err) {
      console.error(err);
    }
    showToast("info", "Officer Profile Removed", `${officerToDelete?.fullName || 'Officer'} removed.`);
  };

  const handleSetActiveOfficer = async (officerId: string, roleType: "Director" | "Fleet Manager" | "Supervisor") => {
    setOfficers(prev => {
      const updated = prev.map(o => {
        if (o.roleType === roleType) {
          return { ...o, isPrimaryForRole: o.id === officerId };
        }
        return o;
      });
      try { localStorage.setItem("oari_officers_cache", JSON.stringify(updated)); } catch (e) {}
      return updated;
    });

    try {
      const res = await fetch("/api/officers/set-active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ officerId, roleType })
      });
      if (res.ok) {
        await fetchData();
        const off = officers.find(o => o.id === officerId);
        showToast("success", "Primary Authority Designated", `${off?.fullName || 'Officer'} set as active ${roleType} for official reports.`);
        return;
      }
    } catch (err) {
      console.error(err);
    }
    const off = officers.find(o => o.id === officerId);
    showToast("success", "Primary Authority Designated", `${off?.fullName || 'Officer'} set as active ${roleType} for official reports.`);
  };

  const handleSendUrgentBroadcast = () => {
    handleSendCustomSMS({
      channel: "SMS",
      recipientType: "Driver",
      recipientName: "All Active Field Drivers",
      recipientPhone: "+251 911 000 000",
      tripRequestNumber: "OARI-BROADCAST",
      message: "URGENT OARI ALERT: Heavy rainfall reported on Eastern Hararghe & Bale highland routes. All expedition 4WDs proceed with 4H/4L low-range engaged."
    });
  };

  const handleOpenRoleAuth = (targetRole?: Role) => {
    setTargetRolePrompt(targetRole || null);
    setIsRoleAuthOpen(true);
  };

  const handleRoleAuthenticated = (newRole: Role) => {
    setCurrentRole(newRole);
    localStorage.setItem("oari_user_role", newRole);
    setIsRoleAuthOpen(false);
    setTargetRolePrompt(null);

    // Auto switch to role default tab
    if (newRole === "Researcher / Employee") {
      setActiveTab("booking");
    } else if (newRole === "Immediate Director / Supervisor") {
      setActiveTab("approvals");
    } else if (newRole === "Driver") {
      setActiveTab("approvals");
    } else if (newRole === "Maintenance Tech") {
      setActiveTab("maintenance");
    }

    const cfg = ROLE_CONFIGS[newRole];
    showToast(
      "success",
      `Authenticated as ${newRole}`,
      `Mandate: ${cfg?.mandateSummary || "Standard authorization enabled"}`
    );
  };

  const safeVehicles = Array.isArray(vehicles) ? vehicles : [];
  const safeTripRequests = Array.isArray(tripRequests) ? tripRequests : [];
  const safeFuelRecords = Array.isArray(fuelRecords) ? fuelRecords : [];
  const safeMaintenanceRecords = Array.isArray(maintenanceRecords) ? maintenanceRecords : [];
  const safeSmsAlerts = Array.isArray(smsAlerts) ? smsAlerts : [];
  const safeDrivers = Array.isArray(drivers) ? drivers : [];
  const safeTravelLogs = Array.isArray(travelLogs) ? travelLogs : [];

  const pendingRequestsCount = safeTripRequests.filter(r => r.status === "Pending").length;
  const availableVehiclesCount = safeVehicles.filter(v => v.status === "Available").length;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans antialiased selection:bg-emerald-500 selection:text-white">
      {/* Toast Notification Container */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className={`p-4 rounded-xl shadow-2xl border flex items-start space-x-3 ${
            toast.type === "sms" ? "bg-slate-950 text-white border-emerald-500/80 shadow-emerald-950/50" :
            toast.type === "success" ? "bg-emerald-900 text-white border-emerald-500 shadow-emerald-950/50" :
            "bg-slate-900 text-white border-slate-700"
          }`}>
            {toast.type === "sms" ? (
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Smartphone className="w-4 h-4 animate-bounce" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            )}
            <div className="flex-1 text-xs">
              <div className="font-bold flex items-center justify-between">
                <span>{toast.title}</span>
                <button
                  onClick={() => setToast(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-slate-300 mt-0.5 leading-relaxed text-[11px]">{toast.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Header & Navigation Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentRole={currentRole}
        setCurrentRole={handleOpenRoleAuth}
        onRoleChange={(targetRole) => {
          if (targetRole === currentRole) return;
          handleOpenRoleAuth(targetRole);
        }}
        currentLanguage={currentLanguage}
        setCurrentLanguage={setCurrentLanguage}
        vehicles={safeVehicles}
        requests={safeTripRequests}
        smsAlerts={safeSmsAlerts}
        pendingRequestsCount={pendingRequestsCount}
        availableVehiclesCount={availableVehiclesCount}
        onQuickSimulateSMS={handleSendUrgentBroadcast}
        onOpenRoleAuth={handleOpenRoleAuth}
        onOpenOfficerModal={() => setIsOfficerModalOpen(true)}
        onManualSync={fetchData}
        isSyncing={isSyncing}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Top 4-Metric Overview Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Requests</span>
              <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                <Car className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-slate-800">{String(safeTripRequests.length).padStart(2, '0')}</div>
              <div className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                <span>↑ {safeTripRequests.filter(r => r.status === "Approved" || r.status === "In Progress").length} Active Field Missions</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fuel Consumption</span>
              <span className="p-1.5 bg-slate-50 text-emerald-600 rounded-lg">
                <Fuel className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-slate-800">
                {safeFuelRecords.reduce((acc, curr) => acc + curr.liters, 0).toLocaleString()} L
              </div>
              <div className="text-xs text-slate-400 font-medium mt-1">
                Across 11 Research Stations
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Approvals</span>
              <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                <Clock className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-amber-600">{String(pendingRequestsCount).padStart(2, '0')}</div>
              <div className="text-xs text-amber-700 font-medium mt-1">
                Action Required By Officer
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Scheduled Maint.</span>
              <span className="p-1.5 bg-slate-50 text-slate-700 rounded-lg">
                <Wrench className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-slate-800">
                {String(safeVehicles.filter(v => v.status === "In Maintenance").length + safeMaintenanceRecords.filter(m => m.status === "Scheduled").length).padStart(2, '0')}
              </div>
              <div className="text-xs text-slate-400 font-medium mt-1">
                Workshop & Service Queue
              </div>
            </div>
          </div>
        </section>

        {activeTab === "fleet" && (
          <FleetTracker
            vehicles={safeVehicles}
            drivers={safeDrivers}
            role={currentRole}
            onRequestVehicle={handleRequestVehicleFromFleet}
            onSelectVehicleForBooking={handleRequestVehicleFromFleet}
            onAddVehicle={handleAddVehicle}
            onEditVehicle={handleEditVehicle}
            onDeleteVehicle={handleDeleteVehicle}
            onAddDriver={handleAddDriver}
            onEditDriver={handleEditDriver}
            onDeleteDriver={handleDeleteDriver}
            onUpdateVehicleStatus={handleUpdateVehicleStatus}
            onOpenRoleAuth={handleOpenRoleAuth}
          />
        )}

        {activeTab === "booking" && (
          <BookingForm
            preselectedVehicle={preselectedVehicle}
            onSubmitRequest={handleSubmitBooking}
            onClearPreselectedVehicle={() => setPreselectedVehicle(null)}
          />
        )}

        {activeTab === "approvals" && (
          <ApprovalTravelLogs
            requests={safeTripRequests}
            vehicles={safeVehicles}
            drivers={safeDrivers}
            travelLogs={safeTravelLogs}
            officers={officers}
            role={currentRole}
            onDirectorReview={handleDirectorReview}
            onApproveRequest={handleApproveRequest}
            onRejectRequest={handleRejectRequest}
            onCompleteTrip={handleCompleteTrip}
            onViewVoucher={handleViewVoucher}
            onOpenRoleAuth={handleOpenRoleAuth}
            onOpenOfficerModal={() => setIsOfficerModalOpen(true)}
          />
        )}

        {activeTab === "sms" && (
          <SMSDispatchCenter
            smsAlerts={safeSmsAlerts}
            role={currentRole}
            onSendCustomSMS={handleSendCustomSMS}
          />
        )}

        {activeTab === "fuel" && (
          <FuelManagement
            fuelRecords={safeFuelRecords}
            vehicles={safeVehicles}
            role={currentRole}
            onAddFuelRecord={handleAddFuelRecord}
          />
        )}

        {activeTab === "maintenance" && (
          <MaintenanceHub
            maintenanceRecords={safeMaintenanceRecords}
            vehicles={safeVehicles}
            role={currentRole}
            onAddMaintenanceRecord={handleAddMaintenanceRecord}
          />
        )}
      </main>

      {/* Official Travel Voucher Modal */}
      {voucherModalRequest && (
        <TravelVoucherModal
          request={voucherModalRequest}
          travelLog={voucherModalLog}
          officers={officers}
          onClose={() => {
            setVoucherModalRequest(null);
            setVoucherModalLog(null);
          }}
        />
      )}

      {/* Institutional Officer Registry & Configuration Modal */}
      <OfficerManagementModal
        isOpen={isOfficerModalOpen}
        onClose={() => setIsOfficerModalOpen(false)}
        officers={officers}
        onRegisterOfficer={handleRegisterOfficer}
        onUpdateOfficer={handleUpdateOfficer}
        onDeleteOfficer={handleDeleteOfficer}
        onSetActiveOfficer={handleSetActiveOfficer}
        currentRole={currentRole}
        onOpenRoleAuth={handleOpenRoleAuth}
      />

      {/* Role Authentication Modal */}
      <RoleAuthModal
        isOpen={isRoleAuthOpen}
        onClose={() => {
          setIsRoleAuthOpen(false);
          setTargetRolePrompt(null);
        }}
        onAuthenticated={handleRoleAuthenticated}
        onAuthenticate={handleRoleAuthenticated}
        onOfficerPasswordUpdated={handleUpdateOfficer}
        officers={officers}
        currentRole={currentRole}
        initialTargetRole={targetRolePrompt || undefined}
        targetRolePrompt={targetRolePrompt}
      />

      {/* Footer */}
      <footer className="bg-slate-100 border-t border-slate-200 px-6 py-2.5 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2 shrink-0">
        <div>
          © 2026 Oromia Agricultural Research Institute (OARI) | Transport Logistics & Research Fleet Division
        </div>
        <div className="flex items-center gap-2 font-medium text-slate-700">
          <span className="text-slate-500">Developer:</span>
          <span className="font-semibold text-slate-800">Getachew Haile</span>
          <a href="tel:0912120269" className="text-emerald-700 hover:underline font-mono">0912120269</a>
          <span className="text-slate-400">,</span>
          <a href="mailto:boqolo@gmail.com" className="text-emerald-700 hover:underline">boqolo@gmail.com</a>
        </div>
      </footer>
    </div>
  );
}
