import React, { useState, useEffect } from "react";
import { 
  Truck, 
  Car, 
  CheckCircle2, 
  AlertTriangle, 
  Radio, 
  MessageSquare, 
  Fuel, 
  Wrench, 
  FileText, 
  Sparkles, 
  Globe, 
  UserCheck, 
  Clock, 
  Send,
  Plus,
  Lock,
  KeyRound,
  ShieldCheck,
  RefreshCw
} from "lucide-react";
import { Role, Language, Vehicle, TripRequest, SMSAlert } from "../types";
import { TRANSLATIONS } from "../data/mockData";
import { ROLE_CONFIGS, ROLE_LIST } from "../data/roles";

export interface HeaderProps {
  currentTab?: string;
  activeTab?: string;
  setCurrentTab?: (tab: string) => void;
  setActiveTab?: (tab: string) => void;
  role?: Role;
  currentRole?: Role;
  setRole?: (role: Role) => void;
  setCurrentRole?: (role: Role) => void;
  onRoleChange?: (role: Role) => void;
  language?: Language;
  currentLanguage?: Language;
  setLanguage?: (lang: Language) => void;
  setCurrentLanguage?: (lang: Language) => void;
  vehicles?: Vehicle[];
  requests?: TripRequest[];
  smsAlerts?: SMSAlert[];
  pendingRequestsCount?: number;
  availableVehiclesCount?: number;
  onQuickSimulateSMS?: () => void;
  onOpenRoleAuth?: (targetRole?: Role) => void;
  onOpenOfficerModal?: () => void;
  onManualSync?: () => void;
  isSyncing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  activeTab,
  setCurrentTab,
  setActiveTab,
  role,
  currentRole,
  setRole,
  setCurrentRole,
  onRoleChange,
  language,
  currentLanguage,
  setLanguage,
  setCurrentLanguage,
  vehicles = [],
  requests = [],
  smsAlerts = [],
  pendingRequestsCount,
  availableVehiclesCount,
  onQuickSimulateSMS,
  onOpenRoleAuth,
  onOpenOfficerModal,
  onManualSync,
  isSyncing = false
}) => {
  const [time, setTime] = useState(new Date());

  const selectedTab = activeTab || currentTab || "booking";
  const handleTabChange = (tab: string) => {
    if (setActiveTab) setActiveTab(tab);
    if (setCurrentTab) setCurrentTab(tab);
  };

  const selectedRole = currentRole || role || "Researcher / Employee";
  const handleRoleSelect = (r: Role) => {
    if (r === selectedRole) return;
    if (onOpenRoleAuth) {
      onOpenRoleAuth(r);
    } else if (onRoleChange) {
      onRoleChange(r);
    } else if (setCurrentRole) {
      setCurrentRole(r);
    } else if (setRole) {
      setRole(r);
    }
  };

  const selectedLanguage = currentLanguage || language || "English";
  const handleLanguageChange = (l: Language) => {
    if (setCurrentLanguage) setCurrentLanguage(l);
    if (setLanguage) setLanguage(l);
  };

  const langKey = selectedLanguage === "Afaan Oromoo" ? "om" : selectedLanguage === "Amharic" ? "am" : "en";
  const t = TRANSLATIONS[langKey] || TRANSLATIONS.en;

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const safeVehicles = Array.isArray(vehicles) ? vehicles : [];
  const safeRequests = Array.isArray(requests) ? requests : [];
  const safeAlerts = Array.isArray(smsAlerts) ? smsAlerts : [];

  const availableCount = availableVehiclesCount !== undefined 
    ? availableVehiclesCount 
    : safeVehicles.filter(v => v.status === "Available").length;
  
  const inWorkshopCount = safeVehicles.filter(v => v.status === "In Maintenance").length;
  const pendingDirectorCount = safeRequests.filter(r => r.status === "Pending Director Approval" || (r.status as string) === "Pending").length;
  const pendingFleetCount = safeRequests.filter(r => r.status === "Pending Fleet Manager Authorization").length;
  const totalPending = pendingDirectorCount + pendingFleetCount;

  const roleConfig = ROLE_CONFIGS[selectedRole] || ROLE_CONFIGS["Fleet Manager (Super Admin)"];

  // Filter navigation items based on active role privileges
  const allNavItems = [
    { 
      id: "fleet", 
      label: t.liveFleet || "Live Fleet", 
      icon: Car, 
      badge: availableCount, 
      roles: ["Fleet Manager (Super Admin)", "Immediate Director / Supervisor", "Researcher / Employee", "Driver", "Maintenance Tech"] 
    },
    { 
      id: "booking", 
      label: t.requestCar || "Request Car", 
      icon: Send, 
      roles: ["Fleet Manager (Super Admin)", "Immediate Director / Supervisor", "Researcher / Employee", "Driver", "Maintenance Tech"] 
    },
    { 
      id: "approvals", 
      label: selectedRole === "Immediate Director / Supervisor" 
        ? "Fleet Allocation & Review (Stage 1)" 
        : selectedRole === "Driver" 
        ? "Fleet Allocation & Missions" 
        : selectedRole === "Researcher / Employee"
        ? "Fleet Allocation & My Requests"
        : "Fleet Allocation & Approvals", 
      icon: CheckCircle2, 
      badge: selectedRole === "Immediate Director / Supervisor" 
        ? pendingDirectorCount 
        : selectedRole === "Fleet Manager (Super Admin)" 
        ? pendingFleetCount 
        : totalPending, 
      highlight: (selectedRole === "Immediate Director / Supervisor" ? pendingDirectorCount > 0 : pendingFleetCount > 0),
      roles: ["Fleet Manager (Super Admin)", "Immediate Director / Supervisor", "Researcher / Employee", "Driver", "Maintenance Tech"]
    },
    { 
      id: "maintenance", 
      label: t.maintenance || "Maintenance Hub", 
      icon: Wrench, 
      badge: inWorkshopCount, 
      roles: ["Fleet Manager (Super Admin)", "Maintenance Tech", "Driver", "Researcher / Employee", "Immediate Director / Supervisor"] 
    },
    { 
      id: "fuel", 
      label: t.fuelHub || "Fuel Hub", 
      icon: Fuel, 
      roles: ["Fleet Manager (Super Admin)", "Maintenance Tech", "Driver", "Researcher / Employee", "Immediate Director / Supervisor"] 
    },
    { 
      id: "sms", 
      label: "Telegram & SMS Alerts", 
      icon: MessageSquare, 
      badge: safeAlerts.length, 
      roles: ["Fleet Manager (Super Admin)", "Driver", "Immediate Director / Supervisor", "Researcher / Employee", "Maintenance Tech"] 
    },
  ];

  const navItems = allNavItems.filter(item => item.roles.includes(selectedRole));

  return (
    <header className="sticky top-0 z-40 flex flex-col shrink-0 font-sans shadow-md">
      {/* Primary Top Header in Rich Agricultural & Transport Theme */}
      <div className="h-16 sm:h-18 bg-gradient-to-r from-[#0c2217] via-[#122e20] to-[#183a29] text-white flex items-center justify-between px-3 sm:px-6 shrink-0 border-b border-emerald-800/50 shadow-inner">
        <div className="flex items-center gap-3 sm:gap-3.5">
          {/* Official IQQO Logo with Fallback */}
          <div className="relative group flex-shrink-0">
            <div className="w-11 h-11 sm:w-12 sm:h-12 bg-white rounded-lg p-0.5 shadow-md border-2 border-emerald-400/60 flex items-center justify-center overflow-hidden bg-gradient-to-br from-white to-emerald-50">
              <img
                src="https://iqqo.gov.et/sites/default/files/logo200.jpg"
                alt="IQQO Logo - Oromia Agricultural Research Institute"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain rounded"
                onError={(e) => {
                  // Fallback to elegant badge if remote image is blocked
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.classList.add('bg-emerald-700', 'text-white', 'font-black', 'text-sm');
                    parent.innerHTML = '<span class="font-bold tracking-tighter text-emerald-100">IQQO</span>';
                  }
                }}
              />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#0c2217] flex items-center justify-center text-[8px] text-white font-bold" title="Official Agricultural Research Fleet">
              🌾
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xs sm:text-sm md:text-base font-extrabold uppercase tracking-wide leading-tight text-white flex items-center gap-1.5 drop-shadow-xs">
                <span>{t.orgName || "Oromia Agricultural Research Institute (IQQO)"}</span>
              </h1>
              <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/30 uppercase tracking-wider">
                <span>🌱 Ag-Research & Transport</span>
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-[11px] sm:text-xs text-emerald-300/90 font-medium">
                {t.orgSubtitle || "Agricultural Fleet & Transportation Logistics Management System"}
              </p>
              <span className="hidden xl:inline text-emerald-500/50">•</span>
              <span className="hidden xl:inline text-[11px] text-emerald-400/80 font-mono font-medium">
                17 Research Centers & Field Trial Stations
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Telegram Bot Link indicator */}
          <a
            href="https://t.me/cariqqobot"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden xl:flex items-center gap-1.5 px-3 py-1 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 rounded-full border border-emerald-600/50 text-xs transition shadow-xs"
            title="Open official OARI Telegram Notification Bot"
          >
            <Send className="w-3 h-3 text-emerald-400" />
            <span className="font-mono font-medium">@cariqqobot</span>
          </a>

          {/* Real-Time Cloud Sync Status Button */}
          <button
            onClick={() => onManualSync && onManualSync()}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-100 rounded-full border border-emerald-600/60 shadow-xs transition text-[11px] font-semibold cursor-pointer"
            title="Real-Time Cloud Synchronization active across multiple devices. Click to force instant refresh."
          >
            <RefreshCw className={`w-3 h-3 text-emerald-400 ${isSyncing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Live Sync</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
          </button>

          {/* System Online Status Pill */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/60 rounded-full border border-emerald-700/60 shadow-xs">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <span className="text-[11px] font-semibold text-emerald-100">Fleet Active</span>
          </div>

          {/* Language Selector */}
          <div className="flex items-center space-x-1.5 bg-[#0a1b12]/90 rounded-md px-2 py-1 border border-emerald-700/50 shadow-xs">
            <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <select
              value={selectedLanguage}
              onChange={(e) => handleLanguageChange(e.target.value as Language)}
              className="bg-transparent text-xs text-emerald-100 font-medium focus:outline-none cursor-pointer"
            >
              <option value="English" className="bg-[#0f291e] text-white">English</option>
              <option value="Afaan Oromoo" className="bg-[#0f291e] text-white">Afaan Oromoo</option>
              <option value="Amharic" className="bg-[#0f291e] text-white">አማርኛ (Amharic)</option>
            </select>
          </div>

          {/* Active Authenticated Role Switcher */}
          <div className="flex items-center gap-2 border-l border-emerald-800/60 pl-2.5 sm:pl-4">
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1 text-[10px] text-emerald-300/80 font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Active Mandate</span>
                <KeyRound className="w-3 h-3 text-emerald-400" />
              </div>
              <select
                value={selectedRole}
                onChange={(e) => handleRoleSelect(e.target.value as Role)}
                className="bg-[#0a1c13] text-emerald-200 font-bold text-xs rounded px-2 py-0.5 border border-emerald-600/70 focus:outline-none focus:ring-1 focus:ring-emerald-400 cursor-pointer max-w-[150px] sm:max-w-[210px] shadow-xs"
                title="Select role to switch mandate immediately (Requires Password)"
              >
                {ROLE_LIST.map((r) => (
                  <option key={r} value={r} className="bg-[#0f291e] text-white">
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => onOpenRoleAuth ? onOpenRoleAuth(selectedRole) : null}
              title={`Authenticated as ${selectedRole}. Click to open Role Authentication & Password Security.`}
              className={`w-8 h-8 rounded-full border-2 border-emerald-400/50 flex items-center justify-center font-bold text-xs text-white uppercase shadow-sm flex-shrink-0 hover:scale-105 transition cursor-pointer ${
                roleConfig.avatarBg
              }`}
            >
              {selectedRole.charAt(0)}
            </button>
          </div>
        </div>
      </div>

      {/* Sub-Header / Horizontal Navigation Bar */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2 flex items-center justify-between gap-4 overflow-x-auto shadow-xs">
        <nav className="flex items-center gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = selectedTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-medium text-sm transition-colors whitespace-nowrap ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700 font-semibold"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-500'}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      item.highlight
                        ? "bg-amber-500 text-white"
                        : isActive
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Quick Action Buttons & Role Switcher CTA */}
        <div className="flex items-center gap-2 shrink-0">
          {onOpenOfficerModal && (
            <button
              onClick={onOpenOfficerModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-md text-xs font-semibold transition"
              title="Register and update Director, Supervisor, and Fleet Manager official profiles for reports"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
              <span className="hidden sm:inline">Officer Profiles</span>
            </button>
          )}

          <button
            onClick={() => onOpenRoleAuth ? onOpenRoleAuth() : null}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-md text-xs font-semibold transition"
            title="Switch authenticated role with password"
          >
            <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Switch Role</span>
          </button>

          {roleConfig.canSubmitTripBooking && (
            <button
              onClick={() => handleTabChange("booking")}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Book Car</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
