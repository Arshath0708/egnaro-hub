import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { X, ShieldAlert, ShieldCheck, Play, Pause, Loader2, AlertCircle, Info } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { haltVendor } from "@/services/api";
import { QUERY_KEYS } from "@/lib/query-keys";

export function HaltVendorModal({
  vendor,
  onClose,
}: {
  vendor: any;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const isCurrentlyHalted = vendor.status === "halted";
  const action = isCurrentlyHalted ? "unhalt" : "halt";

  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    products_halted?: number;
    products_restored?: number;
    pending_orders?: number;
    safe_to_delete?: boolean;
    note?: string;
  } | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await haltVendor(Number(vendor.id), action);
      if (!res.success) {
        throw new Error(res.message || `Failed to ${action} vendor`);
      }
      return res;
    },
    onSuccess: (data) => {
      setResult(data);
      toast.success(
        action === "halt"
          ? "Vendor placed on hold (halted)"
          : "Vendor restored to active"
      );
      // Invalidate queries to refresh lists
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_VENDORS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_PRODUCTS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PRODUCTS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_STATS] });
      queryClient.invalidateQueries({ queryKey: ["vendor-details"] });
    },
    onError: (err: any) => {
      toast.error(err.message || `Operation failed`);
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/85 backdrop-blur-md"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className={`relative w-full max-w-lg rounded-[32px] border bg-gradient-to-b from-[#0a0f1d] to-[#05070a] p-8 text-center shadow-[0_30px_70px_rgba(0,0,0,0.8)] overflow-hidden ${
          isCurrentlyHalted ? "border-emerald-500/20" : "border-amber-500/20"
        }`}
      >
        <div className={`absolute -top-12 -left-12 h-32 w-32 rounded-full blur-2xl opacity-10 pointer-events-none ${
          isCurrentlyHalted ? "bg-emerald-500" : "bg-amber-500"
        }`} />

        <button
          onClick={onClose}
          className="absolute right-6 top-6 flex h-8 w-8 items-center justify-center rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {!result ? (
          <>
            <div className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border ${
              isCurrentlyHalted 
                ? "bg-emerald-500/10 border-emerald-500/20" 
                : "bg-amber-500/10 border-amber-500/20"
            }`}>
              {isCurrentlyHalted ? (
                <ShieldCheck className="h-8 w-8 text-emerald-500 animate-pulse" />
              ) : (
                <ShieldAlert className="h-8 w-8 text-amber-500 animate-pulse" />
              )}
            </div>

            <h2 className="text-2xl font-black text-white tracking-wide">
              {isCurrentlyHalted ? "Unhalt Vendor" : "Halt Vendor"}
            </h2>
            
            <p className="mt-3 text-xs text-gray-400 leading-relaxed max-w-sm mx-auto">
              You are about to change the operational status of{" "}
              <span className="font-extrabold text-white block my-1 text-sm">
                {vendor.vendor_name}
              </span>
            </p>

            <div className="mt-5 rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-left space-y-2.5 max-w-sm mx-auto text-xs text-gray-400 leading-normal">
              <div className="flex gap-2.5 items-start">
                <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  {action === "halt" ? (
                    <span>
                      Halting will **hide all vendor products** from the shop instantly. Active orders will process and complete normally.
                    </span>
                  ) : (
                    <span>
                      Unhalting will **restore products** back to approved status, making them visible in the shop again.
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-3.5">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-xs font-extrabold uppercase tracking-wider text-white transition hover:bg-white/10 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-xs font-extrabold uppercase tracking-wider text-white transition hover:opacity-90 disabled:opacity-60 cursor-pointer ${
                  isCurrentlyHalted
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600"
                    : "bg-gradient-to-r from-amber-600 to-orange-600"
                }`}
              >
                {mutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isCurrentlyHalted ? (
                  <Play className="h-4 w-4" />
                ) : (
                  <Pause className="h-4 w-4" />
                )}
                {isCurrentlyHalted ? "Unhalt" : "Halt"}
              </button>
            </div>
          </>
        ) : (
          <div className="animate-fadeIn">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <ShieldCheck className="h-8 w-8 text-emerald-500" />
            </div>

            <h2 className="text-2xl font-black text-white tracking-wide">
              Operation Successful
            </h2>
            <p className="mt-2 text-xs text-gray-400">
              {result.message}
            </p>

            <div className="mt-6 rounded-2xl border border-white/5 bg-[#0a0f1d]/50 p-5 text-left space-y-4 max-w-sm mx-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-white/5 p-3 text-center border border-white/5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    Products {action === "halt" ? "Halted" : "Restored"}
                  </div>
                  <div className="mt-1 text-2xl font-black text-white">
                    {action === "halt" ? result.products_halted : result.products_restored}
                  </div>
                </div>

                {action === "halt" && (
                  <div className="rounded-xl bg-white/5 p-3 text-center border border-white/5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                      Pending Orders
                    </div>
                    <div className="mt-1 text-2xl font-black text-white">
                      {result.pending_orders}
                    </div>
                  </div>
                )}
              </div>

              {action === "halt" && (
                <div className={`rounded-xl border p-4 text-xs leading-normal flex gap-2.5 items-start ${
                  result.safe_to_delete 
                    ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400" 
                    : "border-amber-500/20 bg-amber-500/5 text-amber-400"
                }`}>
                  <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-extrabold uppercase text-[10px] tracking-wider mb-0.5">
                      {result.safe_to_delete ? "Safe to Delete" : "Pending Action Required"}
                    </div>
                    {result.note}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8">
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-xl bg-primary py-3 text-xs font-extrabold uppercase tracking-wider text-white hover:bg-primary-hover cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
