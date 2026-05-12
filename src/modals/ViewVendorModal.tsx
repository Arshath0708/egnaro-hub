import { useEffect, useState } from "react";
import { X, Building2, User, Mail, Phone, MapPin, CheckCircle, Clock, XCircle } from "lucide-react";
import { getVendorById } from "@/services/api";
import { toast } from "sonner";

export function ViewVendorModal({
  vendor,
  onClose,
}: {
  vendor: any;
  onClose: () => void;
}) {
  const [vendorDetails, setVendorDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVendor() {
      try {
        const res = await getVendorById(vendor.id);
        if (res.success && res.vendor) {
          setVendorDetails(res.vendor);
        } else {
          toast.error("Failed to fetch vendor details");
          setVendorDetails(vendor); // fallback to initial data
        }
      } catch (err) {
        toast.error("Error fetching vendor details");
        setVendorDetails(vendor);
      } finally {
        setLoading(false);
      }
    }
    fetchVendor();
  }, [vendor]);

  const displayVendor = vendorDetails || vendor;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 p-4 backdrop-blur-md">
      <div className="flex min-h-full items-start justify-center py-8">
        <div className="relative w-full max-w-2xl rounded-[36px] border border-white/10 bg-[#050816] shadow-2xl">
          <div className="p-8 lg:p-10">
            {/* HEADER */}
            <div className="mb-8 flex items-start justify-between">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-400/20 bg-purple-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-purple-300">
                  <Building2 className="h-4 w-4" />
                  Vendor Profile
                </div>
                <h2 className="text-3xl font-black text-white md:text-4xl">
                  {displayVendor.company_name}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="rounded-full bg-white/5 p-3 text-gray-400 transition-all hover:bg-white/10 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {loading ? (
              <div className="py-20 text-center text-gray-400">Loading details...</div>
            ) : (
              <div className="grid gap-6">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <h3 className="mb-4 text-lg font-bold text-white">Contact Information</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-gray-300">
                      <User className="h-5 w-5 text-purple-400" />
                      <span>{displayVendor.vendor_name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-300">
                      <Mail className="h-5 w-5 text-purple-400" />
                      <span>{displayVendor.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-300">
                      <Phone className="h-5 w-5 text-purple-400" />
                      <span>{displayVendor.phone}</span>
                    </div>
                    {displayVendor.address && (
                      <div className="flex items-start gap-3 text-gray-300">
                        <MapPin className="mt-0.5 h-5 w-5 text-purple-400" />
                        <span>{displayVendor.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <h3 className="mb-4 text-lg font-bold text-white">Account Status</h3>
                  <div className="flex items-center gap-3">
                    {displayVendor.approved === 1 ? (
                      <div className="flex items-center gap-2 text-green-400">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-semibold">Approved</span>
                      </div>
                    ) : displayVendor.approved === 0 ? (
                      <div className="flex items-center gap-2 text-yellow-400">
                        <Clock className="h-5 w-5" />
                        <span className="font-semibold">Pending Approval</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-red-400">
                        <XCircle className="h-5 w-5" />
                        <span className="font-semibold">Rejected</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
