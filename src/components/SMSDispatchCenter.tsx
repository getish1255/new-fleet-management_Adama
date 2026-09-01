import React, { useState } from "react";
import { 
  MessageSquare, 
  Send, 
  Smartphone, 
  CheckCircle2, 
  Radio, 
  Search, 
  Filter, 
  Phone, 
  User, 
  Clock, 
  Zap, 
  ShieldCheck, 
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  SendHorizontal,
  Mail,
  Bot
} from "lucide-react";
import { SMSAlert, Role, NotificationChannel } from "../types";

interface SMSDispatchCenterProps {
  smsAlerts: SMSAlert[];
  role: Role;
  onSendCustomSMS: (data: { 
    recipientType: SMSAlert["recipientType"]; 
    recipientName: string; 
    recipientPhone: string; 
    message: string; 
    tripRequestNumber?: string;
    channel?: NotificationChannel;
  }) => void;
}

export const SMSDispatchCenter: React.FC<SMSDispatchCenterProps> = ({
  smsAlerts = [],
  role,
  onSendCustomSMS
}) => {
  const safeAlerts = Array.isArray(smsAlerts) ? smsAlerts : [];
  const [activeRecipientFilter, setActiveRecipientFilter] = useState<string>("all");
  const [activeChannelFilter, setActiveChannelFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPhoneView, setSelectedPhoneView] = useState<"customer" | "driver" | "telegram_bot">("telegram_bot");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Custom Alert Form
  const [customChannel, setCustomChannel] = useState<NotificationChannel>("Telegram");
  const [customType, setCustomType] = useState<SMSAlert["recipientType"]>("Customer");
  const [customName, setCustomName] = useState("Dr. Ayantu Tadesse");
  const [customPhone, setCustomPhone] = useState("+251 911 882 341");
  const [customTelegram, setCustomTelegram] = useState("@ayantu_tadesse");
  const [customTripNo, setCustomTripNo] = useState("OARI-DISPATCH-URGENT");
  const [customMsg, setCustomMsg] = useState("Your research trip #OARI-REQ-2026-001 has been authorized. Assigned vehicle: 4-11892 ET with driver Chala Merga (+251 911 456 789).");
  const [showCustomModal, setShowCustomModal] = useState(false);

  const filteredAlerts = safeAlerts.filter(alert => {
    const matchesRecipient = activeRecipientFilter === "all" || alert.recipientType === activeRecipientFilter;
    const matchesChannel = activeChannelFilter === "all" || (alert.channel || "SMS") === activeChannelFilter;
    const matchesSearch = 
      alert.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.recipientPhone.includes(searchTerm) ||
      alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.tripRequestNumber.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRecipient && matchesChannel && matchesSearch;
  });

  const latestCustomerSMS = safeAlerts.find(a => a.recipientType === "Customer");
  const latestDriverSMS = safeAlerts.find(a => a.recipientType === "Driver");
  const latestTelegramAlert = safeAlerts.find(a => a.channel === "Telegram") || safeAlerts[0];

  const handleCopySMS = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPhone || !customMsg) return;
    onSendCustomSMS({
      recipientType: customType,
      recipientName: customName || (customType === "Customer" ? "Research Staff" : "Assigned Driver"),
      recipientPhone: customPhone,
      tripRequestNumber: customTripNo,
      message: customMsg,
      channel: customChannel
    });
    setShowCustomModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Gateway Info Banner */}
      <div className="bg-gradient-to-r from-[#0c2217] via-[#122e20] to-[#1a3828] text-white p-5 rounded-2xl border border-emerald-700/50 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-white p-1 border border-emerald-400/50 flex items-center justify-center flex-shrink-0 shadow-md">
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
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold">IQQO Telegram Bot & SMS Notification Gateway</h2>
              <a
                href="https://t.me/cariqqobot"
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-0.5 rounded-full bg-sky-600/80 hover:bg-sky-500 text-white text-[11px] font-mono border border-sky-400 font-bold flex items-center gap-1 transition"
              >
                <span>Bot: @cariqqobot</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/40 font-semibold">
                EthioTel SMS 8844 Active
              </span>
            </div>
            <p className="text-xs text-emerald-100/85 mt-1 max-w-2xl leading-relaxed">
              Real-time agricultural research mission dispatches, field route updates, driver assignments, and fuel authorizations broadcasted across 17 OARI centers via <strong>@cariqqobot</strong> and SMS.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href="https://t.me/cariqqobot"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-sm transition"
          >
            <Bot className="w-4 h-4" />
            <span>Launch Bot in Telegram</span>
          </a>

          <button
            onClick={() => setShowCustomModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition whitespace-nowrap"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Dispatch Alert</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Layout: Left (Live Alert Logs) vs Right (Interactive Phone Simulator) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Transmission Logs (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>Live Telegram & SMS Broadcast Delivery Stream</span>
              </h3>

              {/* Channel Filter */}
              <div className="flex items-center space-x-1 text-xs">
                <button
                  onClick={() => setActiveChannelFilter("all")}
                  className={`px-2.5 py-1 rounded-md font-semibold transition ${
                    activeChannelFilter === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  All ({safeAlerts.length})
                </button>
                <button
                  onClick={() => setActiveChannelFilter("Telegram")}
                  className={`px-2.5 py-1 rounded-md font-semibold transition flex items-center gap-1 ${
                    activeChannelFilter === "Telegram" ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <SendHorizontal className="w-3 h-3" />
                  <span>Telegram</span>
                </button>
                <button
                  onClick={() => setActiveChannelFilter("SMS")}
                  className={`px-2.5 py-1 rounded-md font-semibold transition flex items-center gap-1 ${
                    activeChannelFilter === "SMS" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <Smartphone className="w-3 h-3" />
                  <span>SMS</span>
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search alerts by requester name, phone, trip ID, or message text..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* List of Messages */}
          <div className="space-y-3">
            {filteredAlerts.length === 0 ? (
              <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
                No notification alerts match your filters.
              </div>
            ) : (
              filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-2 text-xs hover:border-emerald-300 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] flex items-center gap-1 ${
                        (alert.channel || "Telegram") === "Telegram" ? "bg-sky-100 text-sky-800 border border-sky-300" : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      }`}>
                        {(alert.channel || "Telegram") === "Telegram" ? (
                          <>
                            <SendHorizontal className="w-2.5 h-2.5 text-sky-600" />
                            <span>Telegram Bot</span>
                          </>
                        ) : (
                          <>
                            <Smartphone className="w-2.5 h-2.5 text-emerald-600" />
                            <span>SMS Gateway</span>
                          </>
                        )}
                      </span>

                      <span className={`px-2 py-0.5 rounded font-semibold text-[10px] ${
                        alert.recipientType === "Customer" ? "bg-slate-100 text-slate-700" : "bg-amber-100 text-amber-800"
                      }`}>
                        {alert.recipientType}
                      </span>
                      <span className="font-bold text-slate-800">{alert.recipientName}</span>
                      <span className="text-slate-500 font-mono text-[11px]">({alert.recipientPhone})</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="flex items-center text-emerald-600 font-semibold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-0.5" />
                        {alert.status}
                      </span>
                      <button
                        onClick={() => handleCopySMS(alert.id, alert.message)}
                        className="text-slate-400 hover:text-slate-700 p-1"
                        title="Copy message"
                      >
                        {copiedId === alert.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-slate-700 font-mono text-[11px] leading-relaxed whitespace-pre-line">
                    {alert.message}
                  </div>

                  <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-50">
                    <span>Trip: <span className="font-mono font-semibold text-slate-600">{alert.tripRequestNumber}</span></span>
                    <span>Ref: <span className="font-mono">{alert.gatewayRef}</span></span>
                    <span>Sent: {new Date(alert.sentAt).toLocaleTimeString()} ({new Date(alert.sentAt).toLocaleDateString()})</span>
                    <span className="text-emerald-700 font-bold">Cost: 0.00 ETB (Official Institutional Service)</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Interactive Mobile Phone Mockup (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <h3 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-emerald-600" />
              <span>Interactive Recipient Mobile Simulator</span>
            </h3>
            <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs">
              <button
                onClick={() => setSelectedPhoneView("telegram_bot")}
                className={`px-2.5 py-1 rounded-md font-semibold transition flex items-center gap-1 ${
                  selectedPhoneView === "telegram_bot" ? "bg-sky-600 text-white shadow-xs" : "text-slate-600"
                }`}
              >
                <Bot className="w-3 h-3" />
                <span>Telegram</span>
              </button>
              <button
                onClick={() => setSelectedPhoneView("customer")}
                className={`px-2.5 py-1 rounded-md font-semibold transition ${
                  selectedPhoneView === "customer" ? "bg-white text-emerald-800 shadow-xs" : "text-slate-500"
                }`}
              >
                SMS (Staff)
              </button>
              <button
                onClick={() => setSelectedPhoneView("driver")}
                className={`px-2.5 py-1 rounded-md font-semibold transition ${
                  selectedPhoneView === "driver" ? "bg-white text-amber-800 shadow-xs" : "text-slate-500"
                }`}
              >
                SMS (Driver)
              </button>
            </div>
          </div>

          {/* Smartphone Hardware Frame */}
          <div className="max-w-[340px] mx-auto bg-slate-950 p-3 rounded-[36px] shadow-2xl border-[4px] border-slate-800">
            {/* Screen bezel */}
            <div className="bg-slate-900 rounded-[28px] overflow-hidden flex flex-col min-h-[520px] border border-slate-800 text-white">
              {/* Phone Status Bar */}
              <div className="px-5 py-2 flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-800 bg-slate-950/60">
                <span className="font-bold text-white">09:41</span>
                {/* Speaker notch */}
                <div className="w-16 h-3.5 bg-slate-950 rounded-full border border-slate-800 mx-auto"></div>
                <div className="flex items-center space-x-1 font-mono">
                  <span>EthioTel 4G</span>
                  <span className="text-emerald-400">100%</span>
                </div>
              </div>

              {/* Telegram App Header */}
              {selectedPhoneView === "telegram_bot" ? (
                <div className="px-4 py-3 bg-[#17212b] border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                      🤖
                    </div>
                    <div>
                      <div className="font-bold text-xs text-white flex items-center gap-1">
                        <span>OARI Fleet Bot</span>
                        <CheckCircle2 className="w-3 h-3 text-sky-400 inline" />
                      </div>
                      <div className="text-[10px] text-sky-400 font-mono">
                        @cariqqobot • bot
                      </div>
                    </div>
                  </div>

                  <a
                    href="https://t.me/cariqqobot"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] px-2 py-0.5 rounded bg-sky-600 hover:bg-sky-500 text-white font-bold transition flex items-center gap-1"
                  >
                    <span>Open</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              ) : (
                /* SMS App Header */
                <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                      OARI
                    </div>
                    <div>
                      <div className="font-bold text-xs text-white">OARI-TRANSPORT</div>
                      <div className="text-[10px] text-emerald-400 flex items-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1"></span>
                        Verified Shortcode (8844)
                      </div>
                    </div>
                  </div>

                  <div className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {selectedPhoneView === "customer" ? "Staff View" : "Driver View"}
                  </div>
                </div>
              )}

              {/* Message Feed Canvas */}
              <div className="flex-1 p-3.5 space-y-3 overflow-y-auto bg-[#0e1621] text-xs">
                <div className="text-center">
                  <span className="px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-400 text-[10px]">
                    Today • OARI Official Bot & Dispatch Stream
                  </span>
                </div>

                {selectedPhoneView === "telegram_bot" ? (
                  <div className="space-y-3">
                    <div className="bg-[#182533] text-slate-100 p-3 rounded-2xl rounded-tl-xs border border-sky-900/40 text-xs leading-relaxed shadow-sm space-y-1 font-sans">
                      <div className="text-sky-400 font-bold flex items-center gap-1">
                        <span>🚜 OARI FLEET DISPATCH</span>
                      </div>
                      <div className="text-slate-200 whitespace-pre-line text-[11px]">
                        {latestTelegramAlert ? latestTelegramAlert.message : "Trip request permitted by Director and authorized by Fleet Manager. Vehicle and driver assigned."}
                      </div>
                      <div className="text-[9px] text-slate-400 text-right pt-1">
                        Delivered via @cariqqobot • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    <div className="bg-[#182533] p-2.5 rounded-xl text-[10px] text-sky-300 border border-slate-800 flex items-center justify-between">
                      <span>Bot commands: /status, /my_trip, /contact_driver</span>
                    </div>
                  </div>
                ) : selectedPhoneView === "customer" ? (
                  latestCustomerSMS ? (
                    <div className="space-y-1">
                      <div className="bg-emerald-900/40 text-emerald-50 p-3 rounded-2xl rounded-tl-xs border border-emerald-700/50 shadow-xs text-xs leading-relaxed">
                        {latestCustomerSMS.message}
                      </div>
                      <div className="text-[9px] text-slate-500 pl-1">
                        Delivered via Ethio Telecom • Free of charge
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 text-center text-slate-500 text-xs italic">
                      No customer alerts received yet.
                    </div>
                  )
                ) : (
                  latestDriverSMS ? (
                    <div className="space-y-1">
                      <div className="bg-amber-950/50 text-amber-50 p-3 rounded-2xl rounded-tl-xs border border-amber-700/50 shadow-xs text-xs leading-relaxed">
                        {latestDriverSMS.message}
                      </div>
                      <div className="text-[9px] text-slate-500 pl-1">
                        Delivered via Ethio Telecom Dispatch shortcode
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 text-center text-slate-500 text-xs italic">
                      No driver alerts received yet.
                    </div>
                  )
                )}
              </div>

              {/* Bottom Quick Actions */}
              <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-[10px] text-slate-400">Telegram Bot: @cariqqobot</span>
                <a
                  href="https://t.me/cariqqobot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1"
                >
                  <span>Open Telegram</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: CUSTOM ALERT DISPATCH */}
      {showCustomModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-3 text-xs">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Send className="w-4 h-4 text-emerald-600" />
              <span>Dispatch Custom Alert (Telegram & SMS)</span>
            </h3>
            <p className="text-slate-500 text-xs">
              Transmit an instant notification to drivers or researchers via Telegram Bot (@cariqqobot) or SMS.
            </p>

            <form onSubmit={handleSendCustom} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Channel</label>
                  <select
                    value={customChannel}
                    onChange={(e) => setCustomChannel(e.target.value as NotificationChannel)}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Telegram">Telegram Bot (@cariqqobot)</option>
                    <option value="SMS">SMS Gateway</option>
                    <option value="Email">Email Notice</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Recipient Type</label>
                  <select
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value as SMSAlert["recipientType"])}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Customer">Customer / Researcher</option>
                    <option value="Driver">Driver</option>
                    <option value="Director">Director / Supervisor</option>
                    <option value="Fleet Manager">Fleet Manager</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Recipient Name</label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={customPhone}
                    onChange={(e) => setCustomPhone(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Telegram Handle</label>
                  <input
                    type="text"
                    value={customTelegram}
                    onChange={(e) => setCustomTelegram(e.target.value)}
                    placeholder="@username"
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-sky-500 text-sky-700"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Message Body *</label>
                <textarea
                  rows={3}
                  required
                  value={customMsg}
                  onChange={(e) => setCustomMsg(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
                >
                  Dispatch Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
