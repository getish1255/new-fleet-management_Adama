import React, { useState } from "react";
import { 
  Wrench, 
  Plus, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck, 
  Search, 
  Filter, 
  FileText, 
  Car,
  Settings,
  DollarSign
} from "lucide-react";
import { MaintenanceRecord, Vehicle, Role } from "../types";

interface MaintenanceHubProps {
  maintenanceRecords: MaintenanceRecord[];
  vehicles: Vehicle[];
  role: Role;
  onAddMaintenanceRecord: (record: Partial<MaintenanceRecord>) => void;
}

export const MaintenanceHub: React.FC<MaintenanceHubProps> = ({
  maintenanceRecords = [],
  vehicles = [],
  role,
  onAddMaintenanceRecord
}) => {
  const safeMaintenanceRecords = Array.isArray(maintenanceRecords) ? maintenanceRecords : [];
  const safeVehicles = Array.isArray(vehicles) ? vehicles : [];

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);

  // New Maintenance Form State
  const [vehicleId, setVehicleId] = useState(safeVehicles[0]?.id || "");
  const [serviceType, setServiceType] = useState<MaintenanceRecord["serviceType"]>("Periodic Oil & Filter");
  const [status, setStatus] = useState<MaintenanceRecord["status"]>("Scheduled");
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [workshopName, setWorkshopName] = useState("OARI Central Mechanical Workshop - Finfinnee");
  const [odometerKm, setOdometerKm] = useState(45000);
  const [costEtb, setCostEtb] = useState(16500);
  const [technicianNotes, setTechnicianNotes] = useState("Complete inspection of 4WD driveline, air filter, and suspension bushings.");
  const [partsInput, setPartsInput] = useState("Synthetic Diesel Oil 15W-40 (10L), Oil Filter, Primary Fuel Filter");

  // Summary Metrics
  const activeInWorkshop = safeVehicles.filter(v => v.status === "In Maintenance").length;
  const dueSoonCount = safeVehicles.filter(v => (v.nextServiceKm - v.odometerKm) < 2000).length;
  const totalMaintenanceCost = safeMaintenanceRecords.reduce((acc, curr) => acc + curr.costEtb, 0);

  const filteredRecords = safeMaintenanceRecords.filter(r => {
    const matchesSearch = 
      r.vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.jobCardNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.workshopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.serviceType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatusFilter === "all" || r.status === selectedStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    const selVehicle = safeVehicles.find(v => v.id === vehicleId) || safeVehicles[0];
    if (!selVehicle) return;
    const partsArray = partsInput.split(',').map(p => p.trim()).filter(Boolean);

    onAddMaintenanceRecord({
      vehicleId: selVehicle.id,
      vehiclePlate: selVehicle.plateNumber,
      serviceType,
      status,
      scheduledDate,
      workshopName,
      odometerKm: Number(odometerKm),
      costEtb: Number(costEtb),
      technicianNotes,
      partsReplaced: partsArray
    });

    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Row */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white p-0.5 rounded-lg border border-emerald-300 shadow-2xs flex items-center justify-center shrink-0">
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
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <span>IQQO Fleet Maintenance Hub & Mechanical Job Cards</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                4WD suspension diagnostics, heavy-duty expedition servicing, spare parts inventory, and workshop job records across OARI.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Create Maintenance Job Card</span>
          </button>
        </div>

        {/* KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50/40 border border-amber-200 shadow-xs">
            <div className="flex items-center justify-between text-amber-800 text-xs font-semibold mb-1">
              <span>Service Due Soon (&lt; 2,000 km)</span>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-amber-950">
              {dueSoonCount} <span className="text-xs font-normal text-amber-700">Vehicles Flagged</span>
            </div>
            <div className="text-[11px] text-amber-800/80 mt-1">
              Requires scheduled maintenance before long field expeditions
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-blue-50/40 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-700 text-xs font-semibold mb-1">
              <span>Vehicles in Workshop</span>
              <Wrench className="w-4 h-4 text-sky-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900">
              {activeInWorkshop} <span className="text-xs font-normal text-slate-500">Active Repairs</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Currently in mechanical inspection bay
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50/40 border border-emerald-200 shadow-xs">
            <div className="flex items-center justify-between text-emerald-800 text-xs font-semibold mb-1">
              <span>Total Maintenance Spend</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-950">
              {totalMaintenanceCost.toLocaleString()} <span className="text-xs font-normal text-emerald-700">ETB</span>
            </div>
            <div className="text-[11px] text-emerald-700 mt-1">
              Across {maintenanceRecords.length} historical service records
            </div>
          </div>
        </div>
      </div>

      {/* Fleet Maintenance Schedule Grid (All Vehicles Preventive Status) */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Vehicle Preventive Maintenance Schedule & Thresholds</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
          {vehicles.map((v) => {
            const kmUntil = v.nextServiceKm - v.odometerKm;
            const isDue = kmUntil <= 1500;
            const progress = Math.min(100, Math.max(0, Math.round(((v.odometerKm % 5000) / 5000) * 100)));

            return (
              <div
                key={v.id}
                className={`p-3.5 rounded-xl border text-xs space-y-2.5 transition ${
                  isDue ? "bg-amber-50/50 border-amber-300" : "bg-slate-50/50 border-slate-200"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-mono font-bold text-slate-900 text-xs bg-white px-2 py-0.5 rounded border border-slate-200 inline-block shadow-2xs">
                      {v.plateNumber}
                    </div>
                    <div className="font-bold text-slate-800 text-xs mt-1">{v.model}</div>
                    <div className="text-slate-500 text-[11px]">{v.stationBase}</div>
                  </div>
                  {isDue ? (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px] flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      Due Soon
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      Healthy
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-600">
                    <span>Odometer: <span className="font-bold font-mono">{v.odometerKm.toLocaleString()} km</span></span>
                    <span>Target: <span className="font-bold font-mono">{v.nextServiceKm.toLocaleString()} km</span></span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full ${isDue ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Last Service: {v.lastServiceDate}</span>
                  <span className="font-bold text-slate-700 font-mono">
                    {kmUntil > 0 ? `${kmUntil.toLocaleString()} km left` : 'Service Overdue!'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Maintenance Job Cards Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-xs">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>Workshop Job Cards & Repair Records</span>
            </h3>
            <span className="text-slate-500">({filteredRecords.length} records)</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="Search job card, plate, garage..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="py-1.5 px-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700"
            >
              <option value="all">All Statuses</option>
              <option value="In Workshop">In Workshop</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4">Job Card No.</th>
                <th className="py-3 px-4">Vehicle Plate</th>
                <th className="py-3 px-4">Service Category</th>
                <th className="py-3 px-4">Workshop / Garage</th>
                <th className="py-3 px-4">Odometer</th>
                <th className="py-3 px-4">Scheduled Date</th>
                <th className="py-3 px-4">Cost (ETB)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Replaced Parts / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    {m.jobCardNumber}
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-emerald-800">
                    {m.vehiclePlate}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-800">
                    {m.serviceType}
                  </td>
                  <td className="py-3 px-4 text-slate-700">
                    {m.workshopName}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">
                    {m.odometerKm.toLocaleString()} km
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {m.scheduledDate}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    {m.costEtb.toLocaleString()} ETB
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      m.status === "Completed" ? "bg-emerald-100 text-emerald-800" :
                      m.status === "In Workshop" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"
                    }`}>
                      {m.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 max-w-xs">
                    <div className="truncate font-medium text-slate-800">
                      {m.partsReplaced?.join(", ") || "Inspection"}
                    </div>
                    <div className="truncate text-[10px] text-slate-400">
                      {m.technicianNotes}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: CREATE MAINTENANCE JOB CARD */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-4">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-emerald-600" />
              <span>Create Official OARI Workshop Job Card</span>
            </h3>
            <p className="text-xs text-slate-500">
              Schedule preventive maintenance, mechanical service, or emergency repair.
            </p>

            <form onSubmit={handleCreateMaintenance} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Vehicle *</label>
                <select
                  value={vehicleId}
                  onChange={(e) => {
                    setVehicleId(e.target.value);
                    const veh = vehicles.find(v => v.id === e.target.value);
                    if (veh) setOdometerKm(veh.odometerKm);
                  }}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.plateNumber} - {v.model} ({v.stationBase}) - Current: {v.odometerKm} km
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Service Type *</label>
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value as MaintenanceRecord["serviceType"])}
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Periodic Oil & Filter">Periodic Oil & Filter (5,000 km)</option>
                    <option value="4WD Transmission & Differential">4WD Transmission & Differential (20,000 km)</option>
                    <option value="Brake System & Suspension">Brake System & Suspension</option>
                    <option value="Tire Replacement">Tire Replacement (All-Terrain)</option>
                    <option value="Engine Overhaul">Engine Overhaul</option>
                    <option value="Electrical & AC Service">Electrical & AC Service</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Workshop Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as MaintenanceRecord["status"])}
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-semibold"
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="In Workshop">In Workshop (Vehicle Off-Road)</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Workshop / Service Garage *</label>
                <input
                  type="text"
                  required
                  value={workshopName}
                  onChange={(e) => setWorkshopName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Scheduled Date *</label>
                  <input
                    type="date"
                    required
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Odometer (km)</label>
                  <input
                    type="number"
                    value={odometerKm}
                    onChange={(e) => setOdometerKm(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Estimated Cost (ETB)</label>
                  <input
                    type="number"
                    value={costEtb}
                    onChange={(e) => setCostEtb(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Parts to Replace / Replaced (comma separated)</label>
                <input
                  type="text"
                  value={partsInput}
                  onChange={(e) => setPartsInput(e.target.value)}
                  placeholder="e.g. Engine Oil (10L), Oil Filter, Front Brake Pads"
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Technician Diagnostic Notes</label>
                <textarea
                  rows={2}
                  value={technicianNotes}
                  onChange={(e) => setTechnicianNotes(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm"
                >
                  Issue Job Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
