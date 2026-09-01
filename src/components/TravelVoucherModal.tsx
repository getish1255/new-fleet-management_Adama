import React, { useState, useRef } from "react";
import { 
  Printer, 
  Download,
  X, 
  ShieldCheck, 
  MapPin, 
  Calendar, 
  User, 
  Car, 
  Fuel, 
  CheckCircle2, 
  QrCode, 
  Award, 
  Check,
  FileDown,
  Loader2
} from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { TripRequest, TravelLog, InstitutionalOfficer } from "../types";

interface TravelVoucherModalProps {
  request: TripRequest | null;
  travelLog?: TravelLog | null;
  officers?: InstitutionalOfficer[];
  onClose: () => void;
}

export const TravelVoucherModal: React.FC<TravelVoucherModalProps> = ({
  request,
  travelLog,
  officers = [],
  onClose
}) => {
  const voucherRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);

  if (!request) return null;

  const voucherNo = travelLog?.voucherNumber || `OARI-TRV-${request.requestNumber.replace("OARI-REQ-", "")}`;
  const logNo = travelLog?.logNumber || `LOG-${request.requestNumber.replace("OARI-REQ-", "")}`;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!voucherRef.current) return;
    setIsGeneratingPdf(true);
    setPdfSuccess(false);

    try {
      // Create canvas from voucher element
      const element = voucherRef.current;
      const canvas = await html2canvas(element, {
        scale: 2, // High resolution for crisp printing
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff"
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`OARI_Travel_Voucher_${voucherNo}.pdf`);

      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 3500);
    } catch (err) {
      console.error("PDF generation failed:", err);
      // Fallback print
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Resolve designated Director & Fleet Manager
  const activeDirector = officers.find(o => o.roleType === "Director" && o.isPrimaryForRole) || 
    officers.find(o => o.roleType === "Director") || {
      fullName: "Dr. Gemechu Keneni",
      officialTitle: "Director of Crops & Horticulture Research",
      department: request.department || "Crops & Horticulture Research Directorate",
      signatureSealText: "SEAL-OARI-DIR-CROPS-01"
    };

  const activeFleetManager = officers.find(o => o.roleType === "Fleet Manager" && o.isPrimaryForRole) || 
    officers.find(o => o.roleType === "Fleet Manager") || {
      fullName: "Eng. Wondimu Bedada",
      officialTitle: "Chief Transport & Fleet Logistics Officer",
      department: "Institutional Transport & Logistics Directorate",
      signatureSealText: "SEAL-OARI-FLT-SUP-01"
    };

  const directorName = request.directorApprovedBy || `${activeDirector.fullName} (${activeDirector.officialTitle})`;
  const fleetManagerName = request.fleetManagerApprovedBy || request.approvedBy || `${activeFleetManager.fullName} (${activeFleetManager.officialTitle})`;

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-300 my-8 space-y-6 text-slate-800 printable-voucher">
        {/* Modal Top Actions (Hidden on Print) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3 no-print">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Official 2-Stage Verified Travel Voucher</span>
            </span>
            <span className="text-xs text-slate-500 font-mono">#{voucherNo}</span>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* Download PDF Button */}
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition shadow-xs ${
                pdfSuccess 
                  ? "bg-emerald-600 text-white" 
                  : "bg-indigo-600 hover:bg-indigo-700 text-white"
              } disabled:opacity-50`}
              title="Download official voucher as a high-resolution PDF document"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : pdfSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>PDF Downloaded!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </>
              )}
            </button>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-xs transition"
              title="Print official permit and voucher using browser print dialog"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Voucher</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PRINTABLE VOUCHER DOCUMENT WRAPPER */}
        <div ref={voucherRef} className="bg-white p-3 sm:p-4 space-y-6 text-slate-800">
          {/* OFFICIAL INSTITUTIONAL HEADER WITH IQQO LOGO */}
          <div className="border-b-2 border-emerald-900 pb-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-16 h-16 bg-white p-1 rounded-lg border border-emerald-700/40 shadow-sm flex items-center justify-center shrink-0">
                <img
                  src="https://iqqo.gov.et/sites/default/files/logo200.jpg"
                  alt="IQQO Logo"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              <div className="text-left space-y-0.5">
                <div className="text-[10px] font-bold text-emerald-800 tracking-wider uppercase">
                  National Regional Government of Oromia
                </div>
                <h1 className="text-sm sm:text-base font-black text-slate-950 uppercase tracking-tight">
                  Oromia Agricultural Research Institute (OARI)
                </h1>
                <div className="text-xs font-bold text-emerald-900">
                  Inistiitiyuutii Qorannoo Qonnaa Oromiyaa (IQQO)
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  Agricultural Research Fleet Logistics & Field Transport Operations Directorate
                </div>
              </div>
            </div>

            <div className="text-right sm:border-l sm:border-emerald-200 sm:pl-4">
              <div className="inline-block bg-emerald-50 border border-emerald-300 rounded px-2.5 py-1 text-center">
                <div className="text-[9px] font-bold text-emerald-900 uppercase tracking-wider">Official Field Document</div>
                <div className="text-xs font-black text-emerald-950 uppercase">Travel Voucher</div>
              </div>
              <div className="text-[10px] font-mono text-slate-600 mt-1 font-bold">
                DOC: {voucherNo}
              </div>
            </div>
          </div>

          {/* Voucher Meta Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
            <div>
              <div className="text-slate-500 text-[10px] uppercase font-bold">Voucher No.</div>
              <div className="font-mono font-bold text-slate-900">{voucherNo}</div>
            </div>
            <div>
              <div className="text-slate-500 text-[10px] uppercase font-bold">Log Record</div>
              <div className="font-mono font-bold text-slate-900">{logNo}</div>
            </div>
            <div>
              <div className="text-slate-500 text-[10px] uppercase font-bold">Issued Date</div>
              <div className="font-semibold text-slate-900">{new Date(request.createdAt).toLocaleDateString()}</div>
            </div>
            <div>
              <div className="text-slate-500 text-[10px] uppercase font-bold">Status</div>
              <div className="font-bold text-emerald-700 uppercase flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" />
                <span>Authorized & Dispatched</span>
              </div>
            </div>
          </div>

          {/* SECTION 1: RESEARCHER & DEPARTMENTAL PROFILE */}
          <div className="space-y-2 text-xs">
            <div className="font-bold text-slate-900 border-b border-slate-200 pb-1 flex items-center justify-between">
              <span>1. Lead Researcher & Research Directorate</span>
              <span className="text-slate-500 text-[11px] font-normal">Base Station: {request.stationBase}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-slate-500">Principal Requester: </span>
                <span className="font-bold text-slate-900">{request.requesterName}</span>
                <div className="text-slate-600 text-[11px]">{request.requesterTitle}</div>
              </div>
              <div>
                <span className="text-slate-500">Directorate: </span>
                <span className="font-semibold text-slate-900">{request.department}</span>
                <div className="text-slate-600 text-[11px]">Phone: {request.requesterPhone} • Telegram: {request.requesterTelegram || "Active"}</div>
              </div>
            </div>
          </div>

          {/* MANDATED 2-STAGE INSTITUTIONAL APPROVAL BREAKDOWN */}
          <div className="space-y-2 text-xs">
            <div className="font-bold text-slate-900 border-b border-slate-200 pb-1 flex items-center justify-between">
              <span>2. Institutional Governance & 2-Stage Authorization Record</span>
              <span className="text-emerald-700 text-[10px] uppercase font-bold">Verified Audit Trail</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Stage 1 Endorsement Record */}
              <div className="bg-amber-50/70 p-3 rounded-lg border border-amber-200/80">
                <div className="text-[10px] font-bold uppercase text-amber-900 flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 bg-amber-200 rounded text-amber-950 font-black">Stage 1</span>
                  <span>Immediate Director / Supervisor Endorsement</span>
                </div>
                <div className="font-bold text-slate-900 text-sm mt-1">{directorName}</div>
                <div className="text-slate-600 text-[11px] mt-0.5">
                  Status: <strong className="text-amber-900">Permitted & Endorsed</strong>
                </div>
                {request.directorNotes && (
                  <div className="text-slate-500 text-[10px] italic mt-1 bg-white/70 p-1.5 rounded border border-amber-200">
                    &ldquo;{request.directorNotes}&rdquo;
                  </div>
                )}
              </div>

              {/* Stage 2 Fleet Authorization Record */}
              <div className="bg-emerald-50/70 p-3 rounded-lg border border-emerald-200/80">
                <div className="text-[10px] font-bold uppercase text-emerald-900 flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 bg-emerald-200 rounded text-emerald-950 font-black">Stage 2</span>
                  <span>Fleet Manager Vehicle & Driver Authorization</span>
                </div>
                <div className="font-bold text-slate-900 text-sm mt-1">{fleetManagerName}</div>
                <div className="text-slate-600 text-[11px] mt-0.5 flex items-center justify-between">
                  <span>Status: <strong className="text-emerald-900">Authorized for Dispatch</strong></span>
                  <span className="font-mono text-[10px] text-slate-500">{activeFleetManager.signatureSealText || "SEAL-OARI-FLT-01"}</span>
                </div>
                <div className="text-slate-500 text-[10px] italic mt-1 bg-white/70 p-1.5 rounded border border-emerald-200">
                  Multi-channel notifications delivered via Telegram Bot (@cariqqobot) & Ethio Telecom SMS.
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: ROUTE, ITINERARY & PURPOSE */}
          <div className="space-y-2 text-xs">
            <div className="font-bold text-slate-900 border-b border-slate-200 pb-1">
              3. Field Mission Itinerary & Objectives
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-slate-500">Authorized Route: </span>
                <span className="font-bold text-emerald-900">{request.origin} ➔ {request.destination}</span>
                {request.waypoints && request.waypoints.length > 0 && (
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    Intermediate Stops: {request.waypoints.join(", ")}
                  </div>
                )}
              </div>

              <div>
                <span className="text-slate-500">Mission Purpose: </span>
                <span className="font-bold text-slate-900">{request.purpose}</span>
              </div>

              <div>
                <span className="text-slate-500">Departure: </span>
                <span className="font-semibold text-slate-900">{new Date(request.departureDate).toLocaleString()}</span>
              </div>

              <div>
                <span className="text-slate-500">Estimated Return: </span>
                <span className="font-semibold text-slate-900">{new Date(request.returnDate).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* SECTION 4: ASSIGNED VEHICLE, DRIVER & FUEL ALLOCATION */}
          <div className="space-y-2 text-xs">
            <div className="font-bold text-slate-900 border-b border-slate-200 pb-1">
              4. Vehicle, Driver & Resource Allocation
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <div className="text-slate-500 text-[10px] uppercase font-bold">Assigned Vehicle</div>
                <div className="font-mono font-bold text-emerald-950 text-sm mt-0.5">
                  {request.assignedVehiclePlate || "4-11892 ET"}
                </div>
                <div className="text-slate-600 text-[11px]">4WD Agricultural Fleet</div>
              </div>

              <div>
                <div className="text-slate-500 text-[10px] uppercase font-bold">Designated Driver</div>
                <div className="font-bold text-slate-900 text-sm mt-0.5">
                  {request.assignedDriverName || "Chala Merga"}
                </div>
                <div className="text-slate-600 text-[11px]">📞 {request.assignedDriverPhone || "+251 911 349 812"}</div>
              </div>

              <div>
                <div className="text-slate-500 text-[10px] uppercase font-bold">Fuel Coupon Allocation</div>
                <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">
                  {travelLog?.fuelIssuedLiters || request.estimatedFuelLiters || 45} Liters
                </div>
                <div className="text-slate-600 text-[11px]">Est. Distance: {request.estimatedKm || 320} km</div>
              </div>
            </div>
          </div>

          {/* SECTION 5: PASSENGERS & CARGO */}
          <div className="space-y-2 text-xs">
            <div className="font-bold text-slate-900 border-b border-slate-200 pb-1">
              5. Passenger Manifest & Equipment Payload
            </div>

            <div className="text-slate-700">
              <span className="font-semibold">Team Members ({request.passengerCount} Persons): </span>
              <span>{request.passengerNames?.join(", ") || request.requesterName}</span>
            </div>

            <div className="text-slate-700">
              <span className="font-semibold">Cargo / Samples ({request.cargoWeightKg} kg): </span>
              <span>{request.cargoDescription || "Research seed packets, soil core samplers, cool boxes."}</span>
            </div>
          </div>

          {/* SECTION 6: OFFICIAL SIGNATURES & INSTITUTIONAL SEALS */}
          <div className="border-t-2 border-slate-900 pt-6 grid grid-cols-4 gap-3 text-center text-xs">
            {/* Column 1: Lead Researcher */}
            <div className="space-y-6">
              <div>
                <div className="font-bold text-slate-900">{request.requesterName}</div>
                <div className="text-[10px] text-slate-500">Lead Researcher / Requester</div>
              </div>
              <div className="border-t border-slate-400 pt-1 text-[10px] text-slate-600">
                Signature & Date
              </div>
            </div>

            {/* Column 2: Endorsing Director */}
            <div className="space-y-6">
              <div>
                <div className="font-bold text-slate-900">{directorName}</div>
                <div className="text-[10px] text-amber-800 font-semibold">Immediate Director Endorsement</div>
              </div>
              <div className="border-t border-slate-400 pt-1 text-[10px] text-slate-600">
                Official Directorate Signature
              </div>
            </div>

            {/* Column 3: Fleet Logistics Manager */}
            <div className="space-y-6">
              <div>
                <div className="font-bold text-slate-900">{fleetManagerName}</div>
                <div className="text-[10px] text-emerald-800 font-semibold">Fleet Logistics Manager (Super Admin)</div>
              </div>
              <div className="border-t border-slate-400 pt-1 text-[10px] text-slate-600">
                Official Seal & Authorization
              </div>
            </div>

            {/* Column 4: Assigned Driver */}
            <div className="space-y-6">
              <div>
                <div className="font-bold text-slate-900">{request.assignedDriverName || "Chala Merga"}</div>
                <div className="text-[10px] text-slate-500">Designated Chauffeur</div>
              </div>
              <div className="border-t border-slate-400 pt-1 text-[10px] text-slate-600">
                Driver Acceptance & Date
              </div>
            </div>
          </div>

          {/* Footer Notice */}
          <div className="bg-slate-100 p-2.5 rounded text-[10px] text-slate-500 text-center font-mono">
            OARI Verified Dispatch • Stage 1 & Stage 2 Multi-Authority Verification • Document ID: {voucherNo} • Ethio Telecom Shortcode: 8844 • Bot: @cariqqobot
          </div>
        </div>
      </div>
    </div>
  );
};
