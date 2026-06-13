import { memo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Loader2, Users, KeyRound, CreditCard, ArrowRight, ShieldAlert, BadgeInfo } from "lucide-react";
import { approveVendor, getPendingVendors } from "@/services/api";
import { toast } from "sonner";
import { queryKeys, QUERY_KEYS } from "@/lib/query-keys";

const API = import.meta.env.VITE_API_URL || "/api";

type Vendor = {
  id: number;
  vendor_name: string;
  company_name: string;
  phone: string;
  email: string;
  address: string;
  state?: string;
  city?: string;
  status?: string;
  approved?: number;
  request_type?: string;
};

interface Props {
  onClose: () => void;
  onVendorActioned: () => void;
}

type ModalTab = "registrations" | "resets" | "bank_updates";

/* ================= LAYERED ICON CONTAINER ================= */
function LayeredIconContainer({
  icon,
  glowColor,
}: {
  icon: React.ReactNode;
  glowColor: string;
}) {
  return (
    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-slate-950/80 backdrop-blur-xl overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
      <div
        className="absolute inset-0 opacity-40 blur-md"
        style={{
          background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`
        }}
      />
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
      <div className="relative text-white z-10">{icon}</div>
    </div>
  );
}

export function VendorRequestsModal({ onClose, onVendorActioned }: Props) {
  const [tab, setTab] = useState<ModalTab>("registrations");
  const queryClient = useQueryClient();

  const { data: rawPendingVendors = [], isLoading: fetchingVendors } = useQuery<Vendor[]>({
    queryKey: queryKeys.pendingVendors(),
    queryFn: getPendingVendors,
  });

  const { data: resetRequests = [], isLoading: fetchingReset } = useQuery<Vendor[]>({
    queryKey: queryKeys.vendorResetRequests(),
    queryFn: async () => {
      const res = await fetch(`${API}/get-vendor-reset-requests.php`);
      const data = await res.json();
      return data.success ? (data.reset_requests || []) : [];
    }
  });

  const { data: bankRequests = [], isLoading: fetchingBank } = useQuery<any[]>({
    queryKey: queryKeys.pendingBankRequests(),
    queryFn: async () => {
      const res = await fetch(`${API}/get-pending-bank-requests.php?status=pending`);
      const data = await res.json();
      return data.success ? (data.requests || []) : [];
    }
  });

  const resetIds = new Set(resetRequests.map((v) => v.id));
  const vendors = rawPendingVendors.filter((v) => !resetIds.has(v.id));

  function removeVendor(id: number) {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PENDING_VENDORS] });
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_VENDORS] });
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_STATS] });
    setTimeout(() => onVendorActioned(), 300);
  }

  function removeReset(id: number) {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.VENDOR_RESET_REQUESTS] });
    setTimeout(() => onVendorActioned(), 300);
  }

  function removeBank(vendorId: number) {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PENDING_BANK_REQUESTS] });
    setTimeout(() => onVendorActioned(), 300);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col rounded-[32px] border border-white/5 bg-gradient-to-b from-[#0a0f1d] to-[#05070a] shadow-[0_30px_70px_rgba(0,0,0,0.8)] overflow-hidden"
      >
        {/* Glow orbs */}
        <div className="absolute -top-12 -left-12 h-40 w-40 rounded-full blur-3xl opacity-15 pointer-events-none bg-emerald-500" />
        <div className="absolute -bottom-12 -right-12 h-40 w-40 rounded-full blur-3xl opacity-15 pointer-events-none bg-primary" />

        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-white/5 px-6 py-5 relative z-10">
          <div className="flex items-center gap-3">
            <LayeredIconContainer
              icon={<Users className="h-5 w-5 text-emerald-400" />}
              glowColor="rgba(16, 185, 129, 0.4)"
            />
            <div>
              <h2 className="text-xl font-black text-white tracking-wide">Vendor Requests</h2>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">
                {vendors.length} Pending · {resetRequests.length} Resets · {bankRequests.length} Bank Updates
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all hover:bg-white/10 active:scale-90 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* TABS (Tactile Pill Segmented) */}
        <div className="flex gap-1.5 rounded-2xl bg-white/[0.02] border border-white/5 mx-6 mt-5 mb-2 p-1.5 relative z-10">
          {[
            { id: "registrations", label: "Registrations", count: vendors.length },
            { id: "resets", label: "Reset Requests", count: resetRequests.length },
            { id: "bank_updates", label: "Bank Updates", count: bankRequests.length },
          ].map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id as ModalTab)}
                className={`flex-1 py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all duration-300 relative cursor-pointer ${
                  active
                    ? "bg-primary text-white shadow-lg shadow-primary/25"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <span className="relative z-10 flex items-center justify-center gap-1.5">
                  {t.label}
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${active ? "bg-white/20 text-white" : "bg-white/5 text-gray-500"}`}>
                    {t.count}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {/* BODY */}
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5 scrollbar-thin relative z-10 min-h-[300px]">
          <AnimatePresence mode="wait">
            {tab === "registrations" && (
              <motion.div
                key="registrations"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {fetchingVendors ? (
                  <Spinner />
                ) : vendors.length === 0 ? (
                  <Empty
                    icon={<Users className="h-10 w-10 text-emerald-400" />}
                    label="No pending vendor registrations"
                    sublabel="Everything is clear! Incoming seller accounts will appear here."
                    glowColor="rgba(16, 185, 129, 0.15)"
                  />
                ) : (
                  vendors.map((vendor) => (
                    <VendorCard key={vendor.id} vendor={vendor} onAction={removeVendor} />
                  ))
                )}
              </motion.div>
            )}

            {tab === "resets" && (
              <motion.div
                key="resets"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {fetchingReset ? (
                  <Spinner />
                ) : resetRequests.length === 0 ? (
                  <Empty
                    icon={<KeyRound className="h-10 w-10 text-amber-400" />}
                    label="No password reset requests"
                    sublabel="No accounts require verification reset credentials currently."
                    glowColor="rgba(245, 158, 11, 0.15)"
                  />
                ) : (
                  resetRequests.map((vendor) => (
                    <ResetRequestCard
                      key={vendor.id}
                      vendor={vendor}
                      onDone={removeReset}
                    />
                  ))
                )}
              </motion.div>
            )}

            {tab === "bank_updates" && (
              <motion.div
                key="bank_updates"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {fetchingBank ? (
                  <Spinner />
                ) : bankRequests.length === 0 ? (
                  <Empty
                    icon={<CreditCard className="h-10 w-10 text-violet-400" />}
                    label="No bank change requests"
                    sublabel="No merchants have filed bank ledger modifications."
                    glowColor="rgba(139, 92, 246, 0.15)"
                  />
                ) : (
                  bankRequests.map((req) => (
                    <BankRequestCard
                      key={req.vendor_id}
                      req={req}
                      onDone={removeBank}
                    />
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

/* ================= REGISTRATION CARD ================= */
const VendorCard = memo(({ vendor, onAction }: { vendor: Vendor; onAction: (id: number) => void }) => {
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const busy = loading !== null;

  async function handleAction(action: "approve" | "reject") {
    try {
      setLoading(action);
      const status = action === "approve" ? "approved" : "rejected";
      const res = await approveVendor(vendor.id, status);
      if (res?.success) {
        toast.success(action === "approve" ? `${vendor.company_name} approved` : `${vendor.company_name} rejected`);
        onAction(vendor.id);
        await new Promise((r) => setTimeout(r, 500));
      } else {
        toast.error(res?.message || "Action failed");
      }
    } catch {
      toast.error("Server error");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="rounded-3xl border border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent p-5 hover:border-white/10 transition-all duration-300">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-extrabold text-white tracking-wide">{vendor.company_name}</h3>
            {vendor.city && vendor.state && (
              <span className="inline-flex items-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-black text-emerald-400">
                📍 {vendor.city}, {vendor.state}
              </span>
            )}
          </div>
          <p className="text-xs font-bold text-primary uppercase tracking-wider">{vendor.vendor_name}</p>
          <div className="text-xs text-gray-400 space-y-0.5">
            <p>✉️ {vendor.email}</p>
            <p>📞 {vendor.phone}</p>
            <p className="text-gray-500 leading-relaxed max-w-md italic mt-1">📍 {vendor.address}</p>
          </div>
        </div>

        <div className="flex sm:flex-col shrink-0 gap-2.5">
          <button
            disabled={busy}
            onClick={() => handleAction("approve")}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white transition shadow-lg shadow-emerald-950/20 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {loading === "approve" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Approve
          </button>
          <button
            disabled={busy}
            onClick={() => handleAction("reject")}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {loading === "reject" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
            Reject
          </button>
        </div>
      </div>
    </div>
  );
});

/* ================= RESET CARD ================= */
const ResetRequestCard = memo(({
  vendor,
  onDone,
}: {
  vendor: Vendor;
  onDone: (id: number) => void;
}) => {
  const [loading, setLoading] = useState<string | null>(null);
  const busy = loading !== null;

  async function handleAction(action: string) {
    try {
      setLoading(action);
      const res = await fetch(`${API}/admin-handle-vendor-reset.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendor_id: vendor.id, action, type: "reset_requested" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Done");
        onDone(vendor.id);
      } else {
        toast.error(data.message || "Action failed");
      }
    } catch {
      toast.error("Server error");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="rounded-3xl border border-amber-500/15 bg-gradient-to-b from-amber-500/[0.03] to-transparent p-5 hover:border-amber-500/30 transition-all duration-300">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-amber-400">
            <KeyRound className="h-3 w-3" />
            Reset Credentials Requested
          </div>
          <h3 className="truncate text-base font-extrabold text-white tracking-wide">{vendor.vendor_name}</h3>
          <div className="text-xs text-gray-400 space-y-0.5">
            <p>✉️ {vendor.email}</p>
            <p>📞 {vendor.phone}</p>
            <p className="text-gray-500 leading-normal mt-2 italic flex items-center gap-1">
              <BadgeInfo className="h-3 w-3 inline text-amber-400" />
              Merchant requested verification override code. Approve to execute reset sequence.
            </p>
          </div>
        </div>

        <div className="flex sm:flex-col shrink-0 gap-2.5">
          <button
            disabled={busy}
            onClick={() => handleAction("approve_reset")}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-xl bg-primary hover:bg-primary-hover px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-lg shadow-primary/15"
          >
            {loading === "approve_reset" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Approve Reset
          </button>
          <button
            disabled={busy}
            onClick={() => handleAction("reject")}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {loading === "reject" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
            Reject
          </button>
        </div>
      </div>
    </div>
  );
});

/* ================= BANK UPDATE CARD ================= */
const BankRequestCard = memo(({
  req,
  onDone,
}: {
  req: any;
  onDone: (vendorId: number) => void;
}) => {
  const [loading, setLoading] = useState<string | null>(null);
  const busy = loading !== null;

  async function handleAction(action: "approve" | "reject") {
    try {
      setLoading(action);
      const res = await fetch(`${API}/admin-approve-bank.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendor_id: req.vendor_id, action }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || `Bank update ${action}d successfully`);
        onDone(req.vendor_id);
      } else {
        toast.error(data.message || "Action failed");
      }
    } catch {
      toast.error("Server error");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="rounded-3xl border border-purple-500/15 bg-gradient-to-b from-purple-500/[0.03] to-transparent p-5 hover:border-purple-500/30 transition-all duration-300 space-y-4">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-white/5 pb-3">
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="inline-flex items-center gap-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-purple-400">
            <CreditCard className="h-3 w-3" />
            Bank Information Update Request
          </div>
          <h3 className="truncate text-base font-extrabold text-white tracking-wide">{req.company_name}</h3>
          <p className="text-xs font-bold text-gray-400">{req.vendor_name} · <span className="text-gray-500">{req.email}</span></p>
        </div>
        
        <div className="flex shrink-0 gap-2.5">
          <button
            disabled={busy}
            onClick={() => handleAction("approve")}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3.5 py-2 text-xs font-extrabold uppercase tracking-wider text-white transition hover:from-emerald-500 hover:to-teal-500 disabled:opacity-60 cursor-pointer active:scale-95"
          >
            {loading === "approve" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Approve
          </button>
          <button
            disabled={busy}
            onClick={() => handleAction("reject")}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1 rounded-xl bg-white/5 border border-white/10 px-3.5 py-2 text-xs font-extrabold uppercase tracking-wider text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition disabled:opacity-60 cursor-pointer active:scale-95"
          >
            {loading === "reject" ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3.5 w-3.5" />}
            Reject
          </button>
        </div>
      </div>

      {/* Comparisons */}
      <div className="grid gap-4 rounded-2xl bg-black/40 p-4 sm:grid-cols-2 border border-white/5">
        {/* Current live bank */}
        <div className="space-y-1 sm:border-r sm:border-white/5 sm:pr-4">
          <div className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1.5">Current Ledger Details</div>
          <div className="text-xs space-y-1 font-medium text-gray-400">
            <span className="block truncate text-gray-300 font-extrabold">🏦 {req.current_bank?.bank_name || "N/A"}</span>
            <span className="block">A/C: <span className="font-mono text-gray-300">{req.current_bank?.account_number || "N/A"}</span></span>
            <span className="block">IFSC: <span className="font-mono text-gray-300">{req.current_bank?.ifsc_code || "N/A"}</span></span>
          </div>
        </div>

        {/* Requested bank */}
        <div className="space-y-1 sm:pl-2">
          <div className="text-[9px] font-black uppercase tracking-widest text-purple-400 flex items-center gap-1 mb-1.5">
            Requested Ledger Details
            <ArrowRight className="h-2.5 w-2.5 text-purple-400" />
          </div>
          <div className="text-xs space-y-1 font-medium text-purple-300">
            <span className="block truncate font-extrabold text-white">🏦 {req.requested_bank?.bank_name || "N/A"}</span>
            <span className="block">A/C: <span className="font-mono text-white font-extrabold">{req.requested_bank?.account_number || "N/A"}</span></span>
            <span className="block">IFSC: <span className="font-mono text-white font-extrabold">{req.requested_bank?.ifsc_code || "N/A"}</span></span>
          </div>
        </div>
      </div>
    </div>
  );
});

/* ================= SHARED ELEMENTS ================= */
function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="text-xs font-semibold text-gray-500 tracking-wider">Syncing operational requests...</span>
    </div>
  );
}

function Empty({
  icon,
  label,
  sublabel,
  glowColor,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  glowColor: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-white/5 rounded-[2.5rem] bg-white/[0.01] p-8 relative overflow-hidden">
      {/* Blurred background aura */}
      <div className="absolute inset-0 opacity-20 blur-2xl pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${glowColor} 0%, transparent 60%)`
        }}
      />
      <div className="relative z-10 space-y-3.5">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.02] border border-white/5">
          {icon}
        </div>
        <div>
          <h4 className="text-sm font-extrabold text-white tracking-wide">{label}</h4>
          <p className="mt-1 text-[11px] font-medium text-gray-500 max-w-xs mx-auto leading-normal">{sublabel}</p>
        </div>
      </div>
    </div>
  );
}