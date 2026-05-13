import { memo, useEffect, useState } from "react";
import { X, Check, Loader2, Users, KeyRound } from "lucide-react";
import { approveVendor } from "@/services/api";
import { toast } from "sonner";

const API = "https://egnaromart.com/api";

type Vendor = {
  id: number;
  vendor_name: string;
  company_name: string;
  phone: string;
  email: string;
  address: string;
  status?: string;
  approved?: number;
  request_type?: string;
};

interface Props {
  onClose: () => void;
  onVendorActioned: () => void;
}

type ModalTab = "registrations" | "resets";

export function VendorRequestsModal({ onClose, onVendorActioned }: Props) {
  const [tab, setTab] = useState<ModalTab>("registrations");

  // ── Registration requests ──────────────────────────────
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [fetchingVendors, setFetchingVendors] = useState(true);

  // ── Reset requests ─────────────────────
  const [resetRequests, setResetRequests] = useState<Vendor[]>([]);
  const [fetchingReset, setFetchingReset] = useState(true);

  async function loadVendors() {
    try {
      setFetchingVendors(true);
      const res = await fetch(`${API}/get-vendors.php`);
      const text = await res.text();
      let data = [];
      try { data = JSON.parse(text); } catch { /* */ }
      if (Array.isArray(data)) {
        // Only truly pending registrations (not vendors mid-reset-flow)
        // We'll cross-filter with resetRequests after both loads complete
        setVendors(data.filter((v: Vendor) => Number(v.approved) === 0 || v.status === "pending"));
      } else {
        setVendors([]);
      }
    } catch {
      toast.error("Failed to load vendors");
      setVendors([]);
    } finally {
      setFetchingVendors(false);
    }
  }

  async function loadResetRequests() {
    try {
      setFetchingReset(true);
      const res = await fetch(`${API}/get-vendor-reset-requests.php`);
      const data = await res.json();
      if (data.success) {
        setResetRequests(data.reset_requests || []);
        // Cross-filter: remove vendors in reset flow from registration list
        const resetIds = new Set([
          ...(data.reset_requests || []).map((v: Vendor) => v.id),
        ]);
        setVendors((prev) => prev.filter((v) => !resetIds.has(v.id)));
      }
    } catch {
      toast.error("Failed to load reset requests");
    } finally {
      setFetchingReset(false);
    }
  }

  useEffect(() => {
    loadVendors();
    loadResetRequests();
  }, []);

  function removeVendor(id: number) {
    setVendors((prev) => prev.filter((v) => v.id !== id));
    setTimeout(() => onVendorActioned(), 300);
  }

  function removeReset(id: number) {
    setResetRequests((prev) => prev.filter((v) => v.id !== id));
    setTimeout(() => onVendorActioned(), 300);
  }

  const tabCls = (t: ModalTab) =>
    `flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
      tab === t
        ? "bg-[#FF6600] text-white shadow"
        : "text-gray-400 hover:text-white"
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div
        className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col rounded-[28px] border border-white/10 bg-[#0a0f0a] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0B3D2E] text-[#FF6600]">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Vendor Requests</h2>
              <p className="text-xs text-gray-500">
                {vendors.length} registration · {resetRequests.length} reset
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* TABS */}
        <div className="flex gap-1 rounded-2xl bg-white/5 mx-4 mt-4 mb-1 p-1">
          <button className={tabCls("registrations")} onClick={() => setTab("registrations")}>
            Registrations ({vendors.length})
          </button>
          <button className={tabCls("resets")} onClick={() => setTab("resets")}>
            Reset Requests ({resetRequests.length})
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 space-y-3 overflow-y-auto px-6 py-4">

          {/* ── REGISTRATIONS ── */}
          {tab === "registrations" && (
            fetchingVendors ? (
              <Spinner />
            ) : vendors.length === 0 ? (
              <Empty icon={<Users className="h-12 w-12 opacity-30" />} label="No pending vendor registrations" />
            ) : (
              vendors.map((vendor) => (
                <VendorCard key={vendor.id} vendor={vendor} onAction={removeVendor} />
              ))
            )
          )}

          {/* ── RESET REQUESTS ── */}
          {tab === "resets" && (
            fetchingReset ? (
              <Spinner />
            ) : resetRequests.length === 0 ? (
              <Empty icon={<KeyRound className="h-12 w-12 opacity-30" />} label="No pending password reset requests" />
            ) : (
              resetRequests.map((vendor) => (
                <ResetRequestCard
                  key={vendor.id}
                  vendor={vendor}
                  onDone={removeReset}
                />
              ))
            )
          )}

        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   REGISTRATION CARD
═══════════════════════════════════════════════════════════ */
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
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-white">{vendor.company_name}</h3>
          <p className="mt-1 text-sm text-gray-400">{vendor.vendor_name}</p>
          <p className="mt-1 text-xs text-gray-500">{vendor.email}</p>
          <p className="mt-1 text-xs text-gray-500">{vendor.phone}</p>
          <p className="mt-1 text-xs text-gray-600">{vendor.address}</p>
        </div>
        <div className="flex shrink-0 gap-2 pt-1">
          <button disabled={busy} onClick={() => handleAction("approve")}
            className="flex items-center gap-1.5 rounded-xl bg-green-600 px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:bg-green-500 disabled:opacity-60">
            {loading === "approve" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Approve
          </button>
          <button disabled={busy} onClick={() => handleAction("reject")}
            className="flex items-center gap-1.5 rounded-xl bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:bg-red-500 disabled:opacity-60">
            {loading === "reject" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
            Reject
          </button>
        </div>
      </div>
    </div>
  );
});

/* ═══════════════════════════════════════════════════════════
   RESET CARD
═══════════════════════════════════════════════════════════ */
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
        // Hardcode type as we only have reset requests now
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
    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-400">
            <KeyRound className="h-3 w-3" />
            Reset Requested
          </div>
          <h3 className="truncate text-base font-semibold text-white">{vendor.vendor_name}</h3>
          <p className="mt-1 text-xs text-gray-400">{vendor.email}</p>
          <p className="mt-1 text-xs text-gray-500">{vendor.phone}</p>
          <p className="mt-2 text-xs text-gray-500">
            Vendor is requesting a password reset. Approve to let them set a new password.
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 pt-1">
          <button
            disabled={busy}
            onClick={() => handleAction("approve_reset")}
            className="flex items-center gap-1.5 rounded-xl bg-green-600 px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:bg-green-500 disabled:opacity-60"
          >
            {loading === "approve_reset" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Approve Reset
          </button>
          <button
            disabled={busy}
            onClick={() => handleAction("reject")}
            className="flex items-center gap-1.5 rounded-xl bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:bg-red-500 disabled:opacity-60"
          >
            {loading === "reject" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
            Reject
          </button>
        </div>
      </div>
    </div>
  );
});

/* ═══════════════════════════════════════════════════════════
   SHARED
═══════════════════════════════════════════════════════════ */
function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="h-8 w-8 animate-spin text-[#FF6600]" />
    </div>
  );
}

function Empty({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-500">
      {icon}
      <p className="mt-3 text-sm">{label}</p>
    </div>
  );
}