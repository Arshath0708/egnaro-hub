import { useQuery } from "@tanstack/react-query";
import { getPickupLocations } from "@/services/api";
import { queryKeys } from "@/lib/query-keys";
import { MapPin, Phone, User, CheckCircle2, AlertCircle } from "lucide-react";

export function PickupLocationsTab({ vendorId }: { vendorId: string | number }) {
  const { data: locations = [], isLoading, error } = useQuery({
    queryKey: queryKeys.pickupLocations(vendorId),
    queryFn: () => getPickupLocations(vendorId),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="py-20 text-center text-gray-400">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent mb-4"></div>
        Loading pickup locations...
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-10 text-center text-red-400 border border-red-500/20 rounded-2xl bg-red-500/5">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-3" />
        <h3 className="font-bold">Failed to load pickup locations</h3>
        <p className="text-xs text-red-300 mt-1">{(error as any).message || "An error occurred"}</p>
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className="py-20 text-center border border-dashed border-white/10 rounded-3xl bg-white/[0.01]">
        <MapPin className="mx-auto h-12 w-12 text-gray-600 mb-3" />
        <h3 className="text-xl font-bold">No pickup locations registered</h3>
        <p className="text-sm text-gray-400 mt-2">
          You must add at least one pickup location to dispatch shipments via Shiprocket.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {locations.map((loc: any) => (
        <div
          key={loc.id}
          className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition hover:border-white/20 relative overflow-hidden"
        >
          {loc.status === 1 && (
            <div className="absolute top-4 right-4 flex h-6 items-center gap-1.5 rounded-full bg-green-500/10 px-3 text-[10px] font-bold text-green-400 border border-green-500/20">
              <CheckCircle2 className="h-3 w-3" /> Active
            </div>
          )}

          <h3 className="text-base font-black text-white pr-16 truncate">
            {loc.pickup_location_name}
          </h3>

          <div className="mt-4 space-y-3 text-xs text-gray-300">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-cyan-400 shrink-0" />
              <span className="truncate font-semibold">{loc.contact_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-cyan-400 shrink-0" />
              <span>{loc.phone}</span>
            </div>
            <div className="flex items-start gap-2 pt-2 border-t border-white/5">
              <MapPin className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <p className="leading-relaxed text-gray-200">{loc.address_line1}</p>
                {loc.address_line2 && <p className="leading-relaxed text-gray-400">{loc.address_line2}</p>}
                <p className="mt-1 font-bold text-cyan-300">
                  {loc.city}, {loc.state} - {loc.pincode}
                </p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
