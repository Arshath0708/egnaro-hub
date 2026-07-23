import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import React from "react";
import { createRoot } from "react-dom/client";
import { InvoiceTemplate } from "@/components/invoice/InvoiceTemplate";

/**
 * Enterprise PDF Generator for Egnaro Mart Invoices using html2canvas & jsPDF directly.
 * Clones the pre-rendered preview element (or dynamically mounts a temporary target)
 * into a fixed viewport wrapper at (0, 0) with a low z-index, captures the canvas region,
 * maps it to exactly one A4 sheet, and executes strict DOM & memory cleanup.
 */
export async function generateAndDownloadPDF(
  order: any,
  fileNameOverride?: string,
  element?: HTMLElement
): Promise<void> {
  const orderId = order?.order_id || String(order?.id || "Order");
  const cleanOrderId = orderId.replace(/[^a-zA-Z0-9-]/g, "_");
  const filename = fileNameOverride || `Invoice-${cleanOrderId}.pdf`;

  let wrapper: HTMLDivElement | null = null;
  let root: any = null;

  try {
    // Create isolated wrapper container at exact (0, 0) of viewport, behind the page layout
    wrapper = document.createElement("div");
    wrapper.id = `pdf-export-wrapper-${Date.now()}`;
    wrapper.style.position = "fixed";
    wrapper.style.left = "0px";
    wrapper.style.top = "0px";
    wrapper.style.width = "794px";
    wrapper.style.height = "1123px";
    wrapper.style.overflow = "hidden";
    wrapper.style.zIndex = "-999999";
    wrapper.style.pointerEvents = "none";
    wrapper.style.backgroundColor = "#ffffff";
    document.body.appendChild(wrapper);

    let targetNode: HTMLElement;

    if (element) {
      // Direct clone of the on-screen preview element (maintaining pixel-perfect styles)
      targetNode = element.cloneNode(true) as HTMLElement;
      targetNode.style.position = "relative";
      targetNode.style.left = "0px";
      targetNode.style.top = "0px";
      targetNode.style.margin = "0px";
      targetNode.style.transform = "none";
      targetNode.style.boxShadow = "none";
      wrapper.appendChild(targetNode);
    } else {
      // If direct download from order details card, render InvoiceTemplate dynamically
      const renderContainer = document.createElement("div");
      renderContainer.style.width = "794px";
      renderContainer.style.minHeight = "1123px";
      wrapper.appendChild(renderContainer);

      root = createRoot(renderContainer);
      root.render(React.createElement(InvoiceTemplate, { order }));

      // Wait for React to finish rendering
      await new Promise<void>((resolve) => setTimeout(resolve, 200));
      targetNode = renderContainer;
    }

    // Wait for document fonts to be ready
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    // Wait for images to fully decode
    const images = Array.from(wrapper.querySelectorAll("img"));
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

    // Let the browser paint
    await new Promise((r) => setTimeout(r, 120));

    // Capture canvas at standard width/height matching A4 aspect ratio
    const canvas = await html2canvas(wrapper, {
      scale: 2, // High resolution print scale
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
      scrollX: 0,
      scrollY: 0,
      width: 794,
      height: 1123,
      onclone: (clonedDoc) => {
        // Strip out every stylesheet and style tag EXCEPT the scoped styles for the invoice.
        // This prevents html2canvas from parsing stylesheets containing unsupported color functions like "oklch" (which Tailwind v4 uses).
        const styles = Array.from(clonedDoc.querySelectorAll("style, link[rel='stylesheet']"));
        styles.forEach((el) => {
          if (el.id !== "invoice-scoped-styles") {
            el.remove();
          }
        });
      }
    });

    const imgData = canvas.toDataURL("image/jpeg", 1.0);
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // 210mm x 297mm (exactly maps canvas image to one A4 page)
    pdf.addImage(imgData, "JPEG", 0, 0, 210, 297, undefined, "FAST");
    pdf.save(filename);

    // Free canvas graphics memory immediately
    canvas.width = 0;
    canvas.height = 0;

  } catch (err) {
    console.error("PDF generation failed:", err);
    alert("PDF generation failed. Please try again.");
  } finally {
    // Unmount and clean up React root if created
    if (root) {
      try {
        root.unmount();
      } catch {
        // ignore unmount errors
      }
    }

    // Strict DOM Cleanup: remove temporary wrapper and all cloned nodes
    if (wrapper && document.body.contains(wrapper)) {
      wrapper.remove();
    }

    // Remove any leftover html2canvas containers
    document.querySelectorAll(".html2canvas-container").forEach((el) => el.remove());

    // Explicitly restore document/body styles and viewport parameters to prevent freezing
    document.body.style.pointerEvents = "";
    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";
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
