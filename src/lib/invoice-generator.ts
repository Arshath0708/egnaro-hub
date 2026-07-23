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
  fileNameOverride?: string,
  element?: HTMLElement
): Promise<void> {
  const orderId = order?.order_id || String(order?.id || "Order");
  const cleanOrderId = orderId.replace(/[^a-zA-Z0-9-]/g, "_");
  const filename = fileNameOverride || `Invoice-${cleanOrderId}.pdf`;

  let sourceElement: HTMLElement;
  let container: HTMLDivElement | null = null;
  let root: any = null;

  if (element) {
    sourceElement = element;
  } else {
    // Create isolated container at exact top-left (0,0) of the viewport, behind the page content
    container = document.createElement("div");
    container.id = `pdf-export-container-${Date.now()}`;
    container.style.position = "fixed";
    container.style.left = "0px";
    container.style.top = "0px";
    container.style.width = "794px";
    container.style.height = "1123px";
    container.style.overflow = "hidden";
    container.style.zIndex = "-99999";
    container.style.pointerEvents = "none";
    container.style.backgroundColor = "#ffffff";

    document.body.appendChild(container);

    // Render InvoiceTemplate into container
    root = createRoot(container);
    await new Promise<void>((resolve) => {
      root.render(React.createElement(InvoiceTemplate, { order }));
      setTimeout(resolve, 80);
    });
    sourceElement = container;
  }

  try {
    // Wait for document fonts to be ready
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    // Wait for images inside the source element to fully decode
    const images = Array.from(sourceElement.querySelectorAll("img"));
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

    // Run html2pdf with A4 options
    const opt = {
      margin: 0,
      filename: filename,
      image: { type: "jpeg" as const, quality: 1.0 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        // If we are capturing an on-screen preview element (which may be scrolled),
        // we omit manual scrollX/scrollY overrides so html2canvas automatically aligns to the element's client rect.
        // If we are capturing our temporary fixed (0, 0) container, we set scrollX/Y to 0.
        ...(container ? { scrollX: 0, scrollY: 0 } : {}),
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
    };

    await html2pdf().set(opt).from(sourceElement).save();
  } catch (err) {
    console.error("PDF generation failed:", err);
    window.print();
  } finally {
    // Clean up temporary container if it was created
    if (container) {
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
    }

    // Clean up any stray html2canvas containers or iframe layers
    document.querySelectorAll(".html2canvas-container").forEach((el) => el.remove());
    document.querySelectorAll("iframe[id*='html2canvas']").forEach((el) => el.remove());

    // Restore body styles and viewport mutations if any
    document.body.style.pointerEvents = "";
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
