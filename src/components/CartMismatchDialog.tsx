import { AlertTriangle, Trash2, ArrowRight } from "lucide-react";
import { useCart } from "@/context/cart-store";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function CartMismatchDialog() {
  const mismatchDetails = useCart((s) => s.mismatchDetails);
  const confirmAdd = useCart((s) => s.confirmAdd);
  const clearMismatch = useCart((s) => s.clearMismatch);

  if (!mismatchDetails) return null;

  const handleConfirm = () => {
    confirmAdd();
    toast.success("Cart cleared & new product added!", {
      description: mismatchDetails.name,
      icon: <Trash2 className="h-4 w-4 text-orange-400" />,
    });
  };

  return (
    <Dialog open={mismatchDetails !== null} onOpenChange={(open) => !open && clearMismatch()}>
      <DialogContent className="max-w-md w-[90vw] p-6 bg-slate-900 border border-slate-800 text-white rounded-3xl overflow-hidden shadow-2xl flex flex-col gap-6 [&>button]:hidden">
        
        {/* ICON AND TITLE */}
        <div className="flex flex-col items-center text-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 shadow-lg">
            <AlertTriangle className="h-7 w-7 animate-pulse" />
          </div>
          
          <div className="space-y-1">
            <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight text-white">
              Seller Mismatch Detected
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs sm:text-sm font-medium leading-relaxed">
              Your cart already contains products from another seller. To continue shopping from this seller, your current cart must be cleared.
            </DialogDescription>
          </div>
        </div>

        {/* DETAILS OF NEW PRODUCT */}
        <div className="rounded-2xl border border-white/5 bg-white/5 p-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
              Pending Item
            </div>
            <div className="text-sm font-bold text-slate-100 truncate mt-0.5" title={mismatchDetails.name}>
              {mismatchDetails.name}
            </div>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 text-xs font-mono font-extrabold shrink-0">
            x{mismatchDetails.quantity}
          </div>
        </div>

        {/* BUTTON ACTION BUTTONS */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={clearMismatch}
            className="flex-1 order-2 sm:order-1 inline-flex items-center justify-center rounded-xl border border-white/10 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-4 py-3.5 text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-98 w-full sm:w-auto"
          >
            Continue Shopping
          </button>

          <button
            onClick={handleConfirm}
            className="flex-1 order-1 sm:order-2 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white px-4 py-3.5 text-xs font-bold transition-all cursor-pointer shadow-lg shadow-orange-600/10 active:scale-98 w-full sm:w-auto"
          >
            <span>Clear & Add</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

      </DialogContent>
    </Dialog>
  );
}
