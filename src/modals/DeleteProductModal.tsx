import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { deleteProduct } from "@/services/api";

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
      if (isAdmin) {
        await queryClient.invalidateQueries({
          queryKey: ["products"],
        });
      } else {
        await queryClient.invalidateQueries({
          queryKey: ["vendor-products", vendorId],
        });
        await queryClient.invalidateQueries({
          queryKey: ["vendor-stats", vendorId],
        });
      }
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete product");
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-md rounded-[36px] border border-red-500/20 bg-[#050816] p-8 text-center shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white transition hover:bg-white/10"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10">
          <AlertTriangle className="h-10 w-10 text-red-500" />
        </div>

        <h2 className="text-3xl font-black text-white">Delete Product</h2>
        <p className="mt-3 text-gray-400">
          Are you sure you want to delete <span className="font-bold text-white">{product.name}</span>? This action cannot be undone.
        </p>

        <div className="mt-8 flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-4 font-bold text-white transition hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-red-500 py-4 font-bold text-white transition hover:bg-red-600 disabled:opacity-60"
          >
            <Trash2 className="h-5 w-5" />
            {mutation.isPending ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
