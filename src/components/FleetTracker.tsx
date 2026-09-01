import React, { useState } from "react";
import { 
  Car, 
  MapPin, 
  Fuel, 
  Gauge, 
  Wrench, 
  User, 
  Phone, 
  ShieldCheck, 
  Search, 
  Filter, 
  Plus, 
  Layers, 
  ExternalLink,
  Zap,
  CheckCircle2,
  Calendar,
  AlertCircle,
  LayoutGrid,
  List,
  Compass,
  Pencil,
  Trash2,
  AlertTriangle,
  X,
  Save,
  Check,
  Users,
  Star,
  Award,
  SendHorizontal,
  Send,
  Lock,
  ShieldAlert
} from "lucide-react";
import { Vehicle, Role, Driver } from "../types";
import { OARI_CENTERS } from "../data/mockData";

interface FleetTrackerProps {
  vehicles: Vehicle[];
  drivers?: Driver[];
  role: Role;
  onRequestVehicle?: (vehicle: Vehicle) => void;
  onSelectVehicleForBooking?: (vehicle: Vehicle) => void;
  onAddVehicle?: (newVehicle: Partial<Vehicle>) => void;
  onEditVehicle?: (id: string, updatedData: Partial<Vehicle>) => void;
  onDeleteVehicle?: (id: string) => void;
  onUpdateVehicleStatus?: (id: string, updates: { status?: Vehicle["status"]; odometerKm?: number; currentFuelLevel?: number }) => void;
  onAddDriver?: (newDriver: Partial<Driver>) => void;
  onEditDriver?: (id: string, updatedDriver: Partial<Driver>) => void;
  onDeleteDriver?: (id: string) => void;
  onOpenRoleAuth?: (roleName: Role) => void;
}

