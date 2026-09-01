import React, { useState, useMemo } from "react";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Car, 
  User, 
  MapPin, 
  Calendar, 
  FileText, 
  MessageSquare, 
  Printer, 
  ChevronRight, 
  Filter, 
  Search, 
  ShieldCheck, 
  Sparkles, 
  AlertTriangle, 
  Send, 
  Fuel, 
  ArrowRight, 
  Eye, 
  Mail, 
  Smartphone, 
  SendHorizontal, 
  Bell, 
  Check, 
  X, 
  ExternalLink, 
  Users, 
  Compass, 
  AlertCircle, 
  Building, 
  Navigation,
  Lock,
  KeyRound,
  ShieldAlert
} from "lucide-react";
import { TripRequest, Vehicle, Driver, TravelLog, Role, NotificationChannel, TripBookingCategory, TripStatus, InstitutionalOfficer } from "../types";
import { ROLE_CONFIGS } from "../data/roles";

interface ApprovalTravelLogsProps {
  requests: TripRequest[];
  vehicles: Vehicle[];
  drivers: Driver[];
  travelLogs: TravelLog[];
  officers?: InstitutionalOfficer[];
  role: Role;
  onDirectorReview?: (requestId: string, action: "permit" | "deny", notes: string, directorName: string, channels?: NotificationChannel[]) => void;
  onApproveRequest: (requestId: string, vehicleId: string, driverId: string, approverName: string, channels?: NotificationChannel[]) => void;
  onRejectRequest: (requestId: string, reason: string, channels?: NotificationChannel[]) => void;
  onCompleteTrip: (requestId: string, endOdometer: number, notes: string) => void;
  onViewVoucher: (request: TripRequest, travelLog?: TravelLog) => void;
  onOpenRoleAuth?: (targetRole?: Role) => void;
  onOpenOfficerModal?: () => void;
}

