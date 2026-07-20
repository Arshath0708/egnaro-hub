import html2pdf from "html2pdf.js";

/**
 * Downloads a rendered HTML invoice container as a high-resolution PDF file.
 * Filename format: Invoice-{OrderID}.pdf
 */
export async function downloadInvoicePDF(orderId: string, elementId: string = "printable-invoice"): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Invoice element #${elementId} not found in DOM`);
    window.print();
    return;
  }

  const cleanOrderId = (orderId || "Order").replace(/[^a-zA-Z0-9-]/g, "_");
  const filename = `Invoice-${cleanOrderId}.pdf`;

  const opt = {
    margin: 0,
    filename: filename,
    image: { type: "jpeg" as const, quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false, scrollX: 0, scrollY: 0 },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
  };

  try {
    await html2pdf().set(opt).from(element).save();
  } catch (err) {
    console.error("PDF generation error, falling back to print dialog:", err);
    window.print();
  }
}
