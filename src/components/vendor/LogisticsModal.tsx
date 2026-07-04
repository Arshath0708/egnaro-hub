import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { X, RefreshCw, Ban, Truck, Calendar, FileText } from "lucide-react";
import { toast } from "sonner";
import {
  getPickupLocations,
  prepareShipment,
  requestCourierPickup,
  cancelCourierShipment,
  refreshCourierTracking,
} from "@/services/api";

interface LogisticsModalProps {
  order: any;
  role: "admin" | "vendor";
  vendorId?: string | number;
  onClose: () => void;
}

export function LogisticsModal({
  order,
  role,
  vendorId,
  onClose,
}: LogisticsModalProps) {
  const queryClient = useQueryClient();

  const [weight, setWeight] = useState(order.weight_g || 200);
  const [length, setLength] = useState(order.length_cm || 10);
  const [width, setWidth] = useState(order.width_cm || 10);
  const [height, setHeight] = useState(order.height_cm || 10);
  const [pickupLocId, setPickupLocId] = useState("");

  const queryVendorId = role === "admin" ? "admin" : vendorId;

  // Fetch registered pickup locations
  const { data: locations = [] } = useQuery({
    queryKey: ["pickupLocations", queryVendorId],
    queryFn: () => getPickupLocations(queryVendorId),
  });

  const prepareMutation = useMutation({
    mutationFn: async () => {
      if (!order.awb_code && !pickupLocId) {
        throw new Error("Please select a physical pickup origin location");
      }
      if (weight <= 0 || length <= 0 || width <= 0 || height <= 0) {
        throw new Error("Dimensions and weight must be greater than zero");
      }

      const res = await prepareShipment({
        shipment_id: order.shipment_id,
        weight_g: weight,
        length_cm: length,
        width_cm: width,
        height_cm: height,
        vendor_id: vendorId,
        role,
        action: "prepare",
      });

      if (!res.success) {
        throw new Error(res.message || "Failed to book shipment");
      }
      return res;
    },
    onSuccess: () => {
      toast.success("Shipment registered and booked successfully via Shiprocket!");
      invalidateQueries();
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.message || "An error occurred while booking");
    },
  });

  const pickupMutation = useMutation({
    mutationFn: async () => {
      const res = await requestCourierPickup(order.shipment_id, role, vendorId);
      if (!res.success) {
        throw new Error(res.message || "Failed to request pickup");
      }
      return res;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Courier pickup requested successfully!");
      invalidateQueries();
    },
    onError: (err: any) => {
      toast.error(err.message || "An error occurred during pickup request");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await cancelCourierShipment(order.shipment_id, role, vendorId);
      if (!res.success) {
        throw new Error(res.message || "Failed to cancel shipment");
      }
      return res;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Shipment cancelled successfully!");
      invalidateQueries();
    },
    onError: (err: any) => {
      toast.error(err.message || "An error occurred during cancellation");
    },
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      const res = await refreshCourierTracking(order.shipment_id, role, vendorId);
      if (!res.success) {
        throw new Error(res.message || "Failed to sync tracking data");
      }
      return res;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Tracking status synced successfully!");
      invalidateQueries();
    },
    onError: (err: any) => {
      toast.error(err.message || "An error occurred while syncing tracking");
    },
  });

  const invalidateQueries = () => {
    if (role === "admin") {
      queryClient.invalidateQueries({ queryKey: ["adminShipments"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
    } else {
      queryClient.invalidateQueries({ queryKey: ["vendorShipments"] });
      queryClient.invalidateQueries({ queryKey: ["vendorStats"] });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    prepareMutation.mutate();
  };

  const isBooked = !!order.awb_code;
  const isCancelled = order.status === "cancelled";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-[#0f172a]/95 p-6 shadow-2xl backdrop-blur-xl"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-6">
          <div>
            <h2 className="text-xl font-black text-white">
              {isBooked ? `Shipment #${order.shipment_id}` : "Book Shiprocket Shipment"}
            </h2>
            {isBooked && (
              <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider mt-1">
                Courier: {order.courier_name || "Unassigned"}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 hover:bg-white/10 hover:text-white transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        {isBooked ? (
          <div className="space-y-6">
            {/* Courier Tracking Summary */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                Consignment status
              </span>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white">
                    Status:{" "}
                    <span className="text-cyan-400 font-mono uppercase">
                      {order.status.replace(/_/g, " ")}
                    </span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1 font-mono">
                    AWB: {order.awb_code}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => refreshMutation.mutate()}
                    disabled={refreshMutation.isPending}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition disabled:opacity-50"
                    title="Sync tracking status"
                  >
                    <RefreshCw className={`h-4 w-4 ${refreshMutation.isPending ? "animate-spin" : ""}`} />
                  </button>
                  {!isCancelled && (
                    <button
                      onClick={() => cancelMutation.mutate()}
                      disabled={cancelMutation.isPending}
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition disabled:opacity-50"
                      title="Cancel shipment"
                    >
                      <Ban className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2 border-t border-white/5">
                {order.label_url && (
                  <a
                    href={order.label_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold transition hover:bg-cyan-500/20"
                  >
                    <FileText className="h-3.5 w-3.5" /> Label
                  </a>
                )}
                {order.manifest_url && (
                  <a
                    href={order.manifest_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold transition hover:bg-blue-500/20"
                  >
                    <FileText className="h-3.5 w-3.5" /> Manifest
                  </a>
                )}
                {!isCancelled && order.status !== "ready_to_ship" && (
                  <button
                    onClick={() => pickupMutation.mutate()}
                    disabled={pickupMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold transition hover:bg-green-500/20"
                  >
                    <Calendar className="h-3.5 w-3.5" /> Pickup
                  </button>
                )}
              </div>
            </div>

            {/* Checkpoints Timeline */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                Transit Timeline
              </span>
              <div className="space-y-4 max-h-[30vh] overflow-y-auto pr-1">
                {(order.history || []).map((chk: any, idx: number) => (
                  <div key={idx} className="flex gap-3 relative">
                    {idx !== order.history.length - 1 && (
                      <div className="absolute left-[7px] top-[18px] bottom-[-22px] w-[2px] bg-white/10" />
                    )}
                    <div className="h-4 w-4 rounded-full bg-cyan-500 shrink-0 border-2 border-white/20 mt-1" />
                    <div>
                      <p className="text-xs text-white font-bold">{chk.activity}</p>
                      {chk.location && (
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          Location: {chk.location}
                        </p>
                      )}
                      <p className="text-[9px] text-gray-500 mt-0.5">
                        {new Date(chk.checkpoint_time).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                ))}
                {(order.history || []).length === 0 && (
                  <div className="py-6 text-center text-xs text-gray-500 border border-white/5 rounded-xl bg-white/[0.01]">
                    No checkpoints recorded yet. Consignment ready to ship.
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-xs font-bold uppercase text-gray-300 hover:bg-white/10 transition"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Pickup Location Selection */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                Pickup Origin Address <span className="text-red-400">*</span>
              </label>
              <div className="relative flex items-center rounded-2xl border border-white/10 bg-black/40 px-3">
                <select
                  value={pickupLocId}
                  onChange={(e) => setPickupLocId(e.target.value)}
                  className="h-11 w-full bg-transparent text-xs text-white outline-none border-none cursor-pointer focus:ring-0"
                  required
                >
                  <option value="" className="bg-[#0f172a]">
                    -- Select Shipping Origin Address --
                  </option>
                  {locations.map((loc: any) => (
                    <option key={loc.id} value={loc.id} className="bg-[#0f172a]">
                      {loc.pickup_location_name} ({loc.city}, {loc.pincode})
                    </option>
                  ))}
                </select>
              </div>
              {locations.length === 0 && (
                <p className="text-[10px] text-yellow-400/80 mt-1 font-semibold">
                  ⚠️ No pickup locations configured. Check system settings.
                </p>
              )}
            </div>

            {/* Package Dimensions */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">
                Package Dimensions
              </span>

              <div className="grid gap-3 grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase block">
                    Weight (Grams)
                  </label>
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-full h-11 rounded-xl border border-white/10 bg-black/40 px-4 text-xs text-white outline-none focus:border-cyan-400"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase block">
                    Length (cm)
                  </label>
                  <input
                    type="number"
                    value={length}
                    onChange={(e) => setLength(Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-full h-11 rounded-xl border border-white/10 bg-black/40 px-4 text-xs text-white outline-none focus:border-cyan-400"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase block">
                    Width (cm)
                  </label>
                  <input
                    type="number"
                    value={width}
                    onChange={(e) => setWidth(Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-full h-11 rounded-xl border border-white/10 bg-black/40 px-4 text-xs text-white outline-none focus:border-cyan-400"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase block">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-full h-11 rounded-xl border border-white/10 bg-black/40 px-4 text-xs text-white outline-none focus:border-cyan-400"
                    required
                  />
                </div>
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
                disabled={prepareMutation.isPending || locations.length === 0}
                className="rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-6 py-3 text-xs font-bold uppercase tracking-wider text-white hover:scale-[1.02] active:scale-[0.98] transition disabled:opacity-50 cursor-pointer"
              >
                {prepareMutation.isPending ? "Booking..." : "Book Shipment"}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
