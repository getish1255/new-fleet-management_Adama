import React, { useState } from "react";
import { 
  Fuel, 
  Plus, 
  TrendingUp, 
  DollarSign, 
  BarChart3, 
  Search, 
  Filter, 
  FileText, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  Car,
  Calendar
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  CartesianGrid, 
  Legend 
} from "recharts";
import { FuelRecord, Vehicle, Role } from "../types";
import { OARI_CENTERS } from "../data/mockData";

interface FuelManagementProps {
  fuelRecords: FuelRecord[];
  vehicles: Vehicle[];
  role: Role;
  onAddFuelRecord: (record: Partial<FuelRecord>) => void;
}

export const FuelManagement: React.FC<FuelManagementProps> = ({
  fuelRecords = [],
  vehicles = [],
  role,
  onAddFuelRecord
}) => {
  const safeFuelRecords = Array.isArray(fuelRecords) ? fuelRecords : [];
  const safeVehicles = Array.isArray(vehicles) ? vehicles : [];

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStationFilter, setSelectedStationFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);

  // New Fuel Record Form
  const [vehicleId, setVehicleId] = useState(safeVehicles[0]?.id || "");
  const [fuelStationName, setFuelStationName] = useState("National Oil Ethiopia (NOC) - Station");
  const [liters, setLiters] = useState(65);
  const [unitPriceEtb, setUnitPriceEtb] = useState(97.00);
  const [odometerAtRefuel, setOdometerAtRefuel] = useState(35000);
  const [driverName, setDriverName] = useState("Tolessa Gemechu");
  const [approvedBy, setApprovedBy] = useState("Eng. Wondimu Bedada");

  // Summary Metrics
  const totalLiters = safeFuelRecords.reduce((acc, curr) => acc + curr.liters, 0);
  const totalExpenditureEtb = safeFuelRecords.reduce((acc, curr) => acc + curr.totalCostEtb, 0);
  const avgEfficiency = "8.6 km/L"; // Fleet baseline

  // Chart Data: Consumption by Station Base
  const stationConsumptionMap: { [key: string]: number } = {};
  safeFuelRecords.forEach((r) => {
    stationConsumptionMap[r.stationBase] = (stationConsumptionMap[r.stationBase] || 0) + r.liters;
  });

  const chartData = Object.keys(stationConsumptionMap).map((st) => ({
    name: st.replace("Agricultural Research Center", "ARC").replace("Research Center", "RC"),
    liters: stationConsumptionMap[st],
    cost: (stationConsumptionMap[st] * 97.00)
  }));

  // Filtered list
  const filteredRecords = safeFuelRecords.filter((r) => {
    const matchesSearch = 
      r.vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.voucherNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.fuelStationName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStation = selectedStationFilter === "all" || r.stationBase === selectedStationFilter;
    return matchesSearch && matchesStation;
  });

  const handleCreateFuelRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const selVehicle = safeVehicles.find(v => v.id === vehicleId) || safeVehicles[0];
    if (!selVehicle) return;

    onAddFuelRecord({
      vehicleId: selVehicle.id,
      vehiclePlate: selVehicle.plateNumber,
      stationBase: selVehicle.stationBase,
      fuelStationName,
      liters: Number(liters),
      unitPriceEtb: Number(unitPriceEtb),
      totalCostEtb: Number(liters) * Number(unitPriceEtb),
      odometerAtRefuel: Number(odometerAtRefuel),
      date: new Date().toISOString().split('T')[0],
      driverName: driverName || selVehicle.assignedDriverName || "Station Driver",
      approvedBy
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
                <span>IQQO Fuel Consumption & Energy Logistics Hub</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Diesel fuel allocations, digital oil coupons, and field research expedition efficiency analytics across OARI centers.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Issue Fuel Voucher</span>
          </button>
        </div>

        {/* KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-200/60 shadow-xs">
            <div className="flex items-center justify-between text-emerald-800 text-xs font-semibold mb-1">
              <span>Total Fleet Fuel Issued</span>
              <Fuel className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-950">
              {totalLiters.toLocaleString()} <span className="text-xs font-normal text-emerald-700">Liters</span>
            </div>
            <div className="text-[11px] text-emerald-700/90 mt-1">
              Disbursed across {fuelRecords.length} official vouchers
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-amber-50/40 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-700 text-xs font-semibold mb-1">
              <span>Total Fuel Expenditure (ETB)</span>
              <TrendingUp className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900">
              {totalExpenditureEtb.toLocaleString()} <span className="text-xs font-normal text-slate-500">ETB</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Standardized Rate: 97.00 ETB / Liter (Diesel)
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-sky-50/40 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-700 text-xs font-semibold mb-1">
              <span>Average Fleet Fuel Economy</span>
              <BarChart3 className="w-4 h-4 text-sky-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-sky-950">
              {avgEfficiency}
            </div>
            <div className="text-[11px] text-sky-700 mt-1">
              Within optimal 4WD heavy-duty parameters
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Chart & Anomaly Diagnostics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <span>Fuel Consumption by Agricultural Research Station</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">Liters Disbursed</span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} interval={0} angle={-20} textAnchor="end" />
                <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
                <Tooltip 
                  formatter={(value: any) => [`${value} Liters`, 'Fuel Consumption']}
                  contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", color: "#fff", fontSize: "11px" }}
                />
                <Bar dataKey="liters" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right AI Diagnostics & Smart Tips (5 cols) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-slate-950 text-white p-5 rounded-xl border border-slate-800 shadow-md flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                <span className="font-bold text-sm text-emerald-300">AI Fuel Efficiency Audit</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono border border-emerald-700/40">
                Gemini Analysis
              </span>
            </div>

            <div className="mt-3 space-y-2.5 text-xs text-slate-300">
              <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/80">
                <div className="font-bold text-amber-300 text-[11px] mb-0.5 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  <span>Sinana & Bale Highland Route Variance</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Land Cruiser HZJ79 (4-45210 ET) experienced +12% fuel burn during high-altitude steep terrain climbs to Agarfa seed plots. Within normal terrain allowances.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/80">
                <div className="font-bold text-emerald-400 text-[11px] mb-0.5 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Central Oromia Corridor Optimization</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Toyota Hilux (3-89104 OR) averaged 9.8 km/L on Expressway routes between Finfinnee, Bishoftu, and Adami Tulu stations. Excellent efficiency.
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-emerald-950/70 border border-emerald-800/50 rounded-lg text-emerald-200 text-[11px]">
            💡 <span className="font-semibold">Logistics Tip:</span> Ensure tire pressure is maintained at 36 PSI for tarmac and reduced to 28 PSI on muddy research plots to prevent excessive engine load and wheel spin.
          </div>
        </div>
      </div>

      {/* Fuel Voucher Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-xs">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>Official Fuel Vouchers & Refuel Receipts</span>
            </h3>
            <span className="text-xs text-slate-500">
              ({filteredRecords.length} records)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="Search voucher, plate..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <select
              value={selectedStationFilter}
              onChange={(e) => setSelectedStationFilter(e.target.value)}
              className="py-1.5 px-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700"
            >
              <option value="all">All Research Stations</option>
              {OARI_CENTERS.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4">Voucher No.</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Vehicle Plate</th>
                <th className="py-3 px-4">Station Base</th>
                <th className="py-3 px-4">Fuel Supplier / Depot</th>
                <th className="py-3 px-4">Odometer</th>
                <th className="py-3 px-4">Liters</th>
                <th className="py-3 px-4">Rate (ETB)</th>
                <th className="py-3 px-4">Total Cost (ETB)</th>
                <th className="py-3 px-4">Driver / Approver</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    {rec.voucherNumber}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {rec.date}
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-emerald-800">
                    {rec.vehiclePlate}
                  </td>
                  <td className="py-3 px-4 text-slate-700 truncate max-w-[150px]">
                    {rec.stationBase}
                  </td>
                  <td className="py-3 px-4 text-slate-700">
                    {rec.fuelStationName}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">
                    {rec.odometerAtRefuel.toLocaleString()} km
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                    {rec.liters} L
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">
                    {rec.unitPriceEtb.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    {rec.totalCostEtb.toLocaleString()} ETB
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    <div className="font-medium text-slate-800">{rec.driverName}</div>
                    <div className="text-[10px] text-slate-400">Apprv: {rec.approvedBy}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ISSUE FUEL VOUCHER */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Fuel className="w-5 h-5 text-emerald-600" />
              <span>Issue Official OARI Fuel Voucher</span>
            </h3>
            <p className="text-xs text-slate-500">
              Record fuel purchase for research vehicles and automatically reconcile tank volume.
            </p>

            <form onSubmit={handleCreateFuelRecord} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Fleet Vehicle *</label>
                <select
                  value={vehicleId}
                  onChange={(e) => {
                    setVehicleId(e.target.value);
                    const veh = vehicles.find(v => v.id === e.target.value);
                    if (veh) {
                      setOdometerAtRefuel(veh.odometerKm);
                      if (veh.assignedDriverName) setDriverName(veh.assignedDriverName);
                    }
                  }}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.plateNumber} - {v.model} ({v.stationBase}) - Current Odo: {v.odometerKm} km
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Fuel Station / Depot *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., National Oil Ethiopia (NOC) - Robe Station"
                  value={fuelStationName}
                  onChange={(e) => setFuelStationName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Quantity (Liters) *</label>
                  <input
                    type="number"
                    required
                    value={liters}
                    onChange={(e) => setLiters(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Price per Liter (ETB)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={unitPriceEtb}
                    onChange={(e) => setUnitPriceEtb(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100 flex justify-between items-center text-xs font-semibold text-emerald-950">
                <span>Calculated Total Voucher Cost:</span>
                <span className="font-mono font-bold text-base">{(liters * unitPriceEtb).toLocaleString()} ETB</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Odometer at Refuel (km) *</label>
                  <input
                    type="number"
                    required
                    value={odometerAtRefuel}
                    onChange={(e) => setOdometerAtRefuel(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Receiving Driver Name</label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Approving Officer Name</label>
                <input
                  type="text"
                  value={approvedBy}
                  onChange={(e) => setApprovedBy(e.target.value)}
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
                  Issue & Save Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
