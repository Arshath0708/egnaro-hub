import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { X, Trash2, AlertTriangle, Loader2, RefreshCw, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { deleteVendor } from "@/services/api";
import { QUERY_KEYS } from "@/lib/query-keys";

export function DeleteVendorModal({
  vendor,
  onClose,
}: {
  vendor: any;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [force, setForce] = useState(false);
  const [errorDetails, setErrorDetails] = useState<{
    message: string;
    active_orders?: number;
    hint?: string;
  } | null>(null);

  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    deleted_summary: {
      vendor: string;
      products_deleted: number;
      reviews_deleted: number;
    };
  } | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      setErrorDetails(null);
      const res = await deleteVendor(Number(vendor.id), force);
      if (!res.success) {
        setErrorDetails({
          message: res.message,
          active_orders: res.active_orders,
          hint: res.hint,
        });
        throw new Error(res.message || "Failed to delete vendor");
      }
      return res;
    },
    onSuccess: (data) => {
      setResult(data);
      toast.success("Vendor and associated products deleted permanently");
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_VENDORS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_PRODUCTS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PRODUCTS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_STATS] });
      queryClient.invalidateQueries({ queryKey: ["vendor-details"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Deletion failed due to active orders");
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
        className="relative w-full max-w-md rounded-[32px] border border-red-500/20 bg-gradient-to-b from-[#0a0f1d] to-[#05070a] p-8 text-center shadow-[0_30px_70px_rgba(0,0,0,0.8)] overflow-hidden"
      >
        <div className="absolute -top-12 -left-12 h-32 w-32 rounded-full blur-2xl opacity-10 bg-red-500 pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute right-6 top-6 flex h-8 w-8 items-center justify-center rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {!result ? (
          <>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20">
              <AlertTriangle className="h-8 w-8 text-red-500 animate-pulse" />
            </div>

            <h2 className="text-2xl font-black text-white tracking-wide">Delete Vendor</h2>
            <p className="mt-3 text-xs text-gray-400 leading-relaxed max-w-xs mx-auto">
              Are you sure you want to permanently delete{" "}
              <span className="font-extrabold text-white block my-1 text-sm">
                {vendor.vendor_name}
              </span>
              This action is destructive and will delete the vendor account, all their listed products, and product reviews.
            </p>

            {/* Error detail card from active order check */}
            {errorDetails && (
              <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-left space-y-2 max-w-sm mx-auto text-xs text-red-400 leading-normal animate-shake">
                <div className="font-extrabold uppercase text-[10px] tracking-wider text-red-500 flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Deletion Blocked By Safety Gate
                </div>
                <div>{errorDetails.message}</div>
                {errorDetails.hint && (
                  <div className="text-[11px] text-gray-400 italic mt-1.5 font-medium">
                    💡 {errorDetails.hint}
                  </div>
                )}

                {/* Force override checkbox */}
                <div className="pt-2 border-t border-red-500/10 mt-2">
                  <label className="flex items-center gap-2.5 text-xs text-gray-300 hover:text-white cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={force}
                      onChange={(e) => setForce(e.target.checked)}
                      className="h-4 w-4 rounded border border-white/10 bg-[#090d1a]/60 text-red-500 accent-red-500 cursor-pointer"
                    />
                    <span className="font-semibold text-red-400">
                      Force Delete (Skip pending orders check)
                    </span>
                  </label>
                </div>
              </div>
            )}

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
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 py-3 text-xs font-extrabold uppercase tracking-wider text-white transition hover:opacity-90 disabled:opacity-60 cursor-pointer"
              >
                {mutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                {force ? "Force Delete" : "Delete"}
              </button>
            </div>
          </>
        ) : (
          <div className="animate-fadeIn">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>

            <h2 className="text-2xl font-black text-white tracking-wide">
              Vendor Deleted
            </h2>
            <p className="mt-2 text-xs text-gray-400">
              {result.message}
            </p>

            <div className="mt-6 rounded-2xl border border-white/5 bg-[#0a0f1d]/50 p-5 text-left space-y-3 max-w-sm mx-auto">
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 border-b border-white/5 pb-1.5">
                Deletion Summary
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400 font-medium">Merchant:</span>
                  <span className="text-white font-extrabold">{result.deleted_summary.vendor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 font-medium">Products Wiped:</span>
                  <span className="text-white font-extrabold">{result.deleted_summary.products_deleted}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 font-medium">Reviews Cleared:</span>
                  <span className="text-white font-extrabold">{result.deleted_summary.reviews_deleted}</span>
                </div>
              </div>
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
