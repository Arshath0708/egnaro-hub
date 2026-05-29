import { useEffect, useState } from "react";
import { X, Building2, User, Mail, Phone, MapPin, CheckCircle, Clock, XCircle, CreditCard, Landmark, Hash, Package, IndianRupee, ShoppingCart } from "lucide-react";
import { getVendorById, updateBankDetails } from "@/services/api";
import { toast } from "sonner";

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

  // Use API details if available, fallback to initial vendor object, merging to preserve bank details
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
        // Reload details
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 p-4 backdrop-blur-md">
      <div className="flex min-h-full items-start justify-center py-8">
        <div className="relative w-full max-w-3xl rounded-[36px] border border-white/10 bg-[#050816] shadow-2xl">
          <div className="p-8 lg:p-10">
            {/* HEADER */}
            <div className="mb-8 flex items-start justify-between">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-400/20 bg-purple-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-purple-300">
                  <Building2 className="h-4 w-4" />
                  Vendor Profile
                </div>
                <h2 className="text-3xl font-black text-white md:text-4xl">
                  {details.company_name}
                </h2>
                <div className="mt-2 flex items-center gap-2 text-gray-400">
                  <Clock className="h-4 w-4" />
                  <span>Joined {new Date(details.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-full bg-white/5 p-3 text-gray-400 transition-all hover:bg-white/10 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {loading ? (
              <div className="flex h-64 flex-col items-center justify-center gap-4 py-20 text-center text-gray-400">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
                <span>Loading comprehensive details...</span>
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-2">
                {/* CONTACT INFO */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
                    <User className="h-5 w-5 text-purple-400" />
                    Contact Information
                  </h3>
                  <div className="space-y-4">
                    <DetailItem icon={<User />} label="Vendor Name" value={details.vendor_name} />
                    <DetailItem icon={<Mail />} label="Email Address" value={details.email} />
                    <DetailItem icon={<Phone />} label="Phone Number" value={details.phone} />
                    <DetailItem icon={<MapPin />} label="Business Address" value={details.address} isAddress />
                    {(details.state || details.city || details.town) && (
                      <DetailItem 
                        icon={<MapPin />} 
                        label="Location Hub" 
                        value={`${details.town ? details.town + ", " : ""}${details.city ? details.city + ", " : ""}${details.state || ""}`} 
                      />
                    )}
                  </div>
                </div>

                {/* BANK DETAILS */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
                    <CreditCard className="h-5 w-5 text-purple-400" />
                    Bank Information
                  </h3>
                  
                  {isEditingBank ? (
                    <form onSubmit={handleBankSubmit} className="space-y-4">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-1">Bank Name</label>
                        <input
                          type="text"
                          value={bankForm.bank_name}
                          onChange={(e) => setBankForm(p => ({ ...p, bank_name: e.target.value }))}
                          className="w-full rounded-xl border border-white/10 bg-[#0c1322] px-4 py-2.5 text-sm text-white focus:border-purple-400 outline-none"
                          placeholder="e.g. State Bank of India"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-1">Account Number</label>
                        <input
                          type="text"
                          value={bankForm.account_number}
                          onChange={(e) => setBankForm(p => ({ ...p, account_number: e.target.value }))}
                          className="w-full rounded-xl border border-white/10 bg-[#0c1322] px-4 py-2.5 text-sm text-white focus:border-purple-400 outline-none"
                          placeholder="e.g. 1234567890"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-1">IFSC Code</label>
                        <input
                          type="text"
                          value={bankForm.ifsc_code}
                          onChange={(e) => setBankForm(p => ({ ...p, ifsc_code: e.target.value }))}
                          className="w-full rounded-xl border border-white/10 bg-[#0c1322] px-4 py-2.5 text-sm text-white focus:border-purple-400 outline-none"
                          placeholder="e.g. SBIN0001234"
                          required
                        />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          type="submit"
                          disabled={submittingBank}
                          className="flex-1 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-purple-500 disabled:opacity-55 cursor-pointer"
                        >
                          {submittingBank ? "Submitting..." : "Submit Request"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditingBank(false)}
                          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-gray-300 hover:bg-white/10 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <DetailItem icon={<Landmark />} label="Bank Name" value={details.bank_details?.bank_name || details.bank_name || "N/A"} />
                      <DetailItem icon={<Hash />} label="Account Number" value={details.bank_details?.account_number || details.account_number || "N/A"} />
                      <DetailItem icon={<Hash />} label="IFSC Code" value={details.bank_details?.ifsc_code || details.ifsc_code || "N/A"} />
                      <div className="pt-2">
                        <div className="mb-1 text-xs uppercase tracking-wider text-gray-500">Account Status</div>
                        <StatusBadge status={details.status} />
                      </div>

                      {details.bank_change_status === 'pending' && (
                        <div className="mt-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-3 text-xs text-yellow-300">
                          <Clock className="inline h-3.5 w-3.5 mr-1 align-text-bottom text-yellow-400 animate-pulse" />
                          Bank update pending admin approval. Live details active.
                        </div>
                      )}

                      {details.bank_change_status === 'rejected' && (
                        <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-400">
                          <XCircle className="inline h-3.5 w-3.5 mr-1 align-text-bottom text-red-400" />
                          Previous bank update request was rejected.
                        </div>
                      )}

                      {isVendor && (
                        <button
                          type="button"
                          onClick={startEditing}
                          disabled={details.bank_change_status === 'pending'}
                          className="mt-4 w-full flex items-center justify-center gap-1.5 rounded-xl bg-purple-600/20 border border-purple-500/30 px-3 py-2 text-xs font-bold text-purple-300 transition-all hover:bg-purple-600/35 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <Landmark className="h-3.5 w-3.5" />
                          {details.bank_change_status === 'pending' ? "Update Request Pending" : "Request Bank Details Update"}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* STATS */}
                {stats && !hidePerformanceOverview && (
                  <div className="lg:col-span-2">
                    <h3 className="mb-4 text-lg font-bold text-white">Performance Overview</h3>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                      <StatMini icon={<Package />} label="Total Products" value={stats.products.total} color="text-blue-400" bg="bg-blue-400/10" />
                      <StatMini icon={<ShoppingCart />} label="Total Orders" value={stats.orders.total} color="text-orange-400" bg="bg-orange-400/10" />
                      <StatMini icon={<IndianRupee />} label="Revenue" value={`₹${stats.orders.total_revenue.toLocaleString()}`} color="text-green-400" bg="bg-green-400/10" />
                      <StatMini icon={<CheckCircle />} label="Approved" value={stats.products.approved} color="text-emerald-400" bg="bg-emerald-400/10" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ icon, label, value, isAddress }: { icon: any, label: string, value: string, isAddress?: boolean }) {
  return (
    <div className="flex gap-3 text-gray-300">
      <div className="mt-1 flex-shrink-0 text-purple-400">
        {icon}
      </div>
      <div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{label}</div>
        <div className={`text-sm ${isAddress ? "leading-relaxed" : ""}`}>{value}</div>
      </div>
    </div>
  );
}

function StatMini({ icon, label, value, color, bg }: { icon: any, label: string, value: string | number, color: string, bg: string }) {
  return (
    <div className={`rounded-2xl border border-white/5 ${bg} p-4`}>
      <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${bg} ${color}`}>
        {icon}
      </div>
      <div className="text-xl font-black text-white">{value}</div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{label}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isApproved = status === "active" || status === "approved";
  const isPending = status === "pending";

  if (isApproved) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 text-xs font-bold text-green-400">
        <CheckCircle className="h-3.5 w-3.5" />
        Approved
      </div>
    );
  }
  if (isPending) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-bold text-yellow-400">
        <Clock className="h-3.5 w-3.5" />
        Pending
      </div>
    );
  }
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 text-xs font-bold text-red-400">
      <XCircle className="h-3.5 w-3.5" />
      Rejected
    </div>
  );
}

