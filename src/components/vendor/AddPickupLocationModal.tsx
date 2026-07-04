import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addPickupLocation } from "@/services/api";
import { queryKeys } from "@/lib/query-keys";
import { X } from "lucide-react";
import { toast } from "sonner";
import { validatePhone, validatePincode } from "@/lib/validation";

export function AddPickupLocationModal({
  vendorId,
  onClose,
}: {
  vendorId: string | number;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();

  const [locationName, setLocationName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");

  const addMutation = useMutation({
    mutationFn: async () => {
      // Validate inputs
      if (!locationName.trim() || !contactName.trim() || !address1.trim() || !city.trim() || !state.trim() || !pincode.trim()) {
        throw new Error("Please fill in all required fields");
      }
      if (!validatePhone(phone)) {
        throw new Error("Please enter a valid 10-digit phone number");
      }
      if (!validatePincode(pincode)) {
        throw new Error("Please enter a valid 6-digit pincode");
      }

      // Shiprocket nickname check (alphanumeric, no spaces/special chars except _ and -)
      const cleanLocationName = locationName.replace(/[^a-zA-Z0-9_-]/g, "");
      if (cleanLocationName.length < 3) {
        throw new Error("Location name must be alphanumeric and at least 3 characters");
      }

      return await addPickupLocation({
        vendor_id: vendorId,
        pickup_location_name: cleanLocationName,
        contact_name: contactName.trim(),
        phone: phone.trim(),
        address_line1: address1.trim(),
        address_line2: address2.trim() || undefined,
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
      });
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Pickup location registered successfully!");
        queryClient.invalidateQueries({ queryKey: queryKeys.pickupLocations(vendorId) });
        onClose();
      } else {
        toast.error(data.message || "Failed to register pickup location");
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "An error occurred");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-[#0f172a]/95 p-6 shadow-2xl backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-6">
          <h2 className="text-xl font-black text-white">Add Pickup Location</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 hover:bg-white/10 hover:text-white transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* Location Code Nickname */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
              Pickup Location Name / Nickname <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. MUMBAI_WH_1 (Alphanumeric only, no spaces)"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""))}
              className="w-full h-11 rounded-xl border border-white/10 bg-black/40 px-4 text-xs text-white outline-none focus:border-cyan-400 transition"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Contact Person */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                Contact Person Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. John Doe"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="w-full h-11 rounded-xl border border-white/10 bg-black/40 px-4 text-xs text-white outline-none focus:border-cyan-400 transition"
                required
              />
            </div>

            {/* Contact Phone */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                Phone Number <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full h-11 rounded-xl border border-white/10 bg-black/40 px-4 text-xs text-white outline-none focus:border-cyan-400 transition"
                required
              />
            </div>
          </div>

          {/* Address Line 1 */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
              Address Line 1 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="Building No, Street Name, Locality"
              value={address1}
              onChange={(e) => setAddress1(e.target.value)}
              className="w-full h-11 rounded-xl border border-white/10 bg-black/40 px-4 text-xs text-white outline-none focus:border-cyan-400 transition"
              required
            />
          </div>

          {/* Address Line 2 */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
              Address Line 2 (Optional)
            </label>
            <input
              type="text"
              placeholder="Landmark, Area info"
              value={address2}
              onChange={(e) => setAddress2(e.target.value)}
              className="w-full h-11 rounded-xl border border-white/10 bg-black/40 px-4 text-xs text-white outline-none focus:border-cyan-400 transition"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {/* City */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                City <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Chennai"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full h-11 rounded-xl border border-white/10 bg-black/40 px-4 text-xs text-white outline-none focus:border-cyan-400 transition"
                required
              />
            </div>

            {/* State */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                State <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Tamil Nadu"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full h-11 rounded-xl border border-white/10 bg-black/40 px-4 text-xs text-white outline-none focus:border-cyan-400 transition"
                required
              />
            </div>

            {/* Pincode */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                Pincode <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 600001"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className="w-full h-11 rounded-xl border border-white/10 bg-black/40 px-4 text-xs text-white outline-none focus:border-cyan-400 transition"
                required
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-white/5 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-300 hover:bg-white/10 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addMutation.isPending}
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-xs font-bold uppercase tracking-wider text-white hover:scale-[1.02] active:scale-[0.98] transition disabled:opacity-50 cursor-pointer"
            >
              {addMutation.isPending ? "Saving..." : "Save Location"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
