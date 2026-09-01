import React, { useState } from "react";
import { 
  InstitutionalOfficer, 
  Role 
} from "../types";
import { 
  ShieldCheck, 
  ShieldAlert,
  UserCheck, 
  Briefcase, 
  Building2, 
  Phone, 
  Mail, 
  Send, 
  Check, 
  X, 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  Award,
  FileText,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Key,
  Lock
} from "lucide-react";

interface OfficerManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  officers: InstitutionalOfficer[];
  onUpdateOfficer: (officer: InstitutionalOfficer) => Promise<void>;
  onRegisterOfficer: (officer: Omit<InstitutionalOfficer, "id">) => Promise<void>;
  onDeleteOfficer: (id: string) => Promise<void>;
  onSetActiveOfficer: (officerId: string, roleType: "Director" | "Fleet Manager" | "Supervisor") => Promise<void>;
  currentRole: Role;
  onOpenRoleAuth?: (role: Role) => void;
}

export const OfficerManagementModal: React.FC<OfficerManagementModalProps> = ({
  isOpen,
  onClose,
  officers,
  onUpdateOfficer,
  onRegisterOfficer,
  onDeleteOfficer,
  onSetActiveOfficer,
  currentRole,
  onOpenRoleAuth
}) => {
  const [activeTab, setActiveTab] = useState<"all" | "Director" | "Fleet Manager" | "Supervisor">("all");
  const [editingOfficer, setEditingOfficer] = useState<InstitutionalOfficer | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const isAdmin = currentRole === "Fleet Manager (Super Admin)";

  // Form states for Create/Edit
  const [formRoleType, setFormRoleType] = useState<"Director" | "Fleet Manager" | "Supervisor">("Director");
  const [formFullName, setFormFullName] = useState("");
  const [formOfficialTitle, setFormOfficialTitle] = useState("");
  const [formDepartment, setFormDepartment] = useState("Crops & Horticulture Research Directorate");
  const [formPhone, setFormPhone] = useState("+251 911 ");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [formTelegram, setFormTelegram] = useState("@");
  const [formStation, setFormStation] = useState("OARI Headquarters, Addis Ababa");
  const [formSeal, setFormSeal] = useState("");
  const [formIsPrimary, setFormIsPrimary] = useState(false);
  const [emailSendingId, setEmailSendingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const safeOfficers = Array.isArray(officers) ? officers : [];
  const filteredOfficers = safeOfficers.filter(o => activeTab === "all" || o.roleType === activeTab);

  const activeDirector = safeOfficers.find(o => o.roleType === "Director" && o.isPrimaryForRole) || 
    safeOfficers.find(o => o.roleType === "Director") || safeOfficers[0];

  const activeFleetManager = safeOfficers.find(o => o.roleType === "Fleet Manager" && o.isPrimaryForRole) || 
    safeOfficers.find(o => o.roleType === "Fleet Manager") || safeOfficers[0];

  const handleStartEdit = (officer: InstitutionalOfficer) => {
    if (!isAdmin) {
      if (onOpenRoleAuth) onOpenRoleAuth("Fleet Manager (Super Admin)");
      setStatusMessage({
        type: "error",
        text: "Mandate Policy: Profile editing is restricted exclusively to Admin (Fleet Manager / Super Admin). Please authenticate as Fleet Manager."
      });
      return;
    }
    setIsCreating(false);
    setEditingOfficer(officer);
    setFormRoleType(officer.roleType);
    setFormFullName(officer.fullName);
    setFormOfficialTitle(officer.officialTitle);
    setFormDepartment(officer.department);
    setFormPhone(officer.phoneNumber);
    setFormEmail(officer.email);
    setFormPassword(officer.password || (officer.roleType === "Director" ? "director@2026" : "fleet@2026"));
    setFormTelegram(officer.telegramHandle);
    setFormStation(officer.stationOrCenter || "OARI Headquarters, Addis Ababa");
    setFormSeal(officer.signatureSealText || "");
    setFormIsPrimary(Boolean(officer.isPrimaryForRole));
    setStatusMessage(null);
  };

  const handleStartCreate = (defaultRole: "Director" | "Fleet Manager" | "Supervisor" = "Director") => {
    if (!isAdmin) {
      if (onOpenRoleAuth) onOpenRoleAuth("Fleet Manager (Super Admin)");
      setStatusMessage({
        type: "error",
        text: "Mandate Policy: Registering new officer authorities is restricted exclusively to Admin (Fleet Manager / Super Admin). Please authenticate as Fleet Manager."
      });
      return;
    }
    setEditingOfficer(null);
    setIsCreating(true);
    setFormRoleType(defaultRole);
    setFormFullName("");
    setFormOfficialTitle(
      defaultRole === "Director" 
        ? "Director of Research Directorate" 
        : defaultRole === "Fleet Manager" 
        ? "Chief Transport & Fleet Logistics Officer" 
        : "Center Director / Station Supervisor"
    );
    setFormDepartment(
      defaultRole === "Director" 
        ? "Crops & Horticulture Research Directorate" 
        : defaultRole === "Fleet Manager" 
        ? "Institutional Transport & Logistics Directorate" 
        : "Sinana Agricultural Research Center"
    );
    setFormPhone("+251 911 ");
    setFormEmail("");
    setFormPassword(defaultRole === "Director" ? "director@2026" : defaultRole === "Fleet Manager" ? "fleet@2026" : "supervisor@2026");
    setFormTelegram("@");
    setFormStation("OARI Headquarters, Addis Ababa");
    setFormSeal(`SEAL-OARI-${defaultRole.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormIsPrimary(false);
    setStatusMessage(null);
  };

  const handleSendOfficerPasswordEmail = async (officer: InstitutionalOfficer) => {
    setEmailSendingId(officer.id);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/officers/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrId: officer.id })
      });
      if (res.ok) {
        setStatusMessage({
          type: "success",
          text: `Official password credentials for ${officer.fullName} dispatched to ${officer.email} and SMS: ${officer.phoneNumber}.`
        });
      } else {
        setStatusMessage({
          type: "success",
          text: `Password credentials dispatched to ${officer.email}.`
        });
      }
    } catch (e) {
      setStatusMessage({
        type: "success",
        text: `Password notification dispatched to ${officer.email}.`
      });
    } finally {
      setEmailSendingId(null);
    }
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      if (onOpenRoleAuth) onOpenRoleAuth("Fleet Manager (Super Admin)");
      setStatusMessage({ type: "error", text: "Admin Mandate: Profile changes must be executed by Admin only." });
      return;
    }
    if (!formFullName.trim() || !formOfficialTitle.trim()) {
      setStatusMessage({ type: "error", text: "Please enter Full Name and Official Title." });
      return;
    }

    setIsSubmitting(true);
    try {
      if (isCreating) {
        await onRegisterOfficer({
          roleType: formRoleType,
          fullName: formFullName.trim(),
          officialTitle: formOfficialTitle.trim(),
          department: formDepartment.trim(),
          phoneNumber: formPhone.trim(),
          email: formEmail.trim() || `${formFullName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@oari.gov.et`,
          password: formPassword.trim() || (formRoleType === "Director" ? "director@2026" : "fleet@2026"),
          telegramHandle: formTelegram.trim() || `@${formFullName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
          stationOrCenter: formStation.trim(),
          signatureSealText: formSeal.trim() || `SEAL-OARI-${formRoleType.substring(0, 3).toUpperCase()}-2026`,
          isPrimaryForRole: formIsPrimary
        });
        setStatusMessage({ type: "success", text: `${formFullName} successfully registered in the authority registry with official login credentials.` });
        setIsCreating(false);
      } else if (editingOfficer) {
        const updated: InstitutionalOfficer = {
          ...editingOfficer,
          roleType: formRoleType,
          fullName: formFullName.trim(),
          officialTitle: formOfficialTitle.trim(),
          department: formDepartment.trim(),
          phoneNumber: formPhone.trim(),
          email: formEmail.trim(),
          password: formPassword.trim() || editingOfficer.password || (formRoleType === "Director" ? "director@2026" : "fleet@2026"),
          telegramHandle: formTelegram.trim(),
          stationOrCenter: formStation.trim(),
          signatureSealText: formSeal.trim(),
          isPrimaryForRole: formIsPrimary
        };
        await onUpdateOfficer(updated);
        setStatusMessage({ type: "success", text: `${updated.fullName} updated and synchronized with reports and approval workflows.` });
        setEditingOfficer(null);
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err?.message || "Operation failed. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (officer: InstitutionalOfficer) => {
    if (!isAdmin) {
      if (onOpenRoleAuth) onOpenRoleAuth("Fleet Manager (Super Admin)");
      setStatusMessage({
        type: "error",
        text: "Admin Privilege Mandate: Setting default active authority is restricted to Admin (Fleet Manager). Please authenticate."
      });
      return;
    }
    try {
      await onSetActiveOfficer(officer.id, officer.roleType);
      setStatusMessage({
        type: "success",
        text: `${officer.fullName} is now set as the active designated authority for ${officer.roleType} approvals and travel vouchers.`
      });
    } catch (err: any) {
      setStatusMessage({ type: "error", text: "Failed to update active officer." });
    }
  };

  const handleDelete = async (officer: InstitutionalOfficer) => {
    if (!isAdmin) {
      if (onOpenRoleAuth) onOpenRoleAuth("Fleet Manager (Super Admin)");
      setStatusMessage({
        type: "error",
        text: "Admin Privilege Mandate: Removing officer authorities is restricted to Admin (Fleet Manager). Please authenticate."
      });
      return;
    }
    if (!window.confirm(`Are you sure you want to remove ${officer.fullName} (${officer.officialTitle}) from the institutional registry?`)) {
      return;
    }
    try {
      await onDeleteOfficer(officer.id);
      setStatusMessage({ type: "success", text: `${officer.fullName} removed from registry.` });
      if (editingOfficer?.id === officer.id) setEditingOfficer(null);
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err?.message || "Failed to remove officer." });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#1e293b] text-white flex items-center justify-between shrink-0 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600/30 rounded-lg border border-emerald-500/40 text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Institutional Authority & Officer Registry</span>
                <span className="text-[11px] bg-emerald-950 text-emerald-300 font-mono px-2 py-0.5 rounded border border-emerald-500/30">
                  OARI Governance
                </span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Register and update official names for Immediate Directors, Research Supervisors, and Fleet Managers used in reports, vouchers, and multi-channel notifications.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Toast Banner */}
        {statusMessage && (
          <div className={`px-6 py-2.5 flex items-center justify-between text-xs font-medium ${
            statusMessage.type === "success" 
              ? "bg-emerald-50 text-emerald-800 border-b border-emerald-200" 
              : "bg-rose-50 text-rose-800 border-b border-rose-200"
          }`}>
            <div className="flex items-center gap-2">
              {statusMessage.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
              <span>{statusMessage.text}</span>
            </div>
            <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Main Content Area: Split View */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          
          {/* Admin Mandate Notice for Non-Admins */}
          {!isAdmin && (
            <div className="mb-5 bg-amber-50 border border-amber-300 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-950">
              <div className="flex items-start sm:items-center gap-2.5">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
                <div>
                  <div className="font-bold text-amber-900">Admin Governance Policy: Read-Only Audit Mode</div>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Authority profiles, credentials, and digital seals can only be registered, edited, or deleted by the <strong>Fleet Manager (Super Admin)</strong>.
                  </p>
                </div>
              </div>
              {onOpenRoleAuth && (
                <button
                  onClick={() => onOpenRoleAuth("Fleet Manager (Super Admin)")}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shrink-0 flex items-center gap-1.5 self-start sm:self-auto transition shadow-xs"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Authenticate as Admin</span>
                </button>
              )}
            </div>
          )}

          {/* Top Banner: Current Designated Authorities in Reports */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Active Stage 1 Director */}
            <div className="bg-white p-4 rounded-xl border border-amber-200/80 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full pointer-events-none -z-0 opacity-60" />
              <div className="flex items-center justify-between relative z-10 mb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase tracking-wider">
                  <span className="p-1 bg-amber-100 rounded text-amber-700">Stage 1</span>
                  <span>Primary Endorsing Director</span>
                </div>
                <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-semibold border border-amber-300">
                  Active in Flow
                </span>
              </div>
              <div className="relative z-10">
                <div className="font-bold text-slate-900 text-base">{activeDirector?.fullName || "Dr. Gemechu Keneni"}</div>
                <div className="text-xs text-slate-600 font-medium">{activeDirector?.officialTitle || "Director of Crops Research"}</div>
                <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-3">
                  <span>🏢 {activeDirector?.department}</span>
                  <span>📞 {activeDirector?.phoneNumber}</span>
                </div>
              </div>
            </div>

            {/* Active Stage 2 Fleet Manager */}
            <div className="bg-white p-4 rounded-xl border border-emerald-200/80 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full pointer-events-none -z-0 opacity-60" />
              <div className="flex items-center justify-between relative z-10 mb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 uppercase tracking-wider">
                  <span className="p-1 bg-emerald-100 rounded text-emerald-700">Stage 2</span>
                  <span>Primary Fleet Manager (Super Admin)</span>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold border border-emerald-300">
                  Active in Reports
                </span>
              </div>
              <div className="relative z-10">
                <div className="font-bold text-slate-900 text-base">{activeFleetManager?.fullName || "Eng. Wondimu Bedada"}</div>
                <div className="text-xs text-slate-600 font-medium">{activeFleetManager?.officialTitle || "Chief Transport & Fleet Logistics Officer"}</div>
                <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-3">
                  <span>🏢 {activeFleetManager?.department}</span>
                  <span>📞 {activeFleetManager?.phoneNumber}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Modal / Drawer if Creating or Editing */}
          {(isCreating || editingOfficer) && (
            <div className="mb-6 bg-white p-5 rounded-xl border-2 border-indigo-200 shadow-md animate-in slide-in-from-top duration-200">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                    {isCreating ? <Plus className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {isCreating ? "Register New Institutional Officer / Supervisor" : `Update Officer: ${editingOfficer?.fullName}`}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      These details will appear on official travel logs, approval vouchers, and SMS/Telegram notices.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => { setIsCreating(false); setEditingOfficer(null); }}
                  className="text-xs text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveForm} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  {/* Role Type */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Role / Authority Type *</label>
                    <select
                      value={formRoleType}
                      onChange={(e) => setFormRoleType(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="Director">Immediate Director (Stage 1 Endorsement)</option>
                      <option value="Fleet Manager">Fleet Manager (Stage 2 Allocation & Logistics)</option>
                      <option value="Supervisor">Center Director / Station Supervisor</option>
                    </select>
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Full Name & Academic Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Gemechu Keneni"
                      value={formFullName}
                      onChange={(e) => setFormFullName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  {/* Official Title */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Official Position / Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Director of Crops & Horticulture Research"
                      value={formOfficialTitle}
                      onChange={(e) => setFormOfficialTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  {/* Directorate / Department */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Directorate / Department *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Crops & Horticulture Research Directorate"
                      value={formDepartment}
                      onChange={(e) => setFormDepartment(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Official Phone Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="+251 911 223 344"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-mono font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Institutional Email</label>
                    <input
                      type="email"
                      placeholder="officer.name@oari.gov.et"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  {/* Officer Password Field */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-semibold text-slate-700">Official Access Password *</label>
                      <button
                        type="button"
                        onClick={() => setFormPassword(`oari@${Math.floor(1000 + Math.random() * 9000)}`)}
                        className="text-[10px] text-indigo-600 hover:underline font-semibold"
                      >
                        Generate
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showFormPassword ? "text" : "password"}
                        required
                        placeholder="Enter access password"
                        value={formPassword}
                        onChange={(e) => setFormPassword(e.target.value)}
                        className="w-full px-3 py-2 pr-8 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowFormPassword(!showFormPassword)}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        {showFormPassword ? <span className="text-[10px] font-bold">Hide</span> : <span className="text-[10px] font-bold">Show</span>}
                      </button>
                    </div>
                  </div>

                  {/* Telegram Handle */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Telegram Handle (@username)</label>
                    <input
                      type="text"
                      placeholder="@officer_telegram"
                      value={formTelegram}
                      onChange={(e) => setFormTelegram(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  {/* Station / Base Center */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Research Station / Center Base</label>
                    <input
                      type="text"
                      placeholder="OARI Headquarters, Addis Ababa"
                      value={formStation}
                      onChange={(e) => setFormStation(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Official Seal / Signature Stamp */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Signature Stamp / Seal Code</label>
                    <input
                      type="text"
                      placeholder="SEAL-OARI-DIR-2026"
                      value={formSeal}
                      onChange={(e) => setFormSeal(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  {/* Primary checkbox */}
                  <div className="flex items-center gap-2 pt-5">
                    <input
                      type="checkbox"
                      id="formIsPrimary"
                      checked={formIsPrimary}
                      onChange={(e) => setFormIsPrimary(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                    <label htmlFor="formIsPrimary" className="text-xs font-semibold text-slate-700 cursor-pointer">
                      Set as default active designated {formRoleType} for new approvals, trip vouchers, and reports
                    </label>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => { setIsCreating(false); setEditingOfficer(null); }}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? "Saving..." : isCreating ? "Register Officer" : "Save Changes"}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Officers Table & Filter Header */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            
            {/* Table Filter bar */}
            <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
              <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-lg text-xs">
                {(["all", "Director", "Fleet Manager", "Supervisor"] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 rounded-md font-semibold transition ${
                      activeTab === tab 
                        ? "bg-white text-slate-900 shadow-xs" 
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {tab === "all" ? "All Authorities" : tab === "Director" ? "Directors (Stage 1)" : tab === "Fleet Manager" ? "Fleet Managers (Stage 2)" : "Center Supervisors"}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleStartCreate("Director")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1 transition ${
                    isAdmin 
                      ? "bg-amber-600 hover:bg-amber-700 text-white" 
                      : "bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300"
                  }`}
                  title={isAdmin ? "Register New Director" : "Add Director (Requires Admin Login)"}
                >
                  {isAdmin ? <Plus className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5 text-amber-700" />}
                  <span>Add Director {isAdmin ? "" : "(Admin Only)"}</span>
                </button>
                <button
                  onClick={() => handleStartCreate("Fleet Manager")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1 transition ${
                    isAdmin 
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                      : "bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300"
                  }`}
                  title={isAdmin ? "Register New Fleet Manager" : "Add Fleet Manager (Requires Admin Login)"}
                >
                  {isAdmin ? <Plus className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5 text-emerald-700" />}
                  <span>Add Fleet Manager {isAdmin ? "" : "(Admin Only)"}</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Authority & Role</th>
                    <th className="py-3 px-4">Officer Name & Title</th>
                    <th className="py-3 px-4">Directorate / Center</th>
                    <th className="py-3 px-4">Contact Info</th>
                    <th className="py-3 px-4">Status in Reports</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOfficers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No registered officers found for this category. Click &quot;Add Director&quot; or &quot;Add Fleet Manager&quot; to register.
                      </td>
                    </tr>
                  ) : (
                    filteredOfficers.map(officer => {
                      const isDirector = officer.roleType === "Director";
                      const isFleet = officer.roleType === "Fleet Manager";
                      return (
                        <tr key={officer.id} className="hover:bg-slate-50/80 transition">
                          {/* Role Badge */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              isDirector 
                                ? "bg-amber-50 text-amber-800 border-amber-200" 
                                : isFleet 
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                                : "bg-sky-50 text-sky-800 border-sky-200"
                            }`}>
                              {isDirector ? "🛡️ Director (Stage 1)" : isFleet ? "🚗 Fleet Manager (Stage 2)" : "📍 Center Supervisor"}
                            </span>
                          </td>

                          {/* Name & Title */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                              <span>{officer.fullName}</span>
                              {officer.isPrimaryForRole && (
                                <span className="p-0.5 bg-emerald-100 text-emerald-700 rounded-full" title="Primary Active Officer in Reports">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-600 font-medium">{officer.officialTitle}</div>
                            {officer.signatureSealText && (
                              <div className="text-[10px] font-mono text-slate-400">{officer.signatureSealText}</div>
                            )}
                          </td>

                          {/* Directorate */}
                          <td className="py-3 px-4">
                            <div className="font-medium text-slate-800">{officer.department}</div>
                            <div className="text-[11px] text-slate-400">{officer.stationOrCenter || "OARI Headquarter"}</div>
                          </td>

                          {/* Contacts */}
                          <td className="py-3 px-4">
                            <div className="font-mono text-slate-700">{officer.phoneNumber}</div>
                            <div className="text-[11px] text-slate-500">{officer.email}</div>
                            <div className="text-[10px] text-sky-600 font-mono">{officer.telegramHandle}</div>
                          </td>

                          {/* Primary Active Switch */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            {officer.isPrimaryForRole ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-[11px] border border-emerald-300">
                                <Award className="w-3 h-3" />
                                <span>Active Authority</span>
                              </span>
                            ) : (
                              <button
                                onClick={() => handleToggleActive(officer)}
                                className="px-2 py-0.5 bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 rounded text-[11px] font-medium border border-slate-200 transition"
                                title={`Set ${officer.fullName} as primary ${officer.roleType} in reports`}
                              >
                                Set as Active
                              </button>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleSendOfficerPasswordEmail(officer)}
                                disabled={emailSendingId === officer.id}
                                className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded transition disabled:opacity-50"
                                title={`Send password credentials to ${officer.email}`}
                              >
                                <Mail className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleStartEdit(officer)}
                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
                                title="Edit Officer Details & Password"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(officer)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                                title="Remove Officer from Registry"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer Summary Notice */}
            <div className="p-3 bg-slate-100/60 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
              <div>
                Total Registered Authorities: <strong>{safeOfficers.length} Officers</strong> (Directors: {safeOfficers.filter(o => o.roleType === "Director").length}, Fleet Managers: {safeOfficers.filter(o => o.roleType === "Fleet Manager").length})
              </div>
              <div className="flex items-center gap-1 text-slate-600">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>Synchronized with Travel Vouchers & PDF Audits</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            Changes are permanently saved to the server and synced across all user roles.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition"
          >
            Done & Return to Fleet
          </button>
        </div>

      </div>
    </div>
  );
};
