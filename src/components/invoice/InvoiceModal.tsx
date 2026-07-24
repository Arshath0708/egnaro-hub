import { useState, useRef } from "react";
import { X, Download, Eye, FileText, Loader2 } from "lucide-react";
import { InvoiceTemplate, type OrderInvoiceProps } from "./InvoiceTemplate";
import { generateAndDownloadPDF } from "@/lib/invoice-generator";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-store";

type InvoiceModalProps = OrderInvoiceProps & {
  isOpen: boolean;
  onClose: () => void;
};

export function InvoiceModal({ order, isOpen, onClose }: InvoiceModalProps) {
  const [downloading, setDownloading] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  const token = useAuth((s) => s.token);
  const vendorId = useAuth((s) => s.vendorId);
  const admin = useAuth((s) => s.admin);

  // Extract the true string order_id (e.g. ORD-2026-...)
  const resolvedOrderId = order?.parent_order_id || 
                          (typeof order?.order_id === "string" && order.order_id.startsWith("ORD") ? order.order_id : null) || 
                          (typeof order?.id === "string" && order.id.startsWith("ORD") ? order.id : null) ||
                          order?.order_id || 
                          String(order?.id || "");

  // Query the full order details relationally to sync Customer, Vendor, and Admin previews
  const { data: fullOrder, isLoading, error } = useQuery({
    queryKey: ["full-order-details", resolvedOrderId],
    queryFn: async () => {
      if (!resolvedOrderId || resolvedOrderId === "Order" || resolvedOrderId === "0000") return null;
      const API_BASE = import.meta.env.VITE_API_URL || "/api";
      let url = `${API_BASE}/get-order.php?order_id=${resolvedOrderId}`;
      
      if (admin) {
        url += "&role=admin";
      } else if (vendorId) {
        url += `&role=vendor&vendor_id=${vendorId}`;
      } else if (token) {
        url += `&token=${encodeURIComponent(token)}`;
      }
      
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.order) {
        return data.order;
      }
      throw new Error(data.message || "Failed to load order");
    },
    enabled: isOpen && !!resolvedOrderId,
  });

  const handleDownload = async () => {
    const activeOrder = fullOrder || order;
    if (!activeOrder) return;
    setDownloading(true);
    try {
      await generateAndDownloadPDF(activeOrder, undefined, invoiceRef.current || undefined);
    } finally {
      setDownloading(false);
    }
  };

  const orderIdToShow = fullOrder?.order_id || resolvedOrderId;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl h-[92vh] flex flex-col p-0 gap-0 bg-slate-900 border-slate-800 overflow-hidden [&>button]:hidden">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>Tax Invoice Preview</span>
                <span className="text-xs font-mono font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                  #{orderIdToShow}
                </span>
              </DialogTitle>
              <p className="text-[11px] text-slate-400">
                Official Egnaro Mart Letterhead Tax Invoice
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={downloading || isLoading || !!error}
              className="inline-flex items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 text-xs font-bold transition-all cursor-pointer shadow-lg shadow-orange-600/20 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              <span>{downloading ? "Generating PDF..." : "Download PDF"}</span>
            </button>

            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* MODAL SCROLLABLE INVOICE BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-950/60 flex justify-center items-start">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
              <p className="text-sm font-semibold">Loading secure order invoice...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-red-400 gap-2 text-center max-w-md mx-auto">
              <p className="text-sm font-extrabold">Failed to load order invoice details.</p>
              <p className="text-xs text-slate-500">{(error as any)?.message || "Forbidden or invalid session"}</p>
            </div>
          ) : (
            <div ref={invoiceRef} className="bg-white rounded-lg shadow-2xl overflow-hidden max-w-full">
              <InvoiceTemplate order={fullOrder || order} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function InvoicePreviewButton({ order }: { order: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const token = useAuth((s) => s.token);
  const vendorId = useAuth((s) => s.vendorId);
  const admin = useAuth((s) => s.admin);

  const resolvedOrderId = order?.parent_order_id || 
                          (typeof order?.order_id === "string" && order.order_id.startsWith("ORD") ? order.order_id : null) || 
                          (typeof order?.id === "string" && order.id.startsWith("ORD") ? order.id : null) ||
                          order?.order_id || 
                          String(order?.id || "");

  const handleDirectDownload = async () => {
    setDownloading(true);
    try {
      const API_BASE = import.meta.env.VITE_API_URL || "/api";
      let url = `${API_BASE}/get-order.php?order_id=${resolvedOrderId}`;
      if (admin) {
        url += "&role=admin";
      } else if (vendorId) {
        url += `&role=vendor&vendor_id=${vendorId}`;
      } else if (token) {
        url += `&token=${encodeURIComponent(token)}`;
      }
      
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.order) {
        await generateAndDownloadPDF(data.order);
      } else {
        await generateAndDownloadPDF(order);
      }
    } catch (err) {
      console.error("Direct PDF fetch failed, falling back", err);
      await generateAndDownloadPDF(order);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-slate-800/80 hover:bg-slate-700 text-slate-200 px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer shadow-sm"
        >
          <Eye className="h-4 w-4 text-orange-400" />
          <span>View Invoice</span>
        </button>

        <button
          type="button"
          onClick={handleDirectDownload}
          disabled={downloading}
          className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer shadow-md shadow-orange-600/20 disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          <span>{downloading ? "PDF..." : "Download PDF"}</span>
        </button>
      </div>

      <InvoiceModal order={order} isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
