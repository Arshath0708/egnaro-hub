import { memo, useEffect, useState } from "react";
import { X, Check, Loader2, Users } from "lucide-react";
import { approveVendor, getVendors } from "@/services/api";
import { toast } from "sonner";

type Vendor = {
  id: number;
  vendor_name: string;
  company_name: string;
  phone: string;
  email: string;
  address: string;
};

interface Props {
  onClose: () => void;
  onVendorActioned: () => void;
}

export function VendorRequestsModal({ onClose, onVendorActioned }: Props) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    getVendors()
      .then((d) => setVendors(Array.isArray(d) ? d : []))
      .finally(() => setFetching(false));
  }, []);

  function removeVendor(id: number) {
    setVendors((prev) => prev.filter((v) => v.id !== id));
    onVendorActioned();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div
        className="relative z-10 w-full max-w-2xl max-h-[85vh] flex flex-col rounded-[28px] border border-white/10 bg-[#0a0f0a] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0B3D2E] text-[#FF6600]">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Vendor Requests</h2>
              <p className="text-xs text-gray-500">
                {vendors.length} pending request{vendors.length !== 1 ? "s" : ""}
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

        {/* body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {fetching ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-[#FF6600]" />
            </div>
          ) : vendors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <Users className="mb-3 h-12 w-12 opacity-30" />
              <p className="text-sm">No pending vendor requests</p>
            </div>
          ) : (
            vendors.map((v) => (
              <VendorCard key={v.id} vendor={v} onAction={removeVendor} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

const VendorCard = memo(
  ({
    vendor,
    onAction,
  }: {
    vendor: Vendor;
    onAction: (id: number) => void;
  }) => {
    const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
    const busy = loading !== null;

    async function handleAction(action: "approve" | "reject") {
      setLoading(action);
      try {
        const status = action === "approve" ? "approved" : "rejected";
        const res = await approveVendor(vendor.id, status);
        if (res && res.success === false) {
          toast.error(res.message || "Action failed");
        } else {
          toast.success(
            action === "approve"
              ? `${vendor.company_name} approved`
              : `${vendor.company_name} rejected`
          );
          onAction(vendor.id);
        }
      } catch {
        toast.error("Server error. Please try again.");
      } finally {
        setLoading(null);
      }
    }

    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold text-white">
              {vendor.company_name}
            </h3>
            <p className="mt-0.5 text-sm text-gray-400">{vendor.vendor_name}</p>
            <p className="mt-1 text-xs text-gray-500">
              {vendor.email} · {vendor.phone}
            </p>
            <p className="mt-1 text-xs text-gray-600">{vendor.address}</p>
          </div>

          <div className="flex shrink-0 gap-2 pt-1">
            <button
              disabled={busy}
              onClick={() => handleAction("approve")}
              className="flex items-center gap-1.5 rounded-xl bg-green-600 px-3 py-1.5 text-sm font-medium text-white transition-opacity disabled:opacity-60 hover:bg-green-500"
            >
              {loading === "approve" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              Approve
            </button>
            <button
              disabled={busy}
              onClick={() => handleAction("reject")}
              className="flex items-center gap-1.5 rounded-xl bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-opacity disabled:opacity-60 hover:bg-red-500"
            >
              {loading === "reject" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <X className="h-3.5 w-3.5" />
              )}
              Reject
            </button>
          </div>
        </div>
      </div>
    );
  }
);