export const ApprovalTravelLogs: React.FC<ApprovalTravelLogsProps> = ({
  requests = [],
  vehicles = [],
  drivers = [],
  travelLogs = [],
  officers = [],
  role = "Fleet Manager (Super Admin)",
  onDirectorReview,
  onApproveRequest,
  onRejectRequest,
  onCompleteTrip,
  onViewVoucher,
  onOpenRoleAuth,
  onOpenOfficerModal
}) => {
  const safeRequests = Array.isArray(requests) ? requests : [];
  const safeVehicles = Array.isArray(vehicles) ? vehicles : [];
  const safeDrivers = Array.isArray(drivers) ? drivers : [];
  const safeTravelLogs = Array.isArray(travelLogs) ? travelLogs : [];

  // Default tab based on role
  const defaultTab = role === "Immediate Director / Supervisor" ? "stage1" : role === "Researcher / Employee" ? "my_stages" : "stage2";
  const [activeSubTab, setActiveSubTab] = useState<"all_requests" | "my_stages" | "stage1" | "stage2" | "active" | "all_logs" | "rejected">(defaultTab);

  // Synchronize active tab when role changes
  React.useEffect(() => {
    const tab = role === "Immediate Director / Supervisor" ? "stage1" : role === "Researcher / Employee" ? "my_stages" : "stage2";
    setActiveSubTab(tab);
  }, [role]);

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | TripBookingCategory>("ALL");

  // Stage 1: Director Review Modal State
  const [directorReviewRequest, setDirectorReviewRequest] = useState<TripRequest | null>(null);
  const [directorAction, setDirectorAction] = useState<"permit" | "deny">("permit");
  const [directorNotes, setDirectorNotes] = useState("Permitted for agronomic field research mission across regional stations.");
  const [directorName, setDirectorName] = useState("Dr. Gemechu Keneni (Director of Crops Research)");
  const [directorChannels, setDirectorChannels] = useState<NotificationChannel[]>(["Telegram", "SMS"]);

  // Stage 2: Fleet Manager Authorization Modal State
  const [approvingRequest, setApprovingRequest] = useState<TripRequest | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [approverName, setApproverName] = useState("Eng. Wondimu Bedada (Fleet Super Admin)");
  const [selectedChannels, setSelectedChannels] = useState<NotificationChannel[]>(["Telegram", "SMS", "Email"]);
  const [previewTab, setPreviewTab] = useState<NotificationChannel>("Telegram");

  // Rejection / Denial Modal State (for Fleet Manager)
  const [rejectingRequest, setRejectingRequest] = useState<TripRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("All heavy-duty 4WD pickups currently allocated to ongoing highland seed multiplication.");
  const [rejectionChannels, setRejectionChannels] = useState<NotificationChannel[]>(["Telegram", "SMS", "Email"]);

  // Completion Modal State
  const [completingRequest, setCompletingRequest] = useState<TripRequest | null>(null);
  const [endOdometer, setEndOdometer] = useState<number>(0);
  const [completionNotes, setCompletionNotes] = useState("Mission completed without incidents. Soil & crop samples deposited safely at research lab.");

  // Categorize requests by stage
  const stage1Requests = safeRequests.filter(r => 
    r.status === "Pending Director Approval" || (r.status as string) === "Pending"
  );

  const stage2Requests = safeRequests.filter(r => 
    r.status === "Pending Fleet Manager Authorization"
  );

  const activeRequests = safeRequests.filter(r => 
    r.status === "Approved" || r.status === "In Progress"
  );

  const rejectedRequests = safeRequests.filter(r => 
    r.status === "Rejected by Director" || r.status === "Rejected by Fleet Manager" || (r.status as string) === "Rejected"
  );

  // Filter list by category and search
  const filterList = (list: TripRequest[]) => {
    return list.filter(r => {
      const matchCat = categoryFilter === "ALL" || (r.tripCategory || "Outside Town") === categoryFilter;
      const term = searchTerm.toLowerCase();
      const matchSearch = !searchTerm || 
        r.requestNumber.toLowerCase().includes(term) ||
        r.requesterName.toLowerCase().includes(term) ||
        r.destination.toLowerCase().includes(term) ||
        r.department.toLowerCase().includes(term) ||
        (r.assignedVehiclePlate && r.assignedVehiclePlate.toLowerCase().includes(term));
      return matchCat && matchSearch;
    });
  };

  // Helper: Check if vehicle is strictly Available and not assigned to an active mission
  const isVehicleAvailable = (v?: Vehicle | null, currentReqId?: string): boolean => {
    if (!v) return false;
    if (v.status !== "Available") return false;
    const isAssignedToActive = safeRequests.some(r => 
      r.id !== currentReqId && 
      r.assignedVehicleId === v.id && 
      (r.status === "Approved" || r.status === "In Progress")
    );
    return !isAssignedToActive;
  };

  // Helper: Check if driver is strictly Active/Available and not assigned to an active mission
  const isDriverAvailable = (d?: Driver | null, currentReqId?: string): boolean => {
    if (!d) return false;
    const isStatusAvail = d.status === "Active / Available";
    if (!isStatusAvail) return false;
    const isAssignedToActive = safeRequests.some(r => 
      r.id !== currentReqId && 
      r.assignedDriverId === d.id && 
      (r.status === "Approved" || r.status === "In Progress")
    );
    return !isAssignedToActive;
  };

  const toggleChannel = (channel: NotificationChannel, isDirector: boolean = false) => {
    if (isDirector) {
      setDirectorChannels(prev => 
        prev.includes(channel) ? (prev.length > 1 ? prev.filter(c => c !== channel) : prev) : [...prev, channel]
      );
    } else {
      setSelectedChannels(prev => 
        prev.includes(channel) ? (prev.length > 1 ? prev.filter(c => c !== channel) : prev) : [...prev, channel]
      );
    }
  };

  const handleOpenDirectorModal = (req: TripRequest, action: "permit" | "deny") => {
    setDirectorReviewRequest(req);
    setDirectorAction(action);
    if (action === "permit") {
      setDirectorNotes(`Endorsed and approved by Directorate for official research outreach.`);
    } else {
      setDirectorNotes("Request postponed: Requires revision of researcher passenger manifest and priority alignment.");
    }
    setDirectorChannels(["Telegram", "SMS"]);
  };

  const handleConfirmDirectorReview = () => {
    if (!directorReviewRequest) return;
    if (onDirectorReview) {
      onDirectorReview(
        directorReviewRequest.id,
        directorAction,
        directorNotes,
        directorName,
        directorChannels
      );
    }
    setDirectorReviewRequest(null);
  };

  const handleOpenApproveModal = (req: TripRequest) => {
    setApprovingRequest(req);
    setSelectedChannels(["Telegram", "SMS", "Email"]);
    setPreviewTab("Telegram");
    
    // Choose ONLY strictly available vehicles
    const availableVehs = safeVehicles.filter(v => isVehicleAvailable(v, req.id));
    const availableDrivers = safeDrivers.filter(d => isDriverAvailable(d, req.id));

    const firstAvailVeh = availableVehs[0] || null;
    const initialVehicleId = firstAvailVeh ? firstAvailVeh.id : (safeVehicles.find(v => isVehicleAvailable(v, req.id))?.id || "");
    setSelectedVehicleId(initialVehicleId);

    // Choose assigned or available driver from pool
    if (firstAvailVeh && firstAvailVeh.assignedDriverId && availableDrivers.some(d => d.id === firstAvailVeh.assignedDriverId)) {
      setSelectedDriverId(firstAvailVeh.assignedDriverId);
    } else {
      setSelectedDriverId(availableDrivers[0]?.id || "");
    }
  };

  const handleConfirmApproval = () => {
    if (!approvingRequest) return;
    
    if (!selectedVehicleId || !selectedDriverId) {
      alert("Please ensure both an available vehicle and an active certified driver are selected before dispatching.");
      return;
    }

    const selectedVeh = safeVehicles.find(v => v.id === selectedVehicleId);
    const selectedDrv = safeDrivers.find(d => d.id === selectedDriverId);

    if (!selectedVeh || !isVehicleAvailable(selectedVeh, approvingRequest.id)) {
      alert(`Allocation Denied: Vehicle ${selectedVeh?.plateNumber || selectedVehicleId} is currently "${selectedVeh?.status || 'Unavailable'}". Only vehicles that have returned and are in "Available" status can be allocated.`);
      return;
    }

    if (!selectedDrv || !isDriverAvailable(selectedDrv, approvingRequest.id)) {
      alert(`Assignment Denied: Driver ${selectedDrv?.name || selectedDriverId} is currently "${selectedDrv?.status || 'Unavailable'}". Only drivers who have returned and are "Active / Available" can be assigned.`);
      return;
    }

    if (onApproveRequest) {
      onApproveRequest(
        approvingRequest.id, 
        selectedVeh.id, 
        selectedDrv.id, 
        approverName || "Eng. Wondimu Bedada (Fleet Super Admin)", 
        selectedChannels.length > 0 ? selectedChannels : ["Telegram", "SMS"]
      );
    }
    setApprovingRequest(null);
  };

  const handleConfirmRejection = () => {
    if (!rejectingRequest) return;
    onRejectRequest(rejectingRequest.id, rejectionReason, rejectionChannels);
    setRejectingRequest(null);
  };

  const handleOpenCompleteModal = (req: TripRequest) => {
    if (role !== "Fleet Manager (Super Admin)") {
      if (onOpenRoleAuth) onOpenRoleAuth("Fleet Manager (Super Admin)");
      return;
    }
    setCompletingRequest(req);
    const vehicle = safeVehicles.find(v => v.id === req.assignedVehicleId);
    const currentOdo = vehicle ? vehicle.odometerKm : 30000;
    setEndOdometer(currentOdo + (req.estimatedKm || 150));
  };

  const handleConfirmCompletion = () => {
    if (!completingRequest) return;
    if (role !== "Fleet Manager (Super Admin)") {
      if (onOpenRoleAuth) onOpenRoleAuth("Fleet Manager (Super Admin)");
      return;
    }
    onCompleteTrip(completingRequest.id, endOdometer, completionNotes);
    setCompletingRequest(null);
  };

  const selectedVehicleObj = safeVehicles.find(v => v.id === selectedVehicleId);
  const selectedDriverObj = safeDrivers.find(d => d.id === selectedDriverId);

  return (
    <div className="space-y-6">
      {/* Top Banner with Workflow Guidance & Telegram Integration */}
      <div className="bg-gradient-to-r from-[#0c2217] via-[#122e20] to-[#1c3e2d] rounded-2xl p-5 text-white shadow-md border border-emerald-700/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-white p-1 border border-emerald-400/50 flex items-center justify-center shrink-0 shadow-md">
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
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                <span>IQQO Field Mission Approvals & Fleet Dispatch Pipeline</span>
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/30">
                2-Tier Pipeline
              </span>
            </div>
            <p className="text-xs text-emerald-200/90 max-w-3xl leading-relaxed">
              <strong>Stage 1:</strong> Immediate Directorate Director reviews & permits agricultural field mission ➔ <strong>Stage 2:</strong> Fleet Manager allocates vehicle & driver, generating official travel voucher with automated @cariqqobot Telegram & SMS alerts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onOpenOfficerModal && (
            <button
              onClick={onOpenOfficerModal}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition shadow-sm border border-amber-400/40"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Institutional Officers</span>
            </button>
          )}

          <a
            href="https://t.me/cariqqobot"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition shadow-sm border border-sky-400/40"
          >
            <SendHorizontal className="w-4 h-4" />
            <span>Open @cariqqobot on Telegram</span>
            <ExternalLink className="w-3 h-3 text-sky-200" />
          </a>
        </div>
      </div>

      {/* Role-Specific Status Banner */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2.5 rounded-lg ${
            role === "Immediate Director / Supervisor" ? "bg-amber-100 text-amber-800" :
            role === "Fleet Manager (Super Admin)" ? "bg-emerald-100 text-emerald-800" :
            role === "Driver" ? "bg-indigo-100 text-indigo-800" :
            role === "Maintenance Tech" ? "bg-slate-100 text-slate-800" :
            "bg-sky-100 text-sky-800"
          }`}>
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800">
                Active Mandate Session:
              </span>
              <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${ROLE_CONFIGS[role]?.badgeClass || "bg-slate-100 text-slate-800"}`}>
                {role}
              </span>
              <button
                onClick={() => onOpenRoleAuth ? onOpenRoleAuth() : null}
                className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold underline flex items-center gap-1 ml-1"
              >
                <KeyRound className="w-3 h-3" />
                <span>Switch Role</span>
              </button>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {role === "Immediate Director / Supervisor" && "Mandate: Stage 1 Request Review & Endorsement (Permit / Deny). Cannot allocate physical vehicles."}
              {role === "Fleet Manager (Super Admin)" && "Mandate: Exclusive authority to allocate vehicles, assign drivers, authorize Stage 2 dispatch, and manage institutional fleet."}
              {role === "Researcher / Employee" && "Mandate: Submit and monitor research mission booking requests through Director Endorsement & Fleet Dispatch."}
              {role === "Driver" && "Mandate: Execute assigned research missions, record Start/End Odometer readings, and report vehicle return status."}
              {role === "Maintenance Tech" && "Mandate: Manage workshop job cards, perform preventive maintenance, and certify vehicle roadworthiness."}
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
          <span className="text-[10px] text-slate-500 font-bold px-2 uppercase tracking-wider">Category:</span>
          <button
            onClick={() => setCategoryFilter("ALL")}
            className={`px-2.5 py-1 rounded-md font-semibold transition ${
              categoryFilter === "ALL" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            All Categories
          </button>
          <button
            onClick={() => setCategoryFilter("Inside Town")}
            className={`px-2.5 py-1 rounded-md font-semibold transition flex items-center gap-1 ${
              categoryFilter === "Inside Town" ? "bg-blue-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Building className="w-3 h-3" />
            <span>Inside Town (Addis Ababa)</span>
          </button>
          <button
            onClick={() => setCategoryFilter("Outside Town")}
            className={`px-2.5 py-1 rounded-md font-semibold transition flex items-center gap-1 ${
              categoryFilter === "Outside Town" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Navigation className="w-3 h-3" />
            <span>Outside Town</span>
          </button>
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Universal Pipeline & All Requests */}
          <button
            onClick={() => setActiveSubTab("all_requests")}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg font-bold transition ${
              activeSubTab === "all_requests"
                ? "bg-indigo-50 text-indigo-900 border border-indigo-300 shadow-xs"
                : "text-slate-600 hover:bg-slate-50 border border-transparent"
            }`}
          >
            <Building className="w-4 h-4 text-indigo-600" />
            <span>All Requests & Pipeline</span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white font-extrabold text-[10px]">
              {safeRequests.length}
            </span>
          </button>

          {/* My Approval Stages for Employees */}
          <button
            onClick={() => setActiveSubTab("my_stages")}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg font-bold transition ${
              activeSubTab === "my_stages"
                ? "bg-sky-50 text-sky-900 border border-sky-300 shadow-xs"
                : "text-slate-600 hover:bg-slate-50 border border-transparent"
            }`}
          >
            <Compass className="w-4 h-4 text-sky-600" />
            <span>My Approval Stages</span>
            {role === "Researcher / Employee" && (
              <span className="px-1.5 py-0.5 rounded-full bg-sky-600 text-white font-extrabold text-[10px]">
                Active
              </span>
            )}
          </button>

          {/* Stage 1: Director Approvals */}
          <button
            onClick={() => setActiveSubTab("stage1")}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg font-bold transition ${
              activeSubTab === "stage1"
                ? "bg-amber-50 text-amber-900 border border-amber-300 shadow-xs"
                : "text-slate-600 hover:bg-slate-50 border border-transparent"
            }`}
          >
            <Clock className="w-4 h-4 text-amber-600" />
            <span>1. Director Review</span>
            {stage1Requests.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-extrabold text-[10px]">
                {stage1Requests.length}
              </span>
            )}
          </button>

          {/* Stage 2: Fleet Manager Authorization */}
          <button
            onClick={() => setActiveSubTab("stage2")}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg font-bold transition ${
              activeSubTab === "stage2"
                ? "bg-emerald-50 text-emerald-900 border border-emerald-300 shadow-xs"
                : "text-slate-600 hover:bg-slate-50 border border-transparent"
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>2. Fleet Manager Authorization</span>
            {stage2Requests.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-extrabold text-[10px]">
                {stage2Requests.length}
              </span>
            )}
          </button>

          {/* Active Field Missions */}
          <button
            onClick={() => setActiveSubTab("active")}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg font-bold transition ${
              activeSubTab === "active"
                ? "bg-sky-50 text-sky-900 border border-sky-300 shadow-xs"
                : "text-slate-600 hover:bg-slate-50 border border-transparent"
            }`}
          >
            <Car className="w-4 h-4 text-sky-600" />
            <span>Active Missions ({activeRequests.length})</span>
          </button>

          {/* All Travel Logs & Logbook */}
          <button
            onClick={() => setActiveSubTab("all_logs")}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg font-bold transition ${
              activeSubTab === "all_logs"
                ? "bg-slate-100 text-slate-900 border border-slate-300 shadow-xs"
                : "text-slate-600 hover:bg-slate-50 border border-transparent"
            }`}
          >
            <FileText className="w-4 h-4 text-slate-600" />
            <span>Institutional Travel Logbook ({safeTravelLogs.length})</span>
          </button>

          {/* Denied Requests */}
          <button
            onClick={() => setActiveSubTab("rejected")}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg font-bold transition ${
              activeSubTab === "rejected"
                ? "bg-rose-50 text-rose-900 border border-rose-300 shadow-xs"
                : "text-slate-600 hover:bg-slate-50 border border-transparent"
            }`}
          >
            <XCircle className="w-4 h-4 text-rose-500" />
            <span>Declined Requests ({rejectedRequests.length})</span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ID, researcher, destination..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Real-Time Cross-Stage Notification Alert Banner */}
      {stage1Requests.length > 0 && activeSubTab !== "stage1" && (
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 px-4 py-2.5 rounded-xl font-medium text-xs flex items-center justify-between shadow-xs border border-amber-400">
          <div className="flex items-center space-x-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-900 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-950"></span>
            </span>
            <span className="font-bold">
              ⚡ {stage1Requests.length} New Booking Request(s) Submitted across devices awaiting Stage 1 Immediate Director Endorsement.
            </span>
          </div>
          <button
            onClick={() => setActiveSubTab("stage1")}
            className="px-3 py-1 bg-slate-950 hover:bg-slate-900 text-amber-300 font-bold rounded-lg transition text-xs shadow-xs"
          >
            Review & Endorse ({stage1Requests.length}) ➔
          </button>
        </div>
      )}

      {stage2Requests.length > 0 && activeSubTab !== "stage2" && (
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-4 py-2.5 rounded-xl font-medium text-xs flex items-center justify-between shadow-xs border border-emerald-500">
          <div className="flex items-center space-x-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
            </span>
            <span className="font-bold">
              🚗 {stage2Requests.length} Permitted Request(s) awaiting Stage 2 Fleet Manager Vehicle & Driver Allocation.
            </span>
          </div>
          <button
            onClick={() => setActiveSubTab("stage2")}
            className="px-3 py-1 bg-white hover:bg-emerald-50 text-emerald-950 font-bold rounded-lg transition text-xs shadow-xs"
          >
            Allocate & Dispatch ({stage2Requests.length}) ➔
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB: ALL REQUESTS & UNIVERSAL PIPELINE */}
      {/* ========================================================================= */}
      {activeSubTab === "all_requests" && (
        <div className="space-y-4">
          {/* Header & Pipeline Summary Banner */}
          <div className="bg-slate-900 text-white rounded-xl p-4 border border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-lg bg-indigo-600 text-white">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <span>Universal Request Pipeline & Stage Progression</span>
                  <span className="bg-indigo-700 text-indigo-100 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {filterList(safeRequests).length} Total Missions
                  </span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Synchronized across all network clients and devices in real-time. Displays all requests at every stage of the approval pipeline.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <button
                onClick={() => setActiveSubTab("stage1")}
                className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 font-semibold"
              >
                Stage 1: {stage1Requests.length}
              </button>
              <button
                onClick={() => setActiveSubTab("stage2")}
                className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 font-semibold"
              >
                Stage 2: {stage2Requests.length}
              </button>
              <button
                onClick={() => setActiveSubTab("active")}
                className="px-2.5 py-1 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 hover:bg-sky-500/30 font-semibold"
              >
                Active: {activeRequests.length}
              </button>
            </div>
          </div>

          {/* Request Cards List */}
          {filterList(safeRequests).length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
              <Car className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-slate-700">No requests found</h4>
              <p className="text-xs text-slate-500 mt-1">
                {searchTerm ? "No booking requests match your search query." : "No vehicle requests have been submitted yet."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filterList(safeRequests).map((req) => {
                const isPendingStage1 = req.status === "Pending Director Approval" || (req.status as string) === "Pending";
                const isPendingStage2 = req.status === "Pending Fleet Manager Authorization";
                const isActive = req.status === "Approved" || req.status === "In Progress";
                const isCompleted = req.status === "Completed";
                const isRejected = req.status === "Rejected by Director" || req.status === "Rejected by Fleet Manager" || (req.status as string) === "Rejected";

                return (
                  <div 
                    key={req.id}
                    className={`bg-white rounded-xl border p-4 shadow-xs hover:shadow-md transition ${
                      isPendingStage1 
                        ? "border-amber-200 bg-amber-50/20" 
                        : isPendingStage2 
                        ? "border-emerald-200 bg-emerald-50/20" 
                        : isActive 
                        ? "border-sky-200 bg-sky-50/10" 
                        : "border-slate-200"
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${
                          isPendingStage1 ? "bg-amber-100 text-amber-800" :
                          isPendingStage2 ? "bg-emerald-100 text-emerald-800" :
                          isActive ? "bg-sky-100 text-sky-800" :
                          isCompleted ? "bg-slate-100 text-slate-700" : "bg-rose-100 text-rose-800"
                        }`}>
                          <Car className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-extrabold text-sm text-slate-900">#{req.requestNumber}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isPendingStage1 ? "bg-amber-100 text-amber-900 border border-amber-300" :
                              isPendingStage2 ? "bg-emerald-100 text-emerald-900 border border-emerald-300" :
                              isActive ? "bg-sky-100 text-sky-900 border border-sky-300" :
                              isCompleted ? "bg-slate-100 text-slate-700 border border-slate-300" : "bg-rose-100 text-rose-900 border border-rose-300"
                            }`}>
                              {req.status}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-medium border border-slate-200">
                              {req.tripCategory || "Outside Town"}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Requester: <span className="font-bold text-slate-700">{req.requesterName}</span> ({req.department}) • Base: {req.stationBase}
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2">
                        {isPendingStage1 && (
                          <button
                            onClick={() => {
                              setDirectorReviewRequest(req);
                              setDirectorAction("permit");
                            }}
                            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs transition flex items-center space-x-1"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>Director Review</span>
                          </button>
                        )}

                        {isPendingStage2 && (
                          <button
                            onClick={() => setApprovingRequest(req)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center space-x-1"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Allocate & Dispatch</span>
                          </button>
                        )}

                        {isActive && (
                          <button
                            onClick={() => {
                              setCompletingRequest(req);
                              const v = safeVehicles.find(veh => veh.id === req.assignedVehicleId);
                              setEndOdometer(v ? v.odometerKm + (req.estimatedKm || 120) : 0);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition flex items-center space-x-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Audit & Complete</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            const log = safeTravelLogs.find(l => l.tripRequestId === req.id);
                            onViewVoucher(req, log);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center space-x-1 border border-slate-300"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Voucher</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-xs text-slate-600">
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Route & Station</div>
                        <div className="font-bold text-slate-900 mt-0.5">{req.origin} ➔ {req.destination}</div>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Departure & Return</div>
                        <div className="font-bold text-slate-900 mt-0.5">{req.departureDate?.split('T')[0]} to {req.returnDate?.split('T')[0]}</div>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Assigned Vehicle</div>
                        <div className="font-bold text-slate-900 mt-0.5">{req.assignedVehiclePlate || "Awaiting Allocation"}</div>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Assigned Driver</div>
                        <div className="font-bold text-slate-900 mt-0.5">{req.assignedDriverName || "Awaiting Allocation"}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 0: EMPLOYEE APPROVAL STAGES & JOURNEY TRACKER */}
      {/* ========================================================================= */}
      {activeSubTab === "my_stages" && (
        <div className="space-y-4">
          <div className="bg-sky-950 text-white rounded-xl p-4 border border-sky-800/60 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-lg bg-sky-800 text-sky-300">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <span>Researcher & Employee Request Approval Stages</span>
                  <span className="bg-sky-800 text-sky-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {filterList(safeRequests).length} Total Bookings
                  </span>
                </h3>
                <p className="text-xs text-sky-200/80 mt-0.5">
                  Track your travel requests step-by-step from Submission ➔ Director Endorsement ➔ Fleet Manager Allocation ➔ Telegram & SMS Dispatch.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="https://t.me/cariqqobot"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition shadow-xs border border-sky-400/40"
              >
                <SendHorizontal className="w-3.5 h-3.5" />
                <span>Live Telegram Updates (@cariqqobot)</span>
                <ExternalLink className="w-3 h-3 text-sky-200" />
              </a>
            </div>
          </div>

          {filterList(safeRequests).length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
              <Compass className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No Booking Requests Found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Submit a research car request from the "Book Vehicle" tab to track approval progress here.
              </p>
            </div>
          ) : (
            filterList(safeRequests).map((req) => {
              const isStage1Pending = req.status === "Pending Director Approval" || (req.status as string) === "Pending";
              const isStage2Pending = req.status === "Pending Fleet Manager Authorization";
              const isApproved = req.status === "Approved" || req.status === "In Progress";
              const isCompleted = req.status === "Completed";
              const isRejectedByDir = req.status === "Rejected by Director";
              const isRejectedByFleet = req.status === "Rejected by Fleet Manager" || (req.status as string) === "Rejected";

              // Find matched vehicle and driver dynamically
              const assignedVehicle = safeVehicles.find(v => v.id === req.assignedVehicleId || v.plateNumber === req.assignedVehiclePlate);
              const assignedDriver = safeDrivers.find(d => d.id === req.assignedDriverId || d.name === req.assignedDriverName);

              return (
                <div
                  key={req.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 text-xs space-y-4 hover:border-sky-300 transition"
                >
                  {/* Request Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-sky-950 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-200 text-xs">
                        {req.requestNumber}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                        req.tripCategory === "Inside Town" ? "bg-blue-100 text-blue-800" : "bg-emerald-100 text-emerald-800"
                      }`}>
                        {req.tripCategory}
                      </span>
                      <span className="font-bold text-slate-800 text-sm">
                        {req.origin} → {req.destination}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full font-bold text-xs ${
                        isCompleted ? "bg-emerald-100 text-emerald-800 border border-emerald-300" :
                        isApproved ? "bg-sky-100 text-sky-800 border border-sky-300" :
                        isStage2Pending ? "bg-amber-100 text-amber-800 border border-amber-300" :
                        isStage1Pending ? "bg-orange-100 text-orange-800 border border-orange-300" :
                        "bg-rose-100 text-rose-800 border border-rose-300"
                      }`}>
                        {isCompleted ? "✅ Mission Completed" :
                         isApproved ? "🚀 Authorized & Dispatched" :
                         isStage2Pending ? "⏳ Stage 2: Fleet Allocation Pending" :
                         isStage1Pending ? "⏳ Stage 1: Director Review Pending" :
                         isRejectedByDir ? "❌ Denied by Director" :
                         "❌ Denied by Fleet Manager"}
                      </span>

                      {(isApproved || isCompleted) && (
                        <button
                          onClick={() => onViewVoucher(req)}
                          className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 font-bold border border-slate-200 flex items-center gap-1.5 transition"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Voucher</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 4-Stage Visual Workflow Tracker */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                    {/* Stage 1: Request Submitted */}
                    <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Step 1: Submission</span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="font-bold text-slate-900">Request Registered</div>
                      <div className="text-[11px] text-slate-600">
                        {req.requesterName} ({req.department})
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{new Date(req.createdAt).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Stage 2: Immediate Director Review */}
                    <div className={`p-3 rounded-lg border shadow-2xs space-y-1.5 ${
                      isRejectedByDir ? "bg-rose-50 border-rose-200" :
                      isStage1Pending ? "bg-amber-50/80 border-amber-200" :
                      "bg-white border-slate-200"
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Step 2: Director Endorsement</span>
                        {isRejectedByDir ? (
                          <XCircle className="w-4 h-4 text-rose-600" />
                        ) : isStage1Pending ? (
                          <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        )}
                      </div>
                      <div className="font-bold text-slate-900">
                        {isRejectedByDir ? "Denied by Director" :
                         isStage1Pending ? "Pending Review" :
                         "Director Endorsed"}
                      </div>
                      <div className="text-[11px] text-slate-600">
                        {req.directorApprovedBy || "Awaiting Supervisor Endorsement"}
                      </div>
                      {req.directorNotes && (
                        <div className="text-[10px] text-emerald-800 italic bg-emerald-50/60 p-1.5 rounded border border-emerald-100">
                          "{req.directorNotes}"
                        </div>
                      )}
                      {req.directorRejectionReason && (
                        <div className="text-[10px] text-rose-800 italic bg-rose-50 p-1.5 rounded border border-rose-200">
                          Reason: "{req.directorRejectionReason}"
                        </div>
                      )}
                    </div>

                    {/* Stage 3: Fleet Manager Allocation */}
                    <div className={`p-3 rounded-lg border shadow-2xs space-y-1.5 ${
                      isRejectedByFleet ? "bg-rose-50 border-rose-200" :
                      isStage2Pending ? "bg-amber-50/80 border-amber-200" :
                      isApproved || isCompleted ? "bg-white border-slate-200" :
                      "bg-slate-50/60 border-slate-200 opacity-60"
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Step 3: Vehicle Allocation</span>
                        {isRejectedByFleet ? (
                          <XCircle className="w-4 h-4 text-rose-600" />
                        ) : isStage2Pending ? (
                          <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                        ) : isApproved || isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Clock className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <div className="font-bold text-slate-900">
                        {isRejectedByFleet ? "Declined by Fleet" :
                         isStage2Pending ? "Allocation in Queue" :
                         isApproved || isCompleted ? "Car & Driver Assigned" :
                         "Awaiting Stage 1"}
                      </div>
                      <div className="text-[11px] text-slate-700">
                        {assignedVehicle ? (
                          <span className="font-mono font-bold text-emerald-800">
                            {assignedVehicle.plateNumber} ({assignedVehicle.model.split(' ')[0]})
                          </span>
                        ) : (
                          req.assignedVehiclePlate || "Pending fleet assignment"
                        )}
                      </div>
                      {(assignedDriver || req.assignedDriverName) && (
                        <div className="text-[10px] text-slate-600 flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>Driver: <strong>{assignedDriver?.name || req.assignedDriverName}</strong> ({assignedDriver?.phone || req.assignedDriverPhone})</span>
                        </div>
                      )}
                    </div>

                    {/* Stage 4: Dispatch & Execution */}
                    <div className={`p-3 rounded-lg border shadow-2xs space-y-1.5 ${
                      isCompleted ? "bg-emerald-50/80 border-emerald-200" :
                      isApproved ? "bg-sky-50/80 border-sky-200" :
                      "bg-slate-50/60 border-slate-200 opacity-60"
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Step 4: Mission Execution</span>
                        {isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : isApproved ? (
                          <Car className="w-4 h-4 text-sky-600 animate-pulse" />
                        ) : (
                          <Clock className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <div className="font-bold text-slate-900">
                        {isCompleted ? "Mission Audited" :
                         isApproved ? "Active on Field" :
                         "Pending Dispatch"}
                      </div>
                      <div className="text-[11px] text-slate-600">
                        {isCompleted ? "Vehicle returned to pool" :
                         isApproved ? "Voucher & Telegram notification active" :
                         "Ready upon Stage 2 authorization"}
                      </div>
                      <div className="text-[10px] text-sky-700 font-semibold flex items-center gap-1 pt-0.5">
                        <SendHorizontal className="w-3 h-3" />
                        <span>Telegram Bot channel active</span>
                      </div>
                    </div>
                  </div>

                  {/* Trip Details Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-slate-600 bg-white pt-1">
                    <div className="flex flex-wrap items-center gap-4 text-[11px]">
                      <span><strong>Objective:</strong> {req.purpose}</span>
                      <span><strong>Passengers:</strong> {req.passengerCount} ({req.passengerNames?.join(', ') || req.requesterName})</span>
                      <span><strong>Est. Distance:</strong> {req.estimatedKm || 150} km</span>
                    </div>

                    <a
                      href="https://t.me/cariqqobot"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-700 hover:text-sky-800 font-bold flex items-center gap-1 hover:underline text-[11px]"
                    >
                      <SendHorizontal className="w-3.5 h-3.5 text-sky-500" />
                      <span>Check Alerts in Telegram (@cariqqobot)</span>
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 1: STAGE 1 - PENDING DIRECTOR REVIEW */}
      {/* ========================================================================= */}
      {activeSubTab === "stage1" && (
        <div className="space-y-4">
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-start space-x-2.5">
              <Clock className="w-4 h-4 text-amber-700 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-bold text-amber-950">Stage 1: Immediate Director / Supervisor Endorsement</div>
                <p className="text-amber-800 text-[11px] mt-0.5">
                  When an employee submits a car request, their immediate director must <strong>Permit</strong> or <strong>Deny</strong> the trip. Permitted trips are forwarded to the Fleet Manager; denied trips send an immediate Telegram/SMS notification to the employee with the justification.
                </p>
              </div>
            </div>
            {role === "Immediate Director / Supervisor" && (
              <span className="px-2.5 py-1 bg-amber-600 text-white rounded-full font-bold text-[10px] whitespace-nowrap">
                Action Required by You
              </span>
            )}
          </div>

          {filterList(stage1Requests).length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No Stage 1 Requests Pending</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                All employee car booking requests have been reviewed by directors. New requests will appear here immediately.
              </p>
            </div>
          ) : (
            filterList(stage1Requests).map((req) => (
              <div
                key={req.id}
                className="bg-white rounded-xl border border-amber-200 shadow-xs overflow-hidden text-xs space-y-0 hover:border-amber-400 transition"
              >
                {/* Header Bar */}
                <div className="bg-gradient-to-r from-amber-50 to-slate-50 p-4 border-b border-amber-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 bg-amber-200/90 px-2.5 py-0.5 rounded text-xs border border-amber-300">
                      {req.requestNumber}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                      req.tripCategory === "Inside Town" ? "bg-blue-100 text-blue-800 border border-blue-200" : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    }`}>
                      {req.tripCategory === "Inside Town" ? "Inside Town (Addis Ababa)" : "Outside Town Expedition"}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      req.urgency === "Critical / Emergency" ? "bg-rose-100 text-rose-800 border border-rose-300" :
                      req.urgency === "High" ? "bg-amber-100 text-amber-800 border border-amber-300" : "bg-slate-100 text-slate-700"
                    }`}>
                      {req.urgency} Urgency
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      Submitted: {new Date(req.createdAt).toLocaleDateString()} at {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Actions for Director vs Fleet Manager vs Requester */}
                  <div className="flex items-center space-x-2">
                    {role === "Immediate Director / Supervisor" ? (
                      <>
                        <button
                          onClick={() => handleOpenDirectorModal(req, "permit")}
                          className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs transition"
                        >
                          <Check className="w-4 h-4" />
                          <span>Director Permit & Forward</span>
                        </button>
                        <button
                          onClick={() => handleOpenDirectorModal(req, "deny")}
                          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200 font-semibold transition"
                        >
                          <X className="w-4 h-4" />
                          <span>Deny</span>
                        </button>
                      </>
                    ) : role === "Fleet Manager (Super Admin)" ? (
                      <div className="flex items-center space-x-2">
                        <div className="bg-amber-50 text-amber-900 border border-amber-300 px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-700" />
                          <span>Awaiting Director Approval</span>
                        </div>
                        {onOpenRoleAuth && (
                          <button
                            onClick={() => onOpenRoleAuth("Immediate Director / Supervisor")}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-800 border border-slate-200 text-[11px] font-bold transition flex items-center gap-1"
                            title="Switch to Immediate Director role to endorse"
                          >
                            <Lock className="w-3 h-3 text-amber-600" />
                            <span>Director Review</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-xs font-semibold flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Pending Director Endorsement</span>
                        </span>
                        {onOpenRoleAuth && (
                          <button
                            onClick={() => onOpenRoleAuth("Immediate Director / Supervisor")}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-800 border border-slate-200 text-[11px] font-bold transition flex items-center gap-1"
                            title="Stage 1 Review is mandated to Immediate Director"
                          >
                            <Lock className="w-3 h-3 text-amber-600" />
                            <span>Director Login</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 bg-white">
                  <div>
                    <div className="text-slate-400 text-[11px] font-semibold">Requester Profile</div>
                    <div className="font-bold text-slate-800 text-sm mt-0.5">{req.requesterName}</div>
                    <div className="text-slate-600">{req.requesterTitle}</div>
                    <div className="text-emerald-700 font-medium mt-0.5">{req.department}</div>
                    <div className="text-slate-500 mt-1 font-mono flex items-center gap-1.5">
                      <Smartphone className="w-3 h-3 text-slate-400" />
                      <span>{req.requesterPhone}</span>
                    </div>
                    {req.requesterTelegram && (
                      <div className="text-sky-600 font-mono text-[11px] flex items-center gap-1">
                        <SendHorizontal className="w-3 h-3" />
                        <span>{req.requesterTelegram}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="text-slate-400 text-[11px] font-semibold">Route & Research Objective</div>
                    <div className="font-semibold text-slate-800 mt-0.5 flex items-center">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 mr-1 flex-shrink-0" />
                      <span>{req.origin} → {req.destination}</span>
                    </div>
                    {req.waypoints && req.waypoints.length > 0 && (
                      <div className="text-slate-500 text-[11px] mt-0.5">
                        Waypoints: {req.waypoints.join(", ")}
                      </div>
                    )}
                    <div className="text-emerald-800 font-medium mt-1">
                      Objective: <span className="text-slate-800 font-semibold">{req.purpose}</span>
                    </div>
                    <div className="text-slate-500 mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>Dep: {new Date(req.departureDate).toLocaleDateString()} {new Date(req.departureDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-slate-400 text-[11px] font-semibold">Team & Payload</div>
                    <div className="font-medium text-slate-800 mt-0.5">
                      {req.passengerCount} Passengers ({req.passengerNames?.join(", ") || "Lead Scientist"})
                    </div>
                    <div className="text-slate-600 mt-1">
                      Cargo: <span className="font-semibold">{req.cargoWeightKg} kg</span> ({req.cargoDescription})
                    </div>
                    <div className="bg-amber-50/80 p-2.5 rounded-lg border border-amber-200/80 text-[11px] text-amber-900 mt-2 space-y-0.5">
                      <div className="font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>Awaiting Stage 1 Director Decision</span>
                      </div>
                      <p className="text-[10px] text-amber-800">Upon permit, this mission moves to Stage 2 for Fleet Manager vehicle dispatch.</p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: STAGE 2 - PENDING FLEET MANAGER AUTHORIZATION */}
      {/* ========================================================================= */}
      {activeSubTab === "stage2" && (
        <div className="space-y-4">
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-start space-x-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-bold text-emerald-950">Stage 2: Fleet Manager (Super Admin) Final Authorization & Vehicle Dispatch</div>
                <p className="text-emerald-800 text-[11px] mt-0.5">
                  These requests have received <strong>Director Endorsement</strong>. The Fleet Manager assigns an available car and qualified driver, generates the digital travel log, and triggers automated multi-channel alerts (Telegram bot @cariqqobot + SMS) to both the employee and the assigned driver.
                </p>
              </div>
            </div>
            {role === "Fleet Manager (Super Admin)" ? (
              <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-full font-bold text-[10px] whitespace-nowrap">
                Super Admin Dispatch Panel
              </span>
            ) : (
              <button
                onClick={() => onOpenRoleAuth ? onOpenRoleAuth("Fleet Manager (Super Admin)") : null}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-[11px] flex items-center gap-1.5 shadow-xs shrink-0"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Log In as Fleet Manager</span>
              </button>
            )}
          </div>

          {/* Mandate Restriction Warning if not Fleet Manager */}
          {role !== "Fleet Manager (Super Admin)" && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-950">
              <div className="flex items-start sm:items-center gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
                <span>
                  <strong>Strict Mandate Rule:</strong> Vehicle and driver allocation is restricted exclusively to the <strong>Fleet Manager</strong>. You can view the queue in read-only audit mode.
                </span>
              </div>
              <button
                onClick={() => onOpenRoleAuth ? onOpenRoleAuth("Fleet Manager (Super Admin)") : null}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shrink-0 flex items-center gap-1 self-start sm:self-auto transition shadow-xs"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Authenticate as Fleet Manager</span>
              </button>
            </div>
          )}

          {filterList(stage2Requests).length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No Stage 2 Requests Awaiting Dispatch</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                All director-endorsed missions have been allocated vehicles and dispatched.
              </p>
            </div>
          ) : (
            filterList(stage2Requests).map((req) => (
              <div
                key={req.id}
                className="bg-white rounded-xl border border-emerald-300 shadow-xs overflow-hidden text-xs space-y-0 hover:border-emerald-500 transition"
              >
                {/* Header Bar */}
                <div className="bg-gradient-to-r from-emerald-50 to-slate-50 p-4 border-b border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-emerald-900 bg-emerald-200/90 px-2.5 py-0.5 rounded text-xs border border-emerald-300">
                      {req.requestNumber}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                      req.tripCategory === "Inside Town" ? "bg-blue-100 text-blue-800 border border-blue-200" : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    }`}>
                      {req.tripCategory === "Inside Town" ? "Inside Town (Addis Ababa)" : "Outside Town Expedition"}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold text-[10px] border border-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Director Permitted</span>
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      Director: <strong>{req.directorApprovedBy || "Research Director"}</strong>
                    </span>
                  </div>

                  {/* Actions for Fleet Manager ONLY */}
                  <div className="flex items-center space-x-2">
                    {role === "Fleet Manager (Super Admin)" ? (
                      <>
                        <button
                          onClick={() => handleOpenApproveModal(req)}
                          className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs transition"
                        >
                          <Car className="w-4 h-4" />
                          <span>Allocate Vehicle & Dispatch</span>
                        </button>
                        <button
                          onClick={() => {
                            setRejectingRequest(req);
                            setRejectionReason("Currently no available 4WD vehicles matching safety requirements at base station.");
                          }}
                          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200 font-semibold transition"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Decline</span>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => onOpenRoleAuth ? onOpenRoleAuth("Fleet Manager (Super Admin)") : null}
                        className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-amber-50 hover:bg-emerald-50 text-amber-900 hover:text-emerald-800 border border-amber-300 font-bold shadow-xs transition"
                        title="Vehicle allocation is restricted to Fleet Manager only"
                      >
                        <Lock className="w-3.5 h-3.5 text-amber-700" />
                        <span>Allocate & Dispatch (Fleet Manager Mandate)</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 bg-white">
                  <div>
                    <div className="text-slate-400 text-[11px] font-semibold">Requester & Contact</div>
                    <div className="font-bold text-slate-800 text-sm mt-0.5">{req.requesterName}</div>
                    <div className="text-slate-600">{req.requesterTitle}</div>
                    <div className="text-emerald-700 font-medium mt-0.5">{req.department}</div>
                    <div className="text-slate-500 mt-1 font-mono">{req.requesterPhone}</div>
                    {req.requesterTelegram && (
                      <div className="text-sky-600 font-mono text-[11px] flex items-center gap-1">
                        <SendHorizontal className="w-3 h-3" />
                        <span>{req.requesterTelegram}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="text-slate-400 text-[11px] font-semibold">Route & Logistics</div>
                    <div className="font-semibold text-slate-800 mt-0.5 flex items-center">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 mr-1 flex-shrink-0" />
                      <span>{req.origin} → {req.destination}</span>
                    </div>
                    {req.waypoints && req.waypoints.length > 0 && (
                      <div className="text-slate-500 text-[11px] mt-0.5">
                        Stops: {req.waypoints.join(", ")}
                      </div>
                    )}
                    <div className="text-emerald-800 font-medium mt-1">
                      Purpose: <span className="text-slate-800 font-semibold">{req.purpose}</span>
                    </div>
                    <div className="text-slate-500 mt-1">
                      Dep: {new Date(req.departureDate).toLocaleDateString()} {new Date(req.departureDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  <div>
                    <div className="text-slate-400 text-[11px] font-semibold">Director Endorsement Details</div>
                    <div className="bg-emerald-50/80 p-2.5 rounded-lg border border-emerald-200 text-emerald-950 text-xs mt-1 space-y-1">
                      <div className="font-semibold flex items-center gap-1 text-emerald-800">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Director: {req.directorApprovedBy || "Directorate Head"}</span>
                      </div>
                      <div className="text-[11px] text-slate-700 italic">
                        "{req.directorNotes || "Approved for field research."}"
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Date: {req.directorApprovedAt ? new Date(req.directorApprovedAt).toLocaleString() : "Recently approved"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: ACTIVE FIELD MISSIONS */}
      {/* ========================================================================= */}
      {activeSubTab === "active" && (
        <div className="space-y-4">
          {filterList(activeRequests).length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
              <Car className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700">No Active Missions in Progress</h3>
              <p className="text-xs text-slate-500 mt-1">
                Approved vehicles and drivers currently on the road will appear here with live trip manifests.
              </p>
            </div>
          ) : (
            filterList(activeRequests).map((req) => {
              const matchedLog = safeTravelLogs.find(l => l.tripRequestId === req.id);
              return (
                <div
                  key={req.id}
                  className="bg-white rounded-xl border border-sky-200 shadow-xs p-4 text-xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 bg-sky-100 text-sky-900 px-2 py-0.5 rounded border border-sky-300">
                        {req.requestNumber}
                      </span>
                      <span className="font-bold text-slate-800 text-sm">
                        {req.origin} → {req.destination}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                        req.tripCategory === "Inside Town" ? "bg-blue-100 text-blue-800" : "bg-emerald-100 text-emerald-800"
                      }`}>
                        {req.tripCategory === "Inside Town" ? "Inside Town (Addis Ababa)" : "Outside Town"}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                        <span>● Mission Active</span>
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onViewVoucher(req, matchedLog)}
                        className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Official Travel Voucher</span>
                      </button>
                      {role === "Fleet Manager (Super Admin)" ? (
                        <button
                          onClick={() => handleOpenCompleteModal(req)}
                          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs transition"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Complete Mission & Audit</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onOpenRoleAuth ? onOpenRoleAuth("Fleet Manager (Super Admin)") : null}
                          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold shadow-xs transition"
                          title="Mission completion and odometer audit is restricted exclusively to Fleet Manager"
                        >
                          <Lock className="w-3.5 h-3.5 text-amber-700" />
                          <span>Complete Mission (Fleet Manager Mandate)</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div>
                      <div className="text-slate-400 text-[11px] font-semibold">Assigned Vehicle</div>
                      <div className="font-bold text-slate-900 text-sm font-mono mt-0.5">
                        {req.assignedVehiclePlate || "4-11892 ET"}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-[11px] font-semibold">Assigned Driver</div>
                      <div className="font-bold text-slate-800 mt-0.5">
                        {req.assignedDriverName || "Chala Merga"}
                      </div>
                      <div className="text-slate-500 text-[11px]">{req.assignedDriverPhone}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-[11px] font-semibold">Lead Researcher</div>
                      <div className="font-bold text-slate-800 mt-0.5">{req.requesterName}</div>
                      <div className="text-slate-500 text-[11px]">{req.requesterPhone}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-[11px] font-semibold">Approval Authority</div>
                      <div className="text-emerald-700 font-semibold mt-0.5">Director: {req.directorApprovedBy || "Endorsed"}</div>
                      <div className="text-slate-600 text-[11px]">Fleet Mgr: {req.approvedBy || "Authorized"}</div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: INSTITUTIONAL TRAVEL LOGBOOK */}
      {/* ========================================================================= */}
      {activeSubTab === "all_logs" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Official Institutional Travel Logbook & Manifest Register</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Archival repository of all authorized OARI research missions and vehicle movements.
              </p>
            </div>
            <div className="text-xs text-slate-500">
              Total Recorded Logs: <span className="font-bold text-slate-800">{safeTravelLogs.length}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Log No.</th>
                  <th className="py-3 px-4">Vehicle Plate</th>
                  <th className="py-3 px-4">Driver</th>
                  <th className="py-3 px-4">Requester</th>
                  <th className="py-3 px-4">Route & Purpose</th>
                  <th className="py-3 px-4">Odometer</th>
                  <th className="py-3 px-4">Distance</th>
                  <th className="py-3 px-4">Fuel Issued</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {safeTravelLogs.map((log) => {
                  const matchedDriver = safeDrivers.find(d => d.id === log.driverId || d.name.toLowerCase() === log.driverName.toLowerCase());
                  const matchedVehicle = safeVehicles.find(v => v.id === log.vehicleId || v.plateNumber.toLowerCase() === log.vehiclePlate.toLowerCase());
                  const liveDriverName = matchedDriver ? matchedDriver.name : (matchedVehicle?.assignedDriverName || log.driverName);
                  const liveDriverPhone = matchedDriver ? matchedDriver.phone : (matchedVehicle?.driverPhone || "");
                  const livePlate = matchedVehicle ? matchedVehicle.plateNumber : log.vehiclePlate;

                  const matchedReq = safeRequests.find(r => r.id === log.tripRequestId) || {
                    id: log.tripRequestId,
                    requestNumber: "OARI-REQ-ARCHIVE",
                    requesterName: log.requesterName,
                    requesterTitle: "Senior Researcher",
                    department: "OARI Research Directorate",
                    requesterPhone: "+251 911 000 000",
                    requesterEmail: "researcher@oari.gov.et",
                    stationBase: "OARI Station",
                    tripCategory: "Outside Town" as TripBookingCategory,
                    origin: log.origin,
                    destination: log.destination,
                    departureDate: log.startTime,
                    returnDate: log.endTime || log.startTime,
                    purpose: log.purpose as any,
                    passengerCount: 3,
                    passengerNames: [log.requesterName],
                    cargoDescription: "Field Research Samples",
                    cargoWeightKg: 100,
                    urgency: "Normal" as any,
                    status: log.status === "Completed" ? "Completed" : "Approved" as any,
                    assignedVehiclePlate: livePlate,
                    assignedDriverName: liveDriverName,
                    createdAt: log.startTime,
                    estimatedKm: log.totalDistanceKm || 200,
                    estimatedFuelLiters: log.fuelIssuedLiters
                  };

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {log.logNumber}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-emerald-800">
                        {livePlate}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{liveDriverName}</div>
                        {liveDriverPhone && (
                          <div className="text-[10px] text-slate-500 font-mono">{liveDriverPhone}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {log.requesterName}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{log.origin} → {log.destination}</div>
                        <div className="text-slate-500 text-[11px]">{log.purpose}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {log.startOdometerKm.toLocaleString()} {log.endOdometerKm ? `→ ${log.endOdometerKm.toLocaleString()}` : ''}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {log.totalDistanceKm ? `${log.totalDistanceKm} km` : `${log.startOdometerKm ? 'In progress' : '-'}`}
                      </td>
                      <td className="py-3 px-4 font-mono text-emerald-700 font-semibold">
                        {log.fuelIssuedLiters} L <span className="text-[10px] text-slate-500 font-normal">({log.fuelCostEtb} ETB)</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                          log.status === "Completed" ? "bg-emerald-100 text-emerald-800" : "bg-sky-100 text-sky-800"
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onViewVoucher(matchedReq as TripRequest, log)}
                            className="px-2.5 py-1 rounded bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 font-semibold text-[11px] inline-flex items-center gap-1 transition"
                            title="View Official Travel Voucher & Manifest"
                          >
                            <Printer className="w-3 h-3" />
                            <span>Voucher</span>
                          </button>
                          <a
                            href="https://t.me/cariqqobot"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded bg-sky-50 hover:bg-sky-100 text-sky-700 text-[11px] transition"
                            title="Telegram Bot Updates (@cariqqobot)"
                          >
                            <SendHorizontal className="w-3 h-3" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 5: REJECTED / DECLINED REQUESTS WITH FEEDBACK */}
      {/* ========================================================================= */}
      {activeSubTab === "rejected" && (
        <div className="space-y-4">
          {filterList(rejectedRequests).length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
              <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No Declined Requests</h3>
              <p className="text-xs text-slate-500 mt-1">
                Requests denied with reasons by Directors or the Fleet Manager will be archived here.
              </p>
            </div>
          ) : (
            filterList(rejectedRequests).map((req) => (
              <div
                key={req.id}
                className="bg-white rounded-xl border border-rose-200 shadow-xs p-4 text-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-rose-900 bg-rose-100 px-2 py-0.5 rounded border border-rose-300">
                      {req.requestNumber}
                    </span>
                    <span className="font-semibold text-slate-800">
                      {req.origin} → {req.destination}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px]">
                      {req.status === "Rejected by Director" ? "Denied by Director" : "Denied by Fleet Manager"}
                    </span>
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Requester: <strong>{req.requesterName}</strong> ({req.department})
                  </div>
                </div>

                <div className="bg-rose-50/80 p-3 rounded-lg border border-rose-200 text-rose-950 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-rose-900">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>Official Reason for Denial Forwarded to Employee:</span>
                  </div>
                  <p className="text-slate-800 font-medium">
                    "{req.directorRejectionReason || req.fleetManagerRejectionReason || req.rejectionReason || "Mission requirements could not be accommodated at this time."}"
                  </p>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Delivered via Telegram bot (@cariqqobot) and SMS to {req.requesterPhone}.
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: STAGE 1 DIRECTOR REVIEW (PERMIT / DENY) */}
      {/* ========================================================================= */}
      {directorReviewRequest && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  {directorAction === "permit" ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-600" />
                  )}
                  <span>Director Review: {directorReviewRequest.requestNumber}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {directorAction === "permit" ? "Permit request and forward to Fleet Manager for vehicle allocation." : "Deny request and send explanation reason to employee."}
                </p>
              </div>
              <button
                onClick={() => setDirectorReviewRequest(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Request Summary */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Employee:</span>
                <span className="font-bold text-slate-800">{directorReviewRequest.requesterName} ({directorReviewRequest.department})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Route & Category:</span>
                <span className="font-semibold text-slate-800">{directorReviewRequest.origin} → {directorReviewRequest.destination} ({directorReviewRequest.tripCategory})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Objective:</span>
                <span className="font-medium text-emerald-800">{directorReviewRequest.purpose}</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700">Designated Reviewing Director / Supervisor *</label>
                  {onOpenOfficerModal && (
                    <button
                      type="button"
                      onClick={onOpenOfficerModal}
                      className="text-[11px] text-amber-700 hover:text-amber-800 font-semibold underline"
                    >
                      + Register / Update Officers
                    </button>
                  )}
                </div>
                {officers.filter(o => o.roleType === "Director" || o.roleType === "Supervisor").length > 0 && (
                  <select
                    onChange={(e) => {
                      if (e.target.value) setDirectorName(e.target.value);
                    }}
                    className="w-full mb-1.5 p-2 bg-amber-50/60 border border-amber-200 rounded-lg text-slate-800 font-medium text-xs focus:ring-2 focus:ring-amber-500"
                    defaultValue=""
                  >
                    <option value="" disabled>-- Quick Select Registered Director / Supervisor --</option>
                    {officers
                      .filter(o => o.roleType === "Director" || o.roleType === "Supervisor")
                      .map(o => (
                        <option key={o.id} value={`${o.fullName} (${o.officialTitle})`}>
                          {o.fullName} — {o.officialTitle} [{o.department}] {o.isPrimaryForRole ? "★ Active" : ""}
                        </option>
                      ))}
                  </select>
                )}
                <input
                  type="text"
                  value={directorName}
                  onChange={(e) => setDirectorName(e.target.value)}
                  placeholder="e.g. Dr. Gemechu Keneni (Director of Crops Research)"
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {directorAction === "permit" ? "Director Endorsement Notes / Justification *" : "Official Rejection Reason (Sent to Employee) *"}
                </label>
                <textarea
                  rows={3}
                  value={directorNotes}
                  onChange={(e) => setDirectorNotes(e.target.value)}
                  className={`w-full p-2.5 border rounded-lg focus:ring-2 ${
                    directorAction === "permit" ? "border-slate-200 focus:ring-emerald-500" : "border-rose-300 focus:ring-rose-500"
                  }`}
                />
              </div>

              {/* Notification Channel selector */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 block text-xs">Dispatch Decision Alerts Via:</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => toggleChannel("Telegram", true)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold ${
                      directorChannels.includes("Telegram") ? "bg-sky-600 text-white border-sky-600" : "bg-white text-slate-600 border-slate-200"
                    }`}
                  >
                    <SendHorizontal className="w-3.5 h-3.5" />
                    <span>Telegram Bot (@cariqqobot)</span>
                    {directorChannels.includes("Telegram") && <Check className="w-3 h-3 ml-1" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleChannel("SMS", true)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold ${
                      directorChannels.includes("SMS") ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-600 border-slate-200"
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>SMS Alert</span>
                    {directorChannels.includes("SMS") && <Check className="w-3 h-3 ml-1" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDirectorReviewRequest(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDirectorReview}
                className={`px-5 py-2 rounded-lg text-white font-bold text-xs shadow-md flex items-center space-x-1.5 ${
                  directorAction === "permit" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {directorAction === "permit" ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Permit & Forward to Fleet Manager</span>
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4" />
                    <span>Deny & Notify Employee</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: STAGE 2 FLEET MANAGER AUTHORIZATION & DISPATCH */}
      {/* ========================================================================= */}
      {approvingRequest && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span>Stage 2: Fleet Authorization for {approvingRequest.requestNumber}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Allocate vehicle and qualified driver, generate travel log, and trigger instant Telegram (@cariqqobot) & SMS notifications.
                </p>
              </div>
              <button
                onClick={() => setApprovingRequest(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Request Summary Box */}
            <div className="bg-emerald-50/60 p-3 rounded-lg border border-emerald-100 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Requester:</span>
                <span className="font-bold text-slate-800">{approvingRequest.requesterName} ({approvingRequest.requesterPhone})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Route & Category:</span>
                <span className="font-semibold text-slate-800">{approvingRequest.origin} → {approvingRequest.destination} ({approvingRequest.tripCategory})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Director Endorsement:</span>
                <span className="font-semibold text-emerald-800">Permitted by {approvingRequest.directorApprovedBy || "Director"}</span>
              </div>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* VEHICLE SELECTION WITH STRICT AVAILABILITY */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-700">Select Available Vehicle *</label>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      safeVehicles.filter(v => isVehicleAvailable(v, approvingRequest.id)).length > 0
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-100 text-rose-800"
                    }`}>
                      {safeVehicles.filter(v => isVehicleAvailable(v, approvingRequest.id)).length} Available in Pool
                    </span>
                  </div>
                  <select
                    value={selectedVehicleId}
                    onChange={(e) => {
                      setSelectedVehicleId(e.target.value);
                      const veh = safeVehicles.find(v => v.id === e.target.value);
                      if (veh && veh.assignedDriverId) {
                        const d = safeDrivers.find(drv => drv.id === veh.assignedDriverId);
                        if (d && isDriverAvailable(d, approvingRequest.id)) {
                          setSelectedDriverId(veh.assignedDriverId);
                        }
                      }
                    }}
                    className={`w-full p-2.5 border rounded-lg focus:ring-2 bg-white font-medium text-xs ${
                      !isVehicleAvailable(selectedVehicleObj, approvingRequest.id) && selectedVehicleId
                        ? "border-rose-300 focus:ring-rose-500 bg-rose-50/30 text-rose-900"
                        : "border-slate-200 focus:ring-emerald-500 text-slate-800"
                    }`}
                  >
                    <option value="" disabled>-- Select Available Vehicle --</option>
                    {safeVehicles.map((v) => {
                      const isAvail = isVehicleAvailable(v, approvingRequest.id);
                      return (
                        <option 
                          key={v.id} 
                          value={v.id} 
                          disabled={!isAvail} 
                          className={!isAvail ? "text-slate-400 bg-slate-100" : "text-slate-900 font-semibold"}
                        >
                          {isAvail ? "🟢 " : "🔴 "}
                          {v.plateNumber} - {v.model} ({v.type}) [{isAvail ? "Available / Ready" : (v.status === "On Mission" ? "On Mission / In Field" : v.status)}]
                          {!isAvail ? " (Unavailable)" : ""}
                        </option>
                      );
                    })}
                  </select>

                  {/* Vehicle Status Feedback Badge */}
                  {selectedVehicleObj ? (
                    <div className={`mt-1.5 p-2 rounded-lg border text-[11px] flex items-center justify-between ${
                      isVehicleAvailable(selectedVehicleObj, approvingRequest.id)
                        ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                        : "bg-rose-50 border-rose-200 text-rose-800"
                    }`}>
                      <span className="flex items-center gap-1.5">
                        <Car className="w-3.5 h-3.5 shrink-0" />
                        <span>{selectedVehicleObj.stationBase} • Odo: {selectedVehicleObj.odometerKm.toLocaleString()} km • Tank: {selectedVehicleObj.currentFuelLevel}L</span>
                      </span>
                      <span className="font-extrabold flex items-center gap-1">
                        {isVehicleAvailable(selectedVehicleObj, approvingRequest.id) ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Ready for Mission</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-rose-600" />
                            <span>On Mission / Unavailable</span>
                          </>
                        )}
                      </span>
                    </div>
                  ) : (
                    <div className="mt-1.5 p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Please select an available vehicle from the pool.</span>
                    </div>
                  )}
                </div>

                {/* DRIVER SELECTION WITH STRICT AVAILABILITY */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-700">Assign Certified OARI Driver *</label>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      safeDrivers.filter(d => isDriverAvailable(d, approvingRequest.id)).length > 0
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-100 text-rose-800"
                    }`}>
                      {safeDrivers.filter(d => isDriverAvailable(d, approvingRequest.id)).length} Active / Available
                    </span>
                  </div>
                  <select
                    value={selectedDriverId}
                    onChange={(e) => setSelectedDriverId(e.target.value)}
                    className={`w-full p-2.5 border rounded-lg focus:ring-2 bg-white font-medium text-xs ${
                      !isDriverAvailable(selectedDriverObj, approvingRequest.id) && selectedDriverId
                        ? "border-rose-300 focus:ring-rose-500 bg-rose-50/30 text-rose-900"
                        : "border-slate-200 focus:ring-emerald-500 text-slate-800"
                    }`}
                  >
                    <option value="" disabled>-- Select Certified Driver --</option>
                    {safeDrivers.map((d) => {
                      const isAvail = isDriverAvailable(d, approvingRequest.id);
                      return (
                        <option 
                          key={d.id} 
                          value={d.id} 
                          disabled={!isAvail} 
                          className={!isAvail ? "text-slate-400 bg-slate-100" : "text-slate-900 font-semibold"}
                        >
                          {isAvail ? "🟢 " : "🔴 "}
                          {d.name} ({d.phone}) [{isAvail ? "Active / Ready" : d.status}]
                          {!isAvail ? " (Unavailable)" : ""}
                        </option>
                      );
                    })}
                  </select>

                  {/* Driver Status Feedback Badge */}
                  {selectedDriverObj ? (
                    <div className={`mt-1.5 p-2 rounded-lg border text-[11px] flex items-center justify-between ${
                      isDriverAvailable(selectedDriverObj, approvingRequest.id)
                        ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                        : "bg-rose-50 border-rose-200 text-rose-800"
                    }`}>
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 shrink-0" />
                        <span>{selectedDriverObj.stationBase} • Lic: {selectedDriverObj.licenseNumber} • Rating: ⭐{selectedDriverObj.rating || 4.8}</span>
                      </span>
                      <span className="font-extrabold flex items-center gap-1">
                        {isDriverAvailable(selectedDriverObj, approvingRequest.id) ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Ready for Assignment</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-rose-600" />
                            <span>On Trip / Unavailable</span>
                          </>
                        )}
                      </span>
                    </div>
                  ) : (
                    <div className="mt-1.5 p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Please select an active certified driver.</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700">Authorizing Fleet Logistics Manager *</label>
                  {onOpenOfficerModal && (
                    <button
                      type="button"
                      onClick={onOpenOfficerModal}
                      className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold underline"
                    >
                      + Register / Update Officers
                    </button>
                  )}
                </div>
                {officers.filter(o => o.roleType === "Fleet Manager").length > 0 && (
                  <select
                    onChange={(e) => {
                      if (e.target.value) setApproverName(e.target.value);
                    }}
                    className="w-full mb-1.5 p-2 bg-emerald-50/60 border border-emerald-200 rounded-lg text-slate-800 font-medium text-xs focus:ring-2 focus:ring-emerald-500"
                    defaultValue=""
                  >
                    <option value="" disabled>-- Quick Select Registered Fleet Manager --</option>
                    {officers
                      .filter(o => o.roleType === "Fleet Manager")
                      .map(o => (
                        <option key={o.id} value={`${o.fullName} (${o.officialTitle})`}>
                          {o.fullName} — {o.officialTitle} [{o.stationOrCenter || "OARI Depot"}] {o.isPrimaryForRole ? "★ Active" : ""}
                        </option>
                      ))}
                  </select>
                )}
                <input
                  type="text"
                  value={approverName}
                  onChange={(e) => setApproverName(e.target.value)}
                  placeholder="e.g. Eng. Wondimu Bedada (Fleet Super Admin)"
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium text-xs"
                />
              </div>

              {/* Notification Channels Multi-Select */}
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                    <Bell className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Select Dispatch Alert Channels</span>
                  </span>
                  <span className="text-[10px] text-slate-500">Sent to employee AND assigned driver</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {/* Telegram Toggle */}
                  <button
                    type="button"
                    onClick={() => toggleChannel("Telegram")}
                    className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border text-xs font-semibold transition ${
                      selectedChannels.includes("Telegram")
                        ? "bg-sky-600 text-white border-sky-600 shadow-xs"
                        : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <SendHorizontal className="w-3.5 h-3.5" />
                    <span>Telegram Bot (@cariqqobot)</span>
                    {selectedChannels.includes("Telegram") && <Check className="w-3 h-3 ml-0.5" />}
                  </button>

                  {/* SMS Toggle */}
                  <button
                    type="button"
                    onClick={() => toggleChannel("SMS")}
                    className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border text-xs font-semibold transition ${
                      selectedChannels.includes("SMS")
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                        : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>SMS Gateway</span>
                    {selectedChannels.includes("SMS") && <Check className="w-3 h-3 ml-0.5" />}
                  </button>

                  {/* Email Toggle */}
                  <button
                    type="button"
                    onClick={() => toggleChannel("Email")}
                    className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border text-xs font-semibold transition ${
                      selectedChannels.includes("Email")
                        ? "bg-violet-600 text-white border-violet-600 shadow-xs"
                        : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email Notice</span>
                    {selectedChannels.includes("Email") && <Check className="w-3 h-3 ml-0.5" />}
                  </button>
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="bg-slate-900 text-white p-3.5 rounded-lg border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-bold text-slate-300">Live Dispatch Preview:</span>
                    <div className="flex space-x-1">
                      {selectedChannels.includes("Telegram") && (
                        <button
                          type="button"
                          onClick={() => setPreviewTab("Telegram")}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                            previewTab === "Telegram" ? "bg-sky-500 text-slate-950" : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          Telegram
                        </button>
                      )}
                      {selectedChannels.includes("SMS") && (
                        <button
                          type="button"
                          onClick={() => setPreviewTab("SMS")}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                            previewTab === "SMS" ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          SMS
                        </button>
                      )}
                      {selectedChannels.includes("Email") && (
                        <button
                          type="button"
                          onClick={() => setPreviewTab("Email")}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                            previewTab === "Email" ? "bg-violet-400 text-slate-950" : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          Email
                        </button>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] text-sky-400 font-mono">Bot: @cariqqobot</span>
                </div>

                {previewTab === "Telegram" && selectedChannels.includes("Telegram") && (
                  <div className="bg-slate-950 p-2.5 rounded border border-sky-900/40 text-[11px] font-mono space-y-1.5">
                    <div className="text-sky-400 font-bold flex items-center gap-1">
                      <SendHorizontal className="w-3 h-3" />
                      <span>Telegram Direct Alert (@cariqqobot):</span>
                    </div>
                    <div className="text-slate-300 leading-relaxed bg-slate-900/80 p-2 rounded border border-slate-800 space-y-1">
                      <div><strong className="text-emerald-400">🚀 OARI MISSION DISPATCH AUTHORIZATION</strong></div>
                      <div>🆔 <strong>Trip ID:</strong> #{approvingRequest.requestNumber}</div>
                      <div>📂 <strong>Category:</strong> {approvingRequest.tripCategory}</div>
                      <div>📍 <strong>Route:</strong> {approvingRequest.origin} ➔ {approvingRequest.destination}</div>
                      <div>🚘 <strong>Car:</strong> {selectedVehicleObj?.plateNumber} ({selectedVehicleObj?.model})</div>
                      <div>👤 <strong>Assigned Driver:</strong> {selectedDriverObj?.name} (📞 {selectedDriverObj?.phone})</div>
                      <div>👨‍🔬 <strong>Lead Requester:</strong> {approvingRequest.requesterName} (📞 {approvingRequest.requesterPhone})</div>
                      <div>🛡️ <strong>Director Approved:</strong> {approvingRequest.directorApprovedBy || "Yes"}</div>
                      <div>✍️ <strong>Fleet Manager:</strong> {approverName}</div>
                    </div>
                  </div>
                )}

                {previewTab === "SMS" && selectedChannels.includes("SMS") && (
                  <div className="space-y-2 text-[11px] font-mono">
                    <div className="bg-slate-950 p-2 rounded border border-slate-800/80">
                      <div className="text-emerald-400 font-bold">SMS to Requester ({approvingRequest.requesterPhone}):</div>
                      <div className="text-slate-300 mt-0.5">
                        "[OARI FLEET] Trip #{approvingRequest.requestNumber} to {approvingRequest.destination} is APPROVED. Driver: {selectedDriverObj?.name} ({selectedDriverObj?.phone}). Car: {selectedVehicleObj?.plateNumber}. Have a safe mission!"
                      </div>
                    </div>
                    <div className="bg-slate-950 p-2 rounded border border-slate-800/80">
                      <div className="text-amber-400 font-bold">SMS to Driver ({selectedDriverObj?.phone}):</div>
                      <div className="text-slate-300 mt-0.5">
                        "[OARI DISPATCH] Assigned Mission #{approvingRequest.requestNumber}. Requester: {approvingRequest.requesterName} ({approvingRequest.requesterPhone}). Route: {approvingRequest.origin} → {approvingRequest.destination}. Car: {selectedVehicleObj?.plateNumber}."
                      </div>
                    </div>
                  </div>
                )}

                {previewTab === "Email" && selectedChannels.includes("Email") && (
                  <div className="bg-slate-950 p-2.5 rounded border border-violet-900/40 text-[11px] space-y-1">
                    <div className="text-violet-400 font-bold font-mono">Email to: {approvingRequest.requesterEmail || "employee@oari.gov.et"}</div>
                    <div className="text-slate-300">
                      Subject: Official OARI Vehicle Allocation & Dispatch #{approvingRequest.requestNumber}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setApprovingRequest(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-xs"
              >
                Cancel
              </button>
              {(() => {
                const isVehValid = isVehicleAvailable(selectedVehicleObj, approvingRequest.id);
                const isDrvValid = isDriverAvailable(selectedDriverObj, approvingRequest.id);
                const canDispatch = isVehValid && isDrvValid && Boolean(selectedVehicleId) && Boolean(selectedDriverId);

                return (
                  <button
                    type="button"
                    onClick={handleConfirmApproval}
                    disabled={!canDispatch}
                    className={`px-5 py-2 rounded-lg font-bold text-xs shadow-md flex items-center space-x-1.5 transition ${
                      canDispatch
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                        : "bg-slate-300 text-slate-500 cursor-not-allowed border border-slate-300 shadow-none"
                    }`}
                    title={
                      !canDispatch
                        ? "Cannot Dispatch: Both vehicle and driver must be 'Available' (not on trip / on mission) before being allocated."
                        : `Authorize and send dispatches via ${selectedChannels.join(", ")}`
                    }
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Authorize & Dispatch ({selectedChannels.join(", ")})</span>
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: FLEET MANAGER REJECTION */}
      {/* ========================================================================= */}
      {rejectingRequest && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-600" />
                <span>Decline Trip Request: {rejectingRequest.requestNumber}</span>
              </h3>
              <button
                onClick={() => setRejectingRequest(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>
            
            <p className="text-xs text-slate-500">
              Official rejection notification with reason will be sent to {rejectingRequest.requesterName} ({rejectingRequest.requesterPhone}) via Telegram bot and SMS.
            </p>

            <div className="space-y-2 text-xs">
              <label className="block font-semibold text-slate-700">Official Reason for Denial *</label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 text-slate-800"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRejectingRequest(null)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRejection}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs"
              >
                Decline & Transmit Reason
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: COMPLETE MISSION AUDIT */}
      {/* ========================================================================= */}
      {completingRequest && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Complete Trip Audit: {completingRequest.requestNumber}</span>
            </h3>
            <p className="text-xs text-slate-500">
              Record final odometer reading and return vehicle to the available pool.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Final Return Odometer (km) *</label>
                <input
                  type="number"
                  value={endOdometer}
                  onChange={(e) => setEndOdometer(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mission Debrief & Notes</label>
                <textarea
                  rows={2}
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCompletingRequest(null)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCompletion}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
              >
                Complete & Release Vehicle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