export const FleetTracker: React.FC<FleetTrackerProps> = ({
  vehicles = [],
  drivers = [],
  role,
  onRequestVehicle,
  onSelectVehicleForBooking,
  onAddVehicle,
  onEditVehicle,
  onDeleteVehicle,
  onUpdateVehicleStatus,
  onAddDriver,
  onEditDriver,
  onDeleteDriver,
  onOpenRoleAuth
}) => {
  const isFleetManager = role === "Fleet Manager (Super Admin)";
  const safeVehicles = Array.isArray(vehicles) ? vehicles : [];
  const safeDrivers = Array.isArray(drivers) ? drivers : [];
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCenter, setSelectedCenter] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"table" | "grid" | "map" | "drivers">("table");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddDriverModal, setShowAddDriverModal] = useState(false);
  const [quickEditVehicle, setQuickEditVehicle] = useState<Vehicle | null>(null);

  // Full Edit & Delete vehicle modals state
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Vehicle>>({});
  const [deletingVehicle, setDeletingVehicle] = useState<Vehicle | null>(null);

  // Driver Edit & Delete modals state
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [driverFormData, setDriverFormData] = useState<Partial<Driver>>({});
  const [deletingDriver, setDeletingDriver] = useState<Driver | null>(null);

  // New Driver Form State
  const [newDriverName, setNewDriverName] = useState("");
  const [newDriverPhoneInput, setNewDriverPhoneInput] = useState("+251 911 ");
  const [newDriverTelegram, setNewDriverTelegram] = useState("");
  const [newDriverLicense, setNewDriverLicense] = useState("");
  const [newDriverStation, setNewDriverStation] = useState("OARI Headquarter");
  const [newDriverExp, setNewDriverExp] = useState(5);
  const [newDriverStatus, setNewDriverStatus] = useState<Driver["status"]>("Active / Available");
  const [newDriverAssignedCar, setNewDriverAssignedCar] = useState("Unassigned / Pool Car");

  // New vehicle form state (Register Car Only)
  const [newPlate, setNewPlate] = useState("");
  const [newModel, setNewModel] = useState("Toyota Hilux Double Cab 4WD");
  const [newType, setNewType] = useState<Vehicle["type"]>("4WD Pickup");
  const [newStation, setNewStation] = useState("OARI Headquarter");
  const [newYear, setNewYear] = useState(2024);
  const [newFuelCap, setNewFuelCap] = useState(80);
  const [newOdometer, setNewOdometer] = useState(15000);
  const [newDriver, setNewDriver] = useState("Unassigned / Pool Driver");
  const [newDriverPhone, setNewDriverPhone] = useState("");

  const handleBooking = (v: Vehicle) => {
    if (v.status !== "Available") {
      alert(`Vehicle ${v.plateNumber} is currently "${v.status}" and on active field deployment. Only vehicles that have returned and are in "Available" status can be booked for research missions.`);
      return;
    }
    if (onRequestVehicle) onRequestVehicle(v);
    if (onSelectVehicleForBooking) onSelectVehicleForBooking(v);
  };

  const handleOpenEdit = (v: Vehicle) => {
    if (!isFleetManager) {
      if (onOpenRoleAuth) onOpenRoleAuth("Fleet Manager (Super Admin)");
      return;
    }
    setEditingVehicle(v);
    setEditFormData({
      plateNumber: v.plateNumber,
      code: v.code,
      model: v.model,
      type: v.type,
      stationBase: v.stationBase,
      year: v.year || 2024,
      fuelType: v.fuelType || "Diesel",
      fuelTankCapacity: v.fuelTankCapacity,
      currentFuelLevel: v.currentFuelLevel,
      odometerKm: v.odometerKm,
      status: v.status,
      assignedDriverName: v.assignedDriverName,
      driverPhone: v.driverPhone,
      nextServiceKm: v.nextServiceKm,
      lastServiceDate: v.lastServiceDate,
      features: v.features || []
    });
  };

  const handleOpenDelete = (v: Vehicle) => {
    if (!isFleetManager) {
      if (onOpenRoleAuth) onOpenRoleAuth("Fleet Manager (Super Admin)");
      return;
    }
    setDeletingVehicle(v);
  };

  const handleOpenQuickEdit = (v: Vehicle) => {
    if (!isFleetManager) {
      if (onOpenRoleAuth) onOpenRoleAuth("Fleet Manager (Super Admin)");
      return;
    }
    setQuickEditVehicle(v);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFleetManager) {
      if (onOpenRoleAuth) onOpenRoleAuth("Fleet Manager (Super Admin)");
      return;
    }
    if (!editingVehicle) return;
    if (onEditVehicle) {
      onEditVehicle(editingVehicle.id, editFormData);
    }
    setEditingVehicle(null);
  };

  const handleConfirmDelete = () => {
    if (!isFleetManager) {
      if (onOpenRoleAuth) onOpenRoleAuth("Fleet Manager (Super Admin)");
      return;
    }
    if (!deletingVehicle) return;
    if (onDeleteVehicle) {
      onDeleteVehicle(deletingVehicle.id);
    }
    setDeletingVehicle(null);
  };

  const filteredVehicles = safeVehicles.filter((v) => {
    const matchesSearch = 
      v.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.assignedDriverName && v.assignedDriverName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      v.code.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCenter = selectedCenter === "all" || v.stationBase === selectedCenter;
    const matchesStatus = selectedStatus === "all" || v.status === selectedStatus;
    const matchesType = selectedType === "all" || v.type === selectedType;

    return matchesSearch && matchesCenter && matchesStatus && matchesType;
  });

  const getStatusBadge = (status: Vehicle["status"]) => {
    switch (status) {
      case "Available":
        return (
          <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            AVAILABLE
          </span>
        );
      case "On Mission":
        return (
          <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            ON FIELD
          </span>
        );
      case "In Maintenance":
        return (
          <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
            <Wrench className="w-2.5 h-2.5" />
            MAINTENANCE
          </span>
        );
      case "Reserved":
        return (
          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
            <Calendar className="w-2.5 h-2.5" />
            RESERVED
          </span>
        );
    }
  };

  const handleCreateVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlate || !newModel) return;

    const centerObj = OARI_CENTERS.find(c => c.name === newStation) || OARI_CENTERS[0];
    const selectedDriverObj = safeDrivers.find(d => d.name === newDriver);

    const vehicleData: Partial<Vehicle> = {
      plateNumber: newPlate.trim(),
      model: newModel.trim(),
      type: newType,
      stationBase: newStation,
      year: Number(newYear) || 2024,
      fuelType: "Diesel",
      fuelTankCapacity: Number(newFuelCap) || 80,
      currentFuelLevel: Math.round(Number(newFuelCap) * 0.85),
      odometerKm: Number(newOdometer) || 15000,
      status: "Available",
      assignedDriverName: newDriver && newDriver !== "Unassigned / Pool Driver" ? newDriver : "Station Pool Driver",
      assignedDriverId: selectedDriverObj?.id,
      driverPhone: selectedDriverObj?.phone || newDriverPhone || "+251 911 000 000",
      nextServiceKm: (Number(newOdometer) || 15000) + 5000,
      lastServiceDate: new Date().toISOString().split('T')[0],
      coordinates: centerObj.coordinates,
      features: ["Heavy Duty 4WD", "High Clearance", "GPS Tracker", "Expedition Roof Rack"]
    };

    if (onAddVehicle) {
      onAddVehicle(vehicleData);
    }

    setShowAddModal(false);
    setNewPlate("");
    setNewDriver("Unassigned / Pool Driver");
    setNewDriverPhone("");
  };

  const handleOpenEditDriver = (d: Driver) => {
    if (!isFleetManager) {
      if (onOpenRoleAuth) onOpenRoleAuth("Fleet Manager (Super Admin)");
      return;
    }
    setEditingDriver(d);
    setDriverFormData({
      name: d.name,
      phone: d.phone,
      telegramHandle: d.telegramHandle,
      licenseNumber: d.licenseNumber,
      stationBase: d.stationBase,
      experienceYears: d.experienceYears,
      rating: d.rating,
      status: d.status,
      assignedVehiclePlate: d.assignedVehiclePlate || "Unassigned / Pool Car",
      assignedVehicleId: d.assignedVehicleId
    });
  };

  const handleSaveDriverEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFleetManager) {
      if (onOpenRoleAuth) onOpenRoleAuth("Fleet Manager (Super Admin)");
      return;
    }
    if (!editingDriver) return;
    if (onEditDriver) {
      onEditDriver(editingDriver.id, driverFormData);
    }
    setEditingDriver(null);
  };

  const handleOpenDeleteDriver = (d: Driver) => {
    if (!isFleetManager) {
      if (onOpenRoleAuth) onOpenRoleAuth("Fleet Manager (Super Admin)");
      return;
    }
    setDeletingDriver(d);
  };

  const handleConfirmDeleteDriver = () => {
    if (!isFleetManager) {
      if (onOpenRoleAuth) onOpenRoleAuth("Fleet Manager (Super Admin)");
      return;
    }
    if (!deletingDriver) return;
    if (onDeleteDriver) {
      onDeleteDriver(deletingDriver.id);
    }
    setDeletingDriver(null);
  };

  const handleCreateDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFleetManager) {
      if (onOpenRoleAuth) onOpenRoleAuth("Fleet Manager (Super Admin)");
      return;
    }
    if (!newDriverName) return;
    const selectedCar = safeVehicles.find(v => v.plateNumber === newDriverAssignedCar);

    const newDriverObj: Partial<Driver> = {
      name: newDriverName.trim(),
      phone: newDriverPhoneInput.trim(),
      telegramHandle: newDriverTelegram ? (newDriverTelegram.startsWith('@') ? newDriverTelegram : `@${newDriverTelegram}`) : `@${newDriverName.toLowerCase().replace(/\s+/g, '_')}`,
      licenseNumber: newDriverLicense.trim() || `OR-DL-${Math.floor(10000 + Math.random() * 90000)}`,
      stationBase: newDriverStation,
      experienceYears: Number(newDriverExp) || 5,
      rating: 4.8,
      status: newDriverStatus || "Active / Available",
      assignedVehiclePlate: newDriverAssignedCar && newDriverAssignedCar !== "Unassigned / Pool Car" ? newDriverAssignedCar : "Unassigned / Pool Car",
      assignedVehicleId: selectedCar?.id
    };
    if (onAddDriver) {
      onAddDriver(newDriverObj);
    }
    setShowAddDriverModal(false);
    setNewDriverName("");
    setNewDriverLicense("");
    setNewDriverTelegram("");
    setNewDriverAssignedCar("Unassigned / Pool Car");
  };

  const filteredDrivers = safeDrivers.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.phone.includes(searchTerm) ||
      (d.licenseNumber && d.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (d.assignedVehiclePlate && d.assignedVehiclePlate.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCenter = selectedCenter === "all" || d.stationBase === selectedCenter;
    return matchesSearch && matchesCenter;
  });

  return (
    <div className="space-y-6">
      {/* Fleet Manager Governance Notice */}
      {!isFleetManager && (
        <div className="bg-amber-50/90 border border-amber-200/80 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-amber-100 rounded-lg text-amber-800 shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-amber-950">Fleet Governance Policy</p>
              <p className="text-amber-800 text-[11px] mt-0.5">
                Car registration, vehicle specifications update, status changes, and driver modifications are strictly restricted to the <strong>Fleet Manager (Super Admin)</strong>.
              </p>
            </div>
          </div>
          {onOpenRoleAuth && (
            <button
              onClick={() => onOpenRoleAuth("Fleet Manager (Super Admin)")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg font-semibold text-xs transition shadow-2xs shrink-0 self-start sm:self-auto"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Login as Fleet Manager</span>
            </button>
          )}
        </div>
      )}

      {/* Top Controls & Filter Bar */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>IQQO Agricultural Research Fleet Registry</span>
                <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border">
                  {safeVehicles.length} Registered Vehicles • {safeDrivers.length} Drivers
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time telemetry across 17 OARI Research Centers, 4WD field trial vehicles, and driver manifests.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isFleetManager ? (
              <>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-all"
                  title="Step 1: Register vehicle specifications only"
                >
                  <Car className="w-4 h-4" />
                  <span>+ 1. Register Car Only</span>
                </button>
                <button
                  onClick={() => setShowAddDriverModal(true)}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-xs font-semibold shadow-xs transition-all"
                  title="Step 2: Register driver profile and assign to registered car"
                >
                  <User className="w-4 h-4" />
                  <span>+ 2. Register Driver Profile</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onOpenRoleAuth && onOpenRoleAuth("Fleet Manager (Super Admin)")}
                  className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-900 rounded-lg text-xs font-semibold border border-slate-200 transition-colors"
                  title="Car registration is restricted to Fleet Manager"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Register Car (Fleet Mgr)</span>
                </button>
                <button
                  onClick={() => onOpenRoleAuth && onOpenRoleAuth("Fleet Manager (Super Admin)")}
                  className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-900 rounded-lg text-xs font-semibold border border-slate-200 transition-colors"
                  title="Driver registration is restricted to Fleet Manager"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Register Driver (Fleet Mgr)</span>
                </button>
              </>
            )}

            {/* View Mode Toggle */}
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-md text-xs font-medium transition ${
                  viewMode === "table" ? "bg-white text-slate-900 shadow-2xs font-semibold" : "text-slate-500 hover:text-slate-900"
                }`}
                title="Table View with Action Icons"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md text-xs font-medium transition ${
                  viewMode === "grid" ? "bg-white text-slate-900 shadow-2xs font-semibold" : "text-slate-500 hover:text-slate-900"
                }`}
                title="Grid Cards View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("map")}
                className={`p-1.5 rounded-md text-xs font-medium transition ${
                  viewMode === "map" ? "bg-white text-slate-900 shadow-2xs font-semibold" : "text-slate-500 hover:text-slate-900"
                }`}
                title="Regional Station Map"
              >
                <Compass className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("drivers")}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition flex items-center gap-1.5 ${
                  viewMode === "drivers" ? "bg-white text-emerald-800 shadow-2xs font-bold border border-emerald-300" : "text-slate-500 hover:text-slate-900"
                }`}
                title="Drivers & Operators Registry"
              >
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                <span>Drivers ({safeDrivers.length})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search plate, model, driver..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 placeholder-slate-400 transition"
            />
          </div>

          <div>
            <select
              value={selectedCenter}
              onChange={(e) => setSelectedCenter(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700"
            >
              <option value="all">All 11 Research Stations</option>
              {OARI_CENTERS.map((center) => (
                <option key={center.id} value={center.name}>
                  {center.name} ({center.location})
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700"
            >
              <option value="all">All Operational Statuses</option>
              <option value="Available">Available (Ready for Mission)</option>
              <option value="On Mission">On Field Mission</option>
              <option value="In Maintenance">In Workshop Maintenance</option>
              <option value="Reserved">Reserved</option>
            </select>
          </div>

          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700"
            >
              <option value="all">All Vehicle Classes</option>
              <option value="4WD Pickup">4WD Pickup (Hilux / D-Max)</option>
              <option value="Land Cruiser Hardtop">Land Cruiser Hardtop (HZJ79/78)</option>
              <option value="SUV / Prado">SUV / Prado</option>
              <option value="Minibus / Crew">Minibus / Crew Transporter</option>
              <option value="Agri-Truck">Heavy Agri-Truck</option>
            </select>
          </div>
        </div>
      </div>

      {/* VIEW 1: PROFESSIONAL POLISH TABLE VIEW WITH WORKING EDIT & DELETE ICONS */}
      {viewMode === "table" && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Live Fleet Registry & Vehicle Information</h3>
              <p className="text-xs text-slate-400">Showing {filteredVehicles.length} of {safeVehicles.length} registered vehicles with full edit/delete controls</p>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              {filteredVehicles.filter(v => v.status === "Available").length} Ready for Mission
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 sticky top-0">
                <tr>
                  <th className="px-5 py-3 font-bold border-b border-slate-100">Vehicle ID</th>
                  <th className="px-5 py-3 font-bold border-b border-slate-100">Model / Class</th>
                  <th className="px-5 py-3 font-bold border-b border-slate-100">Research Station Base</th>
                  <th className="px-5 py-3 font-bold border-b border-slate-100">Assigned Driver</th>
                  <th className="px-5 py-3 font-bold border-b border-slate-100">Status</th>
                  <th className="px-5 py-3 font-bold border-b border-slate-100">Fuel Tank</th>
                  <th className="px-5 py-3 font-bold border-b border-slate-100">Odometer</th>
                  <th className="px-5 py-3 font-bold border-b border-slate-100 text-right">Actions (Edit / Delete / Book)</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100">
                {filteredVehicles.map((vehicle) => {
                  const fuelPercent = Math.round((vehicle.currentFuelLevel / vehicle.fuelTankCapacity) * 100);
                  const fuelBarColor = fuelPercent > 50 ? "bg-emerald-500" : fuelPercent > 25 ? "bg-amber-500" : "bg-red-500";
                  
                  return (
                    <tr key={vehicle.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-5 py-3.5 font-mono font-medium text-slate-700 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 flex items-center gap-1.5">
                            <Car className="w-3.5 h-3.5 text-emerald-600" />
                            {vehicle.plateNumber}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">{vehicle.code} • Year {vehicle.year || 2024}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-medium text-slate-800 whitespace-nowrap">
                        <div>{vehicle.model}</div>
                        <div className="text-[11px] text-slate-500 font-normal">{vehicle.type} • {vehicle.fuelType || 'Diesel'}</div>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-600 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-medium text-slate-800">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{vehicle.stationBase}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-700 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">{vehicle.assignedDriverName || "Station Pool Driver"}</div>
                        <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                          <Phone className="w-2.5 h-2.5 text-slate-400" />
                          {vehicle.driverPhone || "—"}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {getStatusBadge(vehicle.status)}
                      </td>
                      <td className="px-5 py-3.5 min-w-[120px]">
                        <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                          <span>{vehicle.currentFuelLevel}L / {vehicle.fuelTankCapacity}L</span>
                          <span className="font-bold text-slate-700">{fuelPercent}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className={`${fuelBarColor} h-full`} style={{ width: `${fuelPercent}%` }}></div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-700 whitespace-nowrap">
                        {vehicle.odometerKm.toLocaleString()} km
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1.5">
                          {vehicle.status === "Available" ? (
                            <button
                              onClick={() => handleBooking(vehicle)}
                              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-xs font-semibold transition shadow-2xs"
                              title="Book vehicle for research mission"
                            >
                              Book Car
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenQuickEdit(vehicle)}
                              className="px-2 py-1 text-slate-600 hover:text-emerald-700 text-xs font-semibold hover:bg-slate-100 rounded transition border border-slate-200"
                              title={isFleetManager ? "Update operational status" : "Status updates restricted to Fleet Manager"}
                            >
                              Status
                            </button>
                          )}

                          {/* EDIT ICON BUTTON */}
                          <button
                            onClick={() => handleOpenEdit(vehicle)}
                            className={`p-1.5 rounded-md transition border ${
                              isFleetManager
                                ? "text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 border-slate-200"
                                : "text-slate-400 hover:text-amber-700 hover:bg-amber-50 border-slate-200"
                            }`}
                            title={isFleetManager ? "Edit Vehicle Details & Registration Info" : "Car info update must be done by Fleet Manager only"}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          {/* DELETE ICON BUTTON */}
                          <button
                            onClick={() => handleOpenDelete(vehicle)}
                            className={`p-1.5 rounded-md transition border ${
                              isFleetManager
                                ? "text-slate-400 hover:text-red-700 hover:bg-red-50 border-slate-200"
                                : "text-slate-400 hover:text-amber-700 hover:bg-amber-50 border-slate-200"
                            }`}
                            title={isFleetManager ? "Delete Vehicle from Fleet" : "Vehicle deletion restricted to Fleet Manager"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* VIEW 2: REGIONAL MAP VIEW */}
      {viewMode === "map" && (
        <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 text-white shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-sm text-emerald-400 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>Oromia Regional Fleet Deployment & Research Stations</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Geographic distribution of available 4WD field vehicles and active agricultural expedition routes.
              </p>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Available</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span> On Field Mission</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Workshop</span>
            </div>
          </div>

          <div className="relative bg-slate-950 rounded-lg p-6 border border-slate-800/80 min-h-[380px] overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30"></div>

            <div className="relative grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 z-10">
              {OARI_CENTERS.map((center) => {
                const stationVehicles = safeVehicles.filter(v => v.stationBase === center.name);
                const avail = stationVehicles.filter(v => v.status === "Available").length;
                const mission = stationVehicles.filter(v => v.status === "On Mission").length;
                const maint = stationVehicles.filter(v => v.status === "In Maintenance").length;

                return (
                  <div 
                    key={center.id}
                    className="bg-slate-900/90 rounded-lg p-3.5 border border-slate-800 hover:border-emerald-500/50 transition shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">
                          {center.location}
                        </span>
                        <h4 className="font-semibold text-xs text-white leading-snug mt-0.5">
                          {center.name.replace("Agricultural Research Center", "ARC")}
                        </h4>
                      </div>
                      <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300">
                        {stationVehicles.length}
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="text-emerald-400 font-medium">● {avail} ready</span>
                        {mission > 0 && <span className="text-sky-400">● {mission} active</span>}
                        {maint > 0 && <span className="text-amber-400">● {maint} rep</span>}
                      </div>
                    </div>

                    {stationVehicles.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {stationVehicles.slice(0, 2).map(v => (
                          <div key={v.id} className="text-[11px] bg-slate-950/60 px-2 py-1 rounded flex items-center justify-between text-slate-300">
                            <span className="font-mono text-emerald-300 font-medium">{v.plateNumber}</span>
                            <span className="text-slate-400 truncate max-w-[110px]">{v.model.split(' ')[0]} {v.model.split(' ')[1]}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: VEHICLE GRID CARDS */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredVehicles.map((vehicle) => {
            const fuelPercent = Math.round((vehicle.currentFuelLevel / vehicle.fuelTankCapacity) * 100);
            const serviceDueKm = vehicle.nextServiceKm - vehicle.odometerKm;
            const isServiceDueSoon = serviceDueKm < 1500;

            return (
              <div
                key={vehicle.id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              >
                <div>
                  <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-0.5 rounded bg-slate-900 text-white font-mono text-xs font-bold tracking-wide shadow-2xs">
                          {vehicle.plateNumber}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500 font-semibold">
                          {vehicle.code}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm mt-1.5">
                        {vehicle.model}
                      </h4>
                      <p className="text-xs text-slate-600 font-medium flex items-center mt-0.5">
                        <MapPin className="w-3 h-3 mr-1 text-emerald-600" />
                        {vehicle.stationBase}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      {getStatusBadge(vehicle.status)}
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleOpenEdit(vehicle)}
                          className={`p-1 rounded transition ${
                            isFleetManager
                              ? "text-slate-500 hover:text-emerald-700 hover:bg-emerald-50"
                              : "text-slate-400 hover:text-amber-700 hover:bg-amber-50"
                          }`}
                          title={isFleetManager ? "Edit vehicle details" : "Car info update must be done by Fleet Manager only"}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(vehicle)}
                          className={`p-1 rounded transition ${
                            isFleetManager
                              ? "text-slate-400 hover:text-red-700 hover:bg-red-50"
                              : "text-slate-400 hover:text-amber-700 hover:bg-amber-50"
                          }`}
                          title={isFleetManager ? "Delete vehicle" : "Vehicle deletion restricted to Fleet Manager"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 space-y-3.5 text-xs">
                    {/* Driver info */}
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                          {vehicle.assignedDriverName ? vehicle.assignedDriverName[0] : "D"}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">
                            {vehicle.assignedDriverName || "Station Pool Driver"}
                          </div>
                          <div className="text-slate-500 text-[11px] flex items-center">
                            <Phone className="w-3 h-3 mr-1 text-slate-400" />
                            {vehicle.driverPhone || "+251 911 000 000"}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-medium">
                        Driver
                      </span>
                    </div>

                    {/* Fuel & Odometer row */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50">
                        <div className="flex items-center justify-between text-slate-500 mb-1">
                          <span className="flex items-center"><Fuel className="w-3.5 h-3.5 mr-1 text-slate-500" /> Fuel Level</span>
                          <span className="font-bold text-slate-700">{fuelPercent}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full ${
                              fuelPercent > 50 ? "bg-emerald-500" : fuelPercent > 25 ? "bg-amber-500" : "bg-red-500"
                            }`}
                            style={{ width: `${fuelPercent}%` }}
                          ></div>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
                          <span>{vehicle.currentFuelLevel}L</span>
                          <span>Cap: {vehicle.fuelTankCapacity}L</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50">
                        <div className="flex items-center text-slate-500 mb-0.5">
                          <Gauge className="w-3.5 h-3.5 mr-1 text-slate-500" />
                          <span>Odometer</span>
                        </div>
                        <div className="font-mono text-sm font-bold text-slate-800">
                          {vehicle.odometerKm.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">km</span>
                        </div>
                        <div className={`text-[10px] mt-1 flex items-center font-medium ${isServiceDueSoon ? 'text-amber-700' : 'text-slate-500'}`}>
                          {isServiceDueSoon && <AlertCircle className="w-3 h-3 mr-0.5 text-amber-600 inline" />}
                          Svc in {serviceDueKm.toLocaleString()} km
                        </div>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="flex flex-wrap gap-1.5">
                      {vehicle.features.map((feat, idx) => (
                        <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-100 font-medium">
                          {feat}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                  {vehicle.status === "Available" ? (
                    <button
                      onClick={() => handleBooking(vehicle)}
                      className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition shadow-2xs"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-300" />
                      <span>Book For Field Mission</span>
                    </button>
                  ) : (
                    <div className="w-full flex items-center justify-between text-xs">
                      <span className="text-slate-500 italic">
                        {vehicle.status === "On Mission" ? "In field service" : "In workshop"}
                      </span>
                      <button
                        onClick={() => setQuickEditVehicle(vehicle)}
                        className="text-xs text-emerald-700 hover:underline font-semibold"
                      >
                        Update Status
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DRIVERS & CREW ROSTER VIEW */}
      {viewMode === "drivers" && (
        <div className="space-y-4">
          <div className="bg-emerald-950 text-white rounded-xl p-4 border border-emerald-800/60 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-lg bg-emerald-800 text-emerald-300">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <span>Institutional Driver & Field Crew Directory</span>
                  <span className="bg-emerald-800 text-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {safeDrivers.length} Active Operators
                  </span>
                </h3>
                <p className="text-xs text-emerald-200/80 mt-0.5">
                  Real-time driver credentials, emergency phones, station base assignments, and Telegram notification routing (@cariqqobot).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="https://t.me/cariqqobot"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Open Bot Channel</span>
                <ExternalLink className="w-3 h-3 text-sky-200" />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDrivers.map((driver) => {
              const assignedVehicle = safeVehicles.find(
                v => v.assignedDriverName?.toLowerCase() === driver.name.toLowerCase() ||
                     v.plateNumber === driver.assignedVehiclePlate
              );

              return (
                <div
                  key={driver.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col justify-between space-y-3 hover:border-emerald-300 transition"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm border border-emerald-200">
                          {driver.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                            <span>{driver.name}</span>
                            <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-bold border border-amber-200 flex items-center gap-0.5">
                              <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                              {driver.rating || 4.8}
                            </span>
                          </h4>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{driver.stationBase}</span>
                          </div>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        driver.status === "Active / Available" ? "bg-emerald-100 text-emerald-800 border border-emerald-200" :
                        driver.status === "On Trip" ? "bg-blue-100 text-blue-800 border border-blue-200" :
                        "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}>
                        {driver.status}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 flex items-center gap-1 text-[11px]">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>Phone / SMS:</span>
                        </span>
                        <a href={`tel:${driver.phone}`} className="font-mono font-semibold text-slate-800 hover:text-emerald-700">
                          {driver.phone}
                        </a>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 flex items-center gap-1 text-[11px]">
                          <SendHorizontal className="w-3 h-3 text-sky-500" />
                          <span>Telegram Bot:</span>
                        </span>
                        <span className="font-mono text-sky-700 font-semibold text-[11px]">
                          {driver.telegramHandle || `@${driver.name.toLowerCase().replace(/\s+/g, '_')}`}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 flex items-center gap-1 text-[11px]">
                          <Award className="w-3 h-3 text-slate-400" />
                          <span>Driving License:</span>
                        </span>
                        <span className="font-mono font-semibold text-slate-700 text-[11px]">
                          {driver.licenseNumber}
                        </span>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-200/60 pt-1.5">
                        <span className="text-slate-500 flex items-center gap-1 text-[11px]">
                          <Car className="w-3 h-3 text-emerald-600" />
                          <span>Assigned Vehicle:</span>
                        </span>
                        <span className="font-mono font-bold text-emerald-800 text-[11px]">
                          {assignedVehicle ? `${assignedVehicle.plateNumber} (${assignedVehicle.model.split(' ')[0]})` : (driver.assignedVehiclePlate || "Pool Car")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="text-[11px] text-slate-500">
                      <strong>{driver.experienceYears || 5}+ yrs</strong> driving exp.
                    </span>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleOpenEditDriver(driver)}
                        className={`p-1.5 rounded-md transition ${
                          isFleetManager
                            ? "text-slate-600 hover:text-emerald-700 hover:bg-emerald-50"
                            : "text-slate-400 hover:text-amber-700 hover:bg-amber-50"
                        }`}
                        title={isFleetManager ? "Edit Driver Credentials & Phone" : "Driver info update must be done by Fleet Manager only"}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenDeleteDriver(driver)}
                        className={`p-1.5 rounded-md transition ${
                          isFleetManager
                            ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            : "text-slate-400 hover:text-amber-700 hover:bg-amber-50"
                        }`}
                        title={isFleetManager ? "Remove Driver" : "Driver removal restricted to Fleet Manager"}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredDrivers.length === 0 && (
            <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="text-base font-bold text-slate-700">No Drivers Found</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Try searching with a different driver name, station base, or phone number.
              </p>
            </div>
          )}
        </div>
      )}

      {filteredVehicles.length === 0 && viewMode !== "drivers" && (
        <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
          <Car className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-700">No vehicles match your search filters</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            Try adjusting your search criteria, research station base, or availability filter.
          </p>
        </div>
      )}

      {/* FULL EDIT VEHICLE INFORMATION MODAL */}
      {editingVehicle && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <Pencil className="w-5 h-5 text-emerald-700" />
                  <span>Edit Vehicle Information: {editingVehicle.plateNumber}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update registration details, station base assignment, driver, fuel capacity, and service logs.
                </p>
              </div>
              <button 
                onClick={() => setEditingVehicle(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-4 text-xs">
              {/* Section 1: Identification & Base */}
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100 space-y-3">
                <h5 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-emerald-700" />
                  <span>1. Vehicle Identity & Classification</span>
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Plate Number *</label>
                    <input
                      type="text"
                      required
                      value={editFormData.plateNumber || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, plateNumber: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-900 font-mono font-bold bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Vehicle Code</label>
                    <input
                      type="text"
                      value={editFormData.code || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, code: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-800 font-mono bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Manufacturing Year</label>
                    <input
                      type="number"
                      value={editFormData.year || 2024}
                      onChange={(e) => setEditFormData({ ...editFormData, year: Number(e.target.value) })}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-800 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Vehicle Model / Make *</label>
                    <input
                      type="text"
                      required
                      value={editFormData.model || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, model: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-800 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Vehicle Class</label>
                    <select
                      value={editFormData.type || "4WD Pickup"}
                      onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value as any })}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-800 bg-white"
                    >
                      <option value="4WD Pickup">4WD Pickup (Hilux / D-Max)</option>
                      <option value="Land Cruiser Hardtop">Land Cruiser Hardtop (HZJ79/78)</option>
                      <option value="SUV / Prado">SUV / Prado</option>
                      <option value="Minibus / Crew">Minibus / Crew Transporter</option>
                      <option value="Agri-Truck">Heavy Agri-Truck</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Base Station & Driver */}
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100 space-y-3">
                <h5 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                  <span>2. Station Base & Driver Assignment</span>
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Station Base *</label>
                    <select
                      value={editFormData.stationBase || "OARI Headquarter"}
                      onChange={(e) => setEditFormData({ ...editFormData, stationBase: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-800 bg-white"
                    >
                      {OARI_CENTERS.map((c) => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Assigned Driver</label>
                    <select
                      value={editFormData.assignedDriverName || "Station Pool Driver"}
                      onChange={(e) => {
                        const sel = e.target.value;
                        const found = safeDrivers.find(d => d.name === sel);
                        setEditFormData({
                          ...editFormData,
                          assignedDriverName: sel,
                          assignedDriverId: found?.id,
                          driverPhone: found?.phone || editFormData.driverPhone || "+251 911 000 000"
                        });
                      }}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-800 bg-white"
                    >
                      <option value="Station Pool Driver">Station Pool Driver (Unassigned)</option>
                      {safeDrivers.map((d) => (
                        <option key={d.id} value={d.name}>{d.name} ({d.stationBase})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Driver Phone (+251)</label>
                    <input
                      type="text"
                      placeholder="+251 911 000 000"
                      value={editFormData.driverPhone || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, driverPhone: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-800 font-mono bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Status, Fuel, Mileage */}
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100 space-y-3">
                <h5 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-emerald-700" />
                  <span>3. Status, Telemetry & Fuel</span>
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Status</label>
                    <select
                      value={editFormData.status || "Available"}
                      onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as any })}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-800 bg-white font-semibold"
                    >
                      <option value="Available">Available</option>
                      <option value="On Mission">On Mission</option>
                      <option value="In Maintenance">In Maintenance</option>
                      <option value="Reserved">Reserved</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Odometer (km)</label>
                    <input
                      type="number"
                      value={editFormData.odometerKm || 0}
                      onChange={(e) => setEditFormData({ ...editFormData, odometerKm: Number(e.target.value) })}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-800 font-mono font-bold bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Fuel Tank (L)</label>
                    <input
                      type="number"
                      value={editFormData.fuelTankCapacity || 80}
                      onChange={(e) => setEditFormData({ ...editFormData, fuelTankCapacity: Number(e.target.value) })}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-800 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Current Fuel (L)</label>
                    <input
                      type="number"
                      max={editFormData.fuelTankCapacity || 80}
                      value={editFormData.currentFuelLevel || 0}
                      onChange={(e) => setEditFormData({ ...editFormData, currentFuelLevel: Number(e.target.value) })}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-800 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Next Scheduled Service (km)</label>
                    <input
                      type="number"
                      value={editFormData.nextServiceKm || (editFormData.odometerKm ? editFormData.odometerKm + 5000 : 25000)}
                      onChange={(e) => setEditFormData({ ...editFormData, nextServiceKm: Number(e.target.value) })}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-800 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Last Service Date</label>
                    <input
                      type="date"
                      value={editFormData.lastServiceDate || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, lastServiceDate: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-800 bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingVehicle(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Vehicle Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE VEHICLE CONFIRMATION MODAL */}
      {deletingVehicle && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-700 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 text-center">
              Delete Vehicle from Fleet?
            </h3>
            <p className="text-xs text-slate-500 text-center mt-1">
              Are you sure you want to remove <span className="font-bold font-mono text-slate-800">{deletingVehicle.plateNumber}</span> ({deletingVehicle.model}) from the active OARI registry?
            </p>

            <div className="my-4 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Station Base:</span>
                <span className="font-semibold text-slate-800">{deletingVehicle.stationBase}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Driver:</span>
                <span className="font-semibold text-slate-800">{deletingVehicle.assignedDriverName || "None"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Odometer:</span>
                <span className="font-semibold font-mono text-slate-800">{deletingVehicle.odometerKm.toLocaleString()} km</span>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingVehicle(null)}
                className="flex-1 px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 inline-flex items-center justify-center space-x-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-xs"
              >
                <Trash2 className="w-4 h-4" />
                <span>Yes, Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK EDIT STATUS MODAL */}
      {quickEditVehicle && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-emerald-700" />
              <span>Update Fleet Status: {quickEditVehicle.plateNumber}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {quickEditVehicle.model} • {quickEditVehicle.stationBase}
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as any;
                if (onUpdateVehicleStatus) {
                  onUpdateVehicleStatus(quickEditVehicle.id, {
                    status: form.status.value,
                    odometerKm: Number(form.odometer.value),
                    currentFuelLevel: Number(form.fuel.value)
                  });
                }
                setQuickEditVehicle(null);
              }}
              className="mt-4 space-y-3.5 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Operational Status</label>
                <select
                  name="status"
                  defaultValue={quickEditVehicle.status}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-800 bg-white"
                >
                  <option value="Available">Available (Ready for Mission)</option>
                  <option value="On Mission">On Mission (In Field)</option>
                  <option value="In Maintenance">In Maintenance (Workshop)</option>
                  <option value="Reserved">Reserved</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Current Odometer (km)</label>
                  <input
                    type="number"
                    name="odometer"
                    defaultValue={quickEditVehicle.odometerKm}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-800 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fuel Level (Liters)</label>
                  <input
                    type="number"
                    name="fuel"
                    max={quickEditVehicle.fuelTankCapacity}
                    defaultValue={quickEditVehicle.currentFuelLevel}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-800 bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setQuickEditVehicle(null)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold shadow-xs"
                >
                  Save Updates
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STEP 1: REGISTER CAR ONLY MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider mb-1">
                  Step 1 of 2
                </div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <Car className="w-5 h-5 text-emerald-700" />
                  <span>Register Car into OARI Fleet</span>
                </h3>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-emerald-50/80 border border-emerald-200 rounded-lg p-3 my-3 text-xs text-emerald-900">
              <p className="font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>Vehicle Specification Registration</span>
              </p>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                Register car specifications, station base, and odometer. You can leave driver unassigned and assign a driver profile in <strong>Step 2</strong>.
              </p>
            </div>

            <form onSubmit={handleCreateVehicle} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Plate Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., 4-45210 ET"
                    value={newPlate}
                    onChange={(e) => setNewPlate(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-800 font-mono font-bold bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Vehicle Model *</label>
                  <input
                    type="text"
                    required
                    placeholder="Toyota Hilux 2.8 GD-6 4x4"
                    value={newModel}
                    onChange={(e) => setNewModel(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-800 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Vehicle Class</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as Vehicle["type"])}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-800 bg-white"
                  >
                    <option value="4WD Pickup">4WD Pickup (Hilux / D-Max)</option>
                    <option value="Land Cruiser Hardtop">Land Cruiser Hardtop (HZJ79/78)</option>
                    <option value="SUV / Prado">SUV / Prado</option>
                    <option value="Minibus / Crew">Minibus / Crew Transporter</option>
                    <option value="Agri-Truck">Agri-Truck</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Station Base *</label>
                  <select
                    value={newStation}
                    onChange={(e) => setNewStation(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-800 bg-white"
                  >
                    {OARI_CENTERS.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Model Year</label>
                  <input
                    type="number"
                    value={newYear}
                    onChange={(e) => setNewYear(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-800 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assign Driver (Optional)</label>
                  <select
                    value={newDriver}
                    onChange={(e) => {
                      const sel = e.target.value;
                      setNewDriver(sel);
                      const found = safeDrivers.find(d => d.name === sel);
                      if (found) setNewDriverPhone(found.phone);
                    }}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-800 bg-white"
                  >
                    <option value="Unassigned / Pool Driver">Unassigned / Pool Driver</option>
                    {safeDrivers.map((d) => (
                      <option key={d.id} value={d.name}>{d.name} ({d.stationBase})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fuel Tank Capacity (L)</label>
                  <input
                    type="number"
                    value={newFuelCap}
                    onChange={(e) => setNewFuelCap(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-800 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Initial Odometer (km)</label>
                  <input
                    type="number"
                    value={newOdometer}
                    onChange={(e) => setNewOdometer(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-800 bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold shadow-xs"
                >
                  <Car className="w-4 h-4" />
                  <span>Register Car Spec</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT DRIVER MODAL */}
      {editingDriver && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <Pencil className="w-5 h-5 text-emerald-700" />
                  <span>Edit Driver Profile: {editingDriver.name}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update driver credentials, license, phone, and assign to any registered car in the OARI fleet.
                </p>
              </div>
              <button 
                onClick={() => setEditingDriver(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDriverEdit} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Driver Full Name *</label>
                  <input
                    type="text"
                    required
                    value={driverFormData.name || ""}
                    onChange={(e) => setDriverFormData({ ...driverFormData, name: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-900 font-semibold bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number (SMS) *</label>
                  <input
                    type="text"
                    required
                    value={driverFormData.phone || ""}
                    onChange={(e) => setDriverFormData({ ...driverFormData, phone: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-900 font-mono font-bold bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Telegram Handle (@)</label>
                  <input
                    type="text"
                    value={driverFormData.telegramHandle || ""}
                    onChange={(e) => setDriverFormData({ ...driverFormData, telegramHandle: e.target.value })}
                    placeholder="@driver_oari"
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sky-800 font-mono bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Driving License No. *</label>
                  <input
                    type="text"
                    required
                    value={driverFormData.licenseNumber || ""}
                    onChange={(e) => setDriverFormData({ ...driverFormData, licenseNumber: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-900 font-mono bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Station Base *</label>
                  <select
                    value={driverFormData.stationBase || "OARI Headquarter"}
                    onChange={(e) => setDriverFormData({ ...driverFormData, stationBase: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-800 bg-white"
                  >
                    {OARI_CENTERS.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Duty Status</label>
                  <select
                    value={driverFormData.status || "Active / Available"}
                    onChange={(e) => setDriverFormData({ ...driverFormData, status: e.target.value as any })}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-800 bg-white font-semibold"
                  >
                    <option value="Active / Available">Active / Available</option>
                    <option value="On Trip">On Trip (In Field)</option>
                    <option value="On Leave">On Leave</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Experience (Years)</label>
                  <input
                    type="number"
                    value={driverFormData.experienceYears || 5}
                    onChange={(e) => setDriverFormData({ ...driverFormData, experienceYears: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-800 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assign to Registered Car</label>
                  <select
                    value={driverFormData.assignedVehiclePlate || "Unassigned / Pool Car"}
                    onChange={(e) => {
                      const plate = e.target.value;
                      const car = safeVehicles.find(v => v.plateNumber === plate);
                      setDriverFormData({
                        ...driverFormData,
                        assignedVehiclePlate: plate,
                        assignedVehicleId: car?.id
                      });
                    }}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-800 font-mono font-medium bg-white"
                  >
                    <option value="Unassigned / Pool Car">Unassigned / Pool Car</option>
                    {safeVehicles.map((v) => (
                      <option key={v.id} value={v.plateNumber}>
                        {v.plateNumber} — {v.model} ({v.stationBase})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingDriver(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Driver Profile</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STEP 2: REGISTER NEW DRIVER MODAL */}
      {showAddDriverModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold uppercase tracking-wider mb-1">
                  Step 2 of 2
                </div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-teal-700" />
                  <span>Register Driver Profile & Assign to Car</span>
                </h3>
              </div>
              <button 
                onClick={() => setShowAddDriverModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-teal-50/80 border border-teal-200 rounded-lg p-3 my-3 text-xs text-teal-900">
              <p className="font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                <span>Driver Profile & Car Assignment</span>
              </p>
              <p className="text-[11px] text-teal-800 mt-0.5">
                Register driver credentials and assign the driver directly to one of the registered fleet vehicles below.
              </p>
            </div>

            <form onSubmit={handleCreateDriver} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Driver Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tolera Bekele"
                    value={newDriverName}
                    onChange={(e) => setNewDriverName(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-800 font-semibold bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number (+251) *</label>
                  <input
                    type="text"
                    required
                    placeholder="+251 911 345 678"
                    value={newDriverPhoneInput}
                    onChange={(e) => setNewDriverPhoneInput(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-800 font-mono font-bold bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Driving License Number</label>
                  <input
                    type="text"
                    placeholder="OR-DL-88210"
                    value={newDriverLicense}
                    onChange={(e) => setNewDriverLicense(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-800 font-mono bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Telegram Username (@)</label>
                  <input
                    type="text"
                    placeholder="@tolera_oari"
                    value={newDriverTelegram}
                    onChange={(e) => setNewDriverTelegram(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sky-800 font-mono bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Station Base *</label>
                  <select
                    value={newDriverStation}
                    onChange={(e) => setNewDriverStation(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-800 bg-white"
                  >
                    {OARI_CENTERS.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Duty Status</label>
                  <select
                    value={newDriverStatus}
                    onChange={(e) => setNewDriverStatus(e.target.value as any)}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-800 bg-white font-semibold"
                  >
                    <option value="Active / Available">Active / Available</option>
                    <option value="On Trip">On Trip (In Field)</option>
                    <option value="On Leave">On Leave</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Experience (Years)</label>
                  <input
                    type="number"
                    value={newDriverExp}
                    onChange={(e) => setNewDriverExp(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-800 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assign to Registered Car</label>
                  <select
                    value={newDriverAssignedCar}
                    onChange={(e) => setNewDriverAssignedCar(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-800 font-mono font-medium bg-white"
                  >
                    <option value="Unassigned / Pool Car">Unassigned / Pool Car</option>
                    {safeVehicles.map((v) => (
                      <option key={v.id} value={v.plateNumber}>
                        {v.plateNumber} — {v.model} ({v.stationBase})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddDriverModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-lg bg-teal-800 hover:bg-teal-900 text-white font-semibold shadow-xs"
                >
                  <User className="w-4 h-4" />
                  <span>Save Driver Profile</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE DRIVER MODAL */}
      {deletingDriver && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 text-center">
              Remove Driver from Directory?
            </h3>
            <p className="text-xs text-slate-500 text-center mt-1">
              Are you sure you want to delete <span className="font-bold text-slate-800">{deletingDriver.name}</span> ({deletingDriver.phone}) from OARI registry?
            </p>

            <div className="flex justify-end space-x-2 pt-4">
              <button
                type="button"
                onClick={() => setDeletingDriver(null)}
                className="flex-1 px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteDriver}
                className="flex-1 inline-flex items-center justify-center space-x-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-xs"
              >
                <Trash2 className="w-4 h-4" />
                <span>Yes, Remove</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
