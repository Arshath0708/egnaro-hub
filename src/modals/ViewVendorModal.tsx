import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X, Building2, User, Mail, Phone, MapPin, CheckCircle, Clock, XCircle, CreditCard, Landmark, Hash, Package, IndianRupee, ShoppingCart, ShieldAlert, Loader2 } from "lucide-react";
import { getVendorById, updateBankDetails } from "@/services/api";
import { toast } from "sonner";

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

export function ViewVendorModal({
  vendor,
  onClose,
  hidePerformanceOverview = false,
  isVendor = false,
}: {
  vendor: any;
  onClose: () => void;
  hidePerformanceOverview?: boolean;
  isVendor?: boolean;
}) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [isEditingBank, setIsEditingBank] = useState(false);
  const [bankForm, setBankForm] = useState({
    bank_name: "",
    account_number: "",
    ifsc_code: "",
  });
  const [submittingBank, setSubmittingBank] = useState(false);

  useEffect(() => {
    async function fetchVendor() {
      try {
        const res = await getVendorById(vendor.id);
        if (res.success && res.vendor) {
          setData(res.vendor);
        } else {
          toast.error("Failed to fetch vendor details");
        }
      } catch (err) {
        toast.error("Error fetching vendor details");
      } finally {
        setLoading(false);
      }
    }
    fetchVendor();
  }, [vendor]);

  const details = data?.details ? { ...vendor, ...data.details } : vendor;
  const stats = data?.stats || null;

  const startEditing = () => {
    setBankForm({
      bank_name: details.bank_name || "",
      account_number: details.account_number || "",
      ifsc_code: details.ifsc_code || "",
    });
    setIsEditingBank(true);
  };

  const handleBankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingBank(true);
      const res = await updateBankDetails({
        vendor_id: Number(vendor.id),
        bank_name: bankForm.bank_name,
        account_number: bankForm.account_number,
        ifsc_code: bankForm.ifsc_code,
      });
      if (res.success) {
        toast.success("Bank details update request submitted successfully!");
        setIsEditingBank(false);
        setLoading(true);
        const updated = await getVendorById(vendor.id);
        if (updated.success && updated.vendor) {
          setData(updated.vendor);
        }
      } else {
        toast.error(res.message || "Failed to update bank details");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to submit bank update request");
    } finally {
      setSubmittingBank(false);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 flex items-center justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/85 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className="relative z-10 w-full max-w-3xl rounded-[32px] border border-white/5 bg-gradient-to-b from-[#0a0f1d] to-[#05070a] shadow-[0_30px_70px_rgba(0,0,0,0.8)] overflow-hidden"
      >
        {/* Glow orbs */}
        <div className="absolute -top-12 -left-12 h-40 w-40 rounded-full blur-3xl opacity-15 pointer-events-none bg-violet-500" />
        <div className="absolute -bottom-12 -right-12 h-40 w-40 rounded-full blur-3xl opacity-15 pointer-events-none bg-cyan-500" />

        <div className="p-6 md:p-8 lg:p-10 relative z-10">
          {/* HEADER */}
          <div className="mb-8 flex items-start justify-between">
            <div className="flex gap-4">
              <LayeredIconContainer
                icon={<Building2 className="h-5 w-5 text-violet-400" />}
                glowColor="rgba(139, 92, 246, 0.4)"
              />
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-violet-300">
                  <Building2 className="h-3 w-3 text-violet-400" />
                  Marketplace Merchant Account
                </div>
                <h2 className="text-2xl font-black text-white md:text-3xl tracking-wide mt-1.5 leading-none">
                  {details.company_name}
                </h2>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500 font-semibold">
                  <Clock className="h-3.5 w-3.5 text-gray-500" />
                  <span>Onboarded: {details.created_at ? new Date(details.created_at).toLocaleDateString('en-IN') : 'N/A'}</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all hover:bg-white/10 active:scale-90 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-500">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-xs font-semibold">Syncing operational data logs...</span>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                {/* CONTACT INFO */}
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 space-y-4">
                  <h3 className="flex items-center gap-2 text-sm font-extrabold text-white tracking-wide uppercase">
                    <User className="h-4 w-4 text-primary" />
                    Merchant Contact Information
                  </h3>
                  <div className="space-y-3.5">
                    <DetailItem icon={<User className="h-4 w-4" />} label="Authorized Representative" value={details.vendor_name} />
                    <DetailItem icon={<Mail className="h-4 w-4" />} label="Primary Email Address" value={details.email} />
                    <DetailItem icon={<Phone className="h-4 w-4" />} label="Contact phone number" value={details.phone} />
                    <DetailItem icon={<MapPin className="h-4 w-4" />} label="Registered Corporate Address" value={details.address} isAddress />
                    {(details.state || details.city || details.town) && (
                      <DetailItem 
                        icon={<MapPin className="h-4 w-4" />} 
                        label="Logistics Hub Attribution" 
                        value={`${details.town ? details.town + ", " : ""}${details.city ? details.city + ", " : ""}${details.state || ""}`} 
                      />
                    )}
                  </div>
                </div>

                {/* BANK DETAILS */}
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-extrabold text-white tracking-wide uppercase">
                    <CreditCard className="h-4 w-4 text-primary" />
                    Settlement Bank Ledger
                  </h3>
                  
                  {isEditingBank ? (
                    <form onSubmit={handleBankSubmit} className="space-y-4 animate-fadeIn">
                      <div>
                        <label className="text-[9px] font-bold uppercase tracking-widest text-gray-500 block mb-1">Corporate Bank Name</label>
                        <input
                          type="text"
                          value={bankForm.bank_name}
                          onChange={(e) => setBankForm(p => ({ ...p, bank_name: e.target.value }))}
                          className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-2.5 text-xs text-white focus:border-primary outline-none"
                          placeholder="e.g. HDFC Bank Ltd"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold uppercase tracking-widest text-gray-500 block mb-1">Account Number</label>
                        <input
                          type="text"
                          value={bankForm.account_number}
                          onChange={(e) => setBankForm(p => ({ ...p, account_number: e.target.value }))}
                          className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-2.5 text-xs text-white focus:border-primary outline-none"
                          placeholder="e.g. 501002345678"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold uppercase tracking-widest text-gray-500 block mb-1">IFSC Code Route</label>
                        <input
                          type="text"
                          value={bankForm.ifsc_code}
                          onChange={(e) => setBankForm(p => ({ ...p, ifsc_code: e.target.value }))}
                          className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-2.5 text-xs text-white focus:border-primary outline-none"
                          placeholder="e.g. HDFC0000123"
                          required
                        />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          type="submit"
                          disabled={submittingBank}
                          className="flex-1 rounded-xl bg-primary py-2.5 text-xs font-extrabold uppercase tracking-wider text-white hover:bg-primary-hover disabled:opacity-55 cursor-pointer shadow-lg shadow-primary/15"
                        >
                          {submittingBank ? "Submitting..." : "Submit Sync Request"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditingBank(false)}
                          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider text-gray-400 hover:bg-white/10 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <DetailItem icon={<Landmark className="h-4 w-4" />} label="Corporate Bank Name" value={details.bank_details?.bank_name || details.bank_name || "N/A"} />
                      <DetailItem icon={<Hash className="h-4 w-4" />} label="Registered Account number" value={details.bank_details?.account_number || details.account_number || "N/A"} />
                      <DetailItem icon={<Hash className="h-4 w-4" />} label="System IFSC Code route" value={details.bank_details?.ifsc_code || details.ifsc_code || "N/A"} />
                      <div className="pt-2">
                        <div className="mb-1.5 text-[9px] uppercase tracking-wider text-gray-500 font-bold">Settlement Account Status</div>
                        <StatusBadge status={details.status} />
                      </div>

                      {details.bank_change_status === 'pending' && (
                        <div className="mt-3 rounded-xl border border-yellow-500/10 bg-yellow-500/5 p-3 text-[11px] text-yellow-400 flex items-start gap-1.5">
                          <Clock className="h-4 w-4 text-yellow-400 animate-pulse shrink-0 mt-0.5" />
                          <span>Ledger update pending admin override review. Live settlements continue on active credentials.</span>
                        </div>
                      )}

                      {details.bank_change_status === 'rejected' && (
                        <div className="mt-3 rounded-xl border border-red-500/10 bg-red-500/5 p-3 text-[11px] text-red-400 flex items-start gap-1.5">
                          <ShieldAlert className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                          <span>Previous ledger synchronization update request rejected. Review inputs.</span>
                        </div>
                      )}

                      {isVendor && (
                        <button
                          type="button"
                          onClick={startEditing}
                          disabled={details.bank_change_status === 'pending'}
                          className="mt-4 w-full flex items-center justify-center gap-1.5 rounded-xl bg-violet-600/10 border border-violet-500/30 px-3 py-2.5 text-xs font-extrabold uppercase tracking-wider text-violet-300 transition-all hover:bg-violet-600/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <Landmark className="h-3.5 w-3.5" />
                          {details.bank_change_status === 'pending' ? "Ledger Request Locked" : "Request Bank Account Override"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* STATS */}
              {stats && !hidePerformanceOverview && (
                <div className="space-y-3.5">
                  <h3 className="text-sm font-extrabold text-white tracking-wide uppercase">Operational Performance Overview</h3>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <StatMini icon={<Package />} label="Listed Catalog" value={stats.products.total} color="text-cyan-400" bg="bg-cyan-500/5" />
                    <StatMini icon={<ShoppingCart />} label="Orders Served" value={stats.orders.total} color="text-orange-400" bg="bg-orange-400/5" />
                    <StatMini icon={<IndianRupee />} label="Gross GMV" value={`₹${stats.orders.total_revenue.toLocaleString('en-IN')}`} color="text-emerald-400" bg="bg-emerald-500/5" />
                    <StatMini icon={<CheckCircle />} label="Approved Items" value={stats.products.approved} color="text-primary" bg="bg-primary/5" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function DetailItem({ icon, label, value, isAddress }: { icon: any, label: string, value: string, isAddress?: boolean }) {
  return (
    <div className="flex gap-3 text-gray-300">
      <div className="mt-1 flex-shrink-0 text-violet-400">
        {icon}
      </div>
      <div>
        <div className="text-[9px] font-bold uppercase tracking-widest text-gray-500">{label}</div>
        <div className={`text-xs mt-0.5 ${isAddress ? "leading-relaxed" : "font-extrabold text-white"}`}>{value}</div>
      </div>
    </div>
  );
}

function StatMini({ icon, label, value, color, bg }: { icon: any, label: string, value: string | number, color: string, bg: string }) {
  return (
    <div className={`rounded-2xl border border-white/5 ${bg} p-5 space-y-3`}>
      <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 border border-white/10 ${color}`}>
        {icon}
      </div>
      <div>
        <div className="text-xl font-black text-white">{value}</div>
        <div className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mt-1">{label}</div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isApproved = status === "active" || status === "approved";
  const isPending = status === "pending";

  if (isApproved) {
    return (
      <div className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-[10px] font-black uppercase text-emerald-400 tracking-wider">
        <CheckCircle className="h-3 w-3" />
        Approved Account
      </div>
    );
  }
  if (isPending) {
    return (
      <div className="inline-flex items-center gap-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 px-3 py-1 text-[10px] font-black uppercase text-yellow-400 tracking-wider">
        <Clock className="h-3 w-3 animate-pulse" />
        Pending Review
      </div>
    );
  }
  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/20 px-3 py-1 text-[10px] font-black uppercase text-red-400 tracking-wider">
      <XCircle className="h-3 w-3" />
      Rejected Account
    </div>
  );
}
