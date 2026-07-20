import html2pdf from "html2pdf.js";
import React from "react";
import { createRoot } from "react-dom/client";
import { InvoiceTemplate } from "@/components/invoice/InvoiceTemplate";

/**
 * Enterprise PDF Generator for Egnaro Mart Invoices.
 * Renders an isolated, pixel-perfect A4 canvas (794px x 1123px),
 * waits for font & image decoding, exports to A4 PDF,
 * and performs strict DOM/pointer-events cleanup.
 */
export async function generateAndDownloadPDF(
  order: any,
  fileNameOverride?: string
): Promise<void> {
  const orderId = order?.order_id || String(order?.id || "Order");
  const cleanOrderId = orderId.replace(/[^a-zA-Z0-9-]/g, "_");
  const filename = fileNameOverride || `Invoice-${cleanOrderId}.pdf`;

  // 1. Create isolated offscreen container (outside viewport, zero pointer interference)
  const container = document.createElement("div");
  container.id = `pdf-export-container-${Date.now()}`;
  container.style.position = "absolute";
  container.style.left = "-99999px";
  container.style.top = "0px";
  container.style.width = "794px";
  container.style.height = "1123px";
  container.style.overflow = "hidden";
  container.style.zIndex = "-99999";
  container.style.pointerEvents = "none";
  container.style.backgroundColor = "#ffffff";

  document.body.appendChild(container);

  let root: any = null;

  try {
    // 2. Render InvoiceTemplate into container using React.createElement
    root = createRoot(container);
    await new Promise<void>((resolve) => {
      root.render(React.createElement(InvoiceTemplate, { order }));
      setTimeout(resolve, 50);
    });

    // 3. Wait for document fonts to be ready
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    // 4. Wait for images to fully decode
    const images = Array.from(container.querySelectorAll("img"));
    await Promise.all(
      images.map(
        (img) =>
          new Promise<void>((res) => {
            if (img.complete && img.naturalWidth !== 0) {
              res();
            } else {
              img.onload = () => res();
              img.onerror = () => res();
            }
          })
      )
    );

    // Short paint delay for browser rendering engine
    await new Promise((r) => setTimeout(r, 120));

    // 5. Run html2pdf with A4 options and const orientation
    const opt = {
      margin: 0,
      filename: filename,
      image: { type: "jpeg" as const, quality: 1.0 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        scrollX: 0,
        scrollY: 0,
        // Removed windowWidth and windowHeight to prevent html2canvas from mutating global viewport dimensions
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
    };

    await html2pdf().set(opt).from(container).save();
  } catch (err) {
    console.error("PDF generation failed:", err);
    window.print();
  } finally {
    // 6. STRICT CLEANUP: Unmount React root & remove DOM nodes
    if (root) {
      try {
        root.unmount();
      } catch {
        // ignore unmount errors
      }
    }

    if (document.body.contains(container)) {
      container.remove();
    }

    // Clean up any stray html2canvas containers or iframe layers
    document.querySelectorAll(".html2canvas-container").forEach((el) => el.remove());
    document.querySelectorAll("iframe[id*='html2canvas']").forEach((el) => el.remove());

    // Restore body pointer events and overflow
    document.body.style.pointerEvents = "";
    
    // Explicitly restore any viewport mutations made by html2canvas
    document.documentElement.style.width = "";
    document.documentElement.style.height = "";
    document.body.style.width = "";
    document.body.style.height = "";
  }
}

// Retain alias for backward compatibility
export const downloadInvoicePDF = (orderId: string, elementId?: string) => {
  console.log("Using generateAndDownloadPDF for order:", orderId, elementId);
  return generateAndDownloadPDF({ order_id: orderId, id: orderId });
};
