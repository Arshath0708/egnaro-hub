import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { deleteProduct } from "@/services/api";
import { QUERY_KEYS } from "@/lib/query-keys";

export function DeleteProductModal({
  product,
  vendorId,
  isAdmin,
  onClose,
}: {
  product: any;
  vendorId: string;
  isAdmin?: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await deleteProduct(product.id, vendorId, isAdmin);
      return response;
    },
    onSuccess: async () => {
      toast.success("Product deleted successfully");
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PRODUCTS] });
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.VENDOR_PRODUCTS_ALL] });
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.VENDOR_PRODUCTS_PAGINATED] });
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.VENDOR_STATS] });
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_PRODUCTS] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete product");
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

        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20">
          <AlertTriangle className="h-8 w-8 text-red-500 animate-pulse" />
        </div>

        <h2 className="text-2xl font-black text-white tracking-wide">Delete Product</h2>
        <p className="mt-3 text-xs text-gray-400 leading-relaxed max-w-xs mx-auto">
          Are you sure you want to delete <span className="font-extrabold text-white block my-1 text-sm">{product.name}</span> This action is permanent and cannot be undone.
        </p>

        <div className="mt-8 flex gap-3.5">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-xs font-extrabold uppercase tracking-wider text-white transition hover:bg-white/10 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 py-3 text-xs font-extrabold uppercase tracking-wider text-white transition hover:opacity-90 disabled:opacity-60 cursor-pointer"
          >
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  );
}
