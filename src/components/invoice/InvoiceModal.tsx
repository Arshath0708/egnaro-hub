import { useState } from "react";
import { X, Download, Eye, FileText, Printer } from "lucide-react";
import { InvoiceTemplate, type OrderInvoiceProps } from "./InvoiceTemplate";
import { downloadInvoicePDF } from "@/lib/invoice-generator";

type InvoiceModalProps = OrderInvoiceProps & {
  isOpen: boolean;
  onClose: () => void;
};

export function InvoiceModal({ order, isOpen, onClose }: InvoiceModalProps) {
  const [downloading, setDownloading] = useState(false);

  if (!isOpen) return null;

  const orderId = order?.order_id || String(order?.id || "Order");

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadInvoicePDF(orderId, `modal-printable-invoice-${orderId}`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-3 sm:p-6 backdrop-blur-md animate-in fade-in duration-200">
      {/* MODAL WINDOW */}
      <div className="relative flex flex-col w-full max-w-4xl h-[92vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>Tax Invoice Preview</span>
                <span className="text-xs font-mono font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                  #{orderId}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Official Egnaro Mart Letterhead Tax Invoice
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={downloading}
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
          <div className="bg-white rounded-lg shadow-2xl overflow-hidden max-w-full">
            <div id={`modal-printable-invoice-${orderId}`}>
              <InvoiceTemplate order={order} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function InvoicePreviewButton({ order }: { order: any }) {
  const [isOpen, setIsOpen] = useState(false);

  const orderId = order?.order_id || String(order?.id || "Order");

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-slate-800/80 hover:bg-slate-700 text-slate-200 px-3.5 py-2 text-xs font-bold transition-all cursor-pointer shadow-sm"
        >
          <Eye className="h-4 w-4 text-orange-400" />
          <span>View Invoice</span>
        </button>

        <button
          onClick={() => downloadInvoicePDF(orderId, `modal-printable-invoice-${orderId}`)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white px-3.5 py-2 text-xs font-bold transition-all cursor-pointer shadow-md shadow-orange-600/20"
        >
          <Download className="h-4 w-4" />
          <span>Download PDF</span>
        </button>
      </div>

      <InvoiceModal order={order} isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
