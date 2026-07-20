import React from "react";
import invoiceLogo from "@/assets/invoice-logo.png";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Product {
  name: string;
  sku: string;
  qty: number;
  unitPrice: number;
  shipping: number;
  discount: number;
}

interface InvoiceData {
  invoiceNumber: string;
  orderId: string;
  invoiceDate: string;
  dueDate: string;
  paymentMethod: string;
  paymentStatus: "Paid" | "Pending" | "Failed";
  orderStatus: "Delivered" | "Processing" | "Shipped" | "Cancelled";
  seller: {
    name: string;
    company: string;
    gst: string;
    address: string;
    email: string;
    phone: string;
  };
  buyer: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
  products: Product[];
}

// ─── Default Empty Production Data ────────────────────────────────────────────
const defaultEmptyInvoiceData: InvoiceData = {
  invoiceNumber: "INV-0000",
  orderId: "N/A",
  invoiceDate: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
  dueDate: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
  paymentMethod: "COD",
  paymentStatus: "Pending",
  orderStatus: "Processing",
  seller: {
    name: "Egnaro Mart Seller",
    company: "Egnaro Mart Marketplace",
    gst: "N/A",
    address: "No: 2A, Venkatesh Nagar, Kovilpalayam, Coimbatore – 641107, Tamil Nadu",
    email: "egnaromart@gmail.com",
    phone: "+91 9442581506",
  },
  buyer: {
    name: "Valued Customer",
    address: "Delivery Address Provided at Checkout",
    phone: "N/A",
    email: "N/A",
  },
  products: [],
};

// ─── Database Order Mapper ──────────────────────────────────────────────────
export function mapOrderToInvoiceData(order: any): InvoiceData {
  if (!order) return defaultEmptyInvoiceData;

  const rawOrderId = order.order_id || String(order.id || "0000");
  const invoiceNumber = `INV-${rawOrderId.replace(/^ORD-/, "").replace(/^EM-ORD-/, "")}`;
  
  const invoiceDate = order.created_at
    ? new Date(order.created_at).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

  const rawItems = Array.isArray(order.items)
    ? order.items
    : typeof order.items === "string"
    ? JSON.parse(order.items || "[]")
    : [];

  const firstItem = rawItems[0] || {};

  const sellerObj = order.seller || {};
  const seller = {
    name: sellerObj.name || sellerObj.vendor_name || firstItem.seller_name || "Egnaro Mart Seller",
    company: sellerObj.company_name || sellerObj.company || firstItem.company_name || "Egnaro Mart Marketplace",
    gst: sellerObj.gst || firstItem.gst || "N/A",
    address: sellerObj.address || firstItem.seller_address || "No: 2A, Venkatesh Nagar, Sarkarsamakulam, Kovilpalayam, Coimbatore – 641107, Tamil Nadu",
    email: sellerObj.email || firstItem.seller_email || "egnaromart@gmail.com",
    phone: sellerObj.phone || firstItem.seller_phone || "+91 9442581506",
  };

  const buyer = {
    name: order.customer_name || order.customer?.fullName || "Valued Buyer",
    address: order.address || order.customer?.address || "Delivery Address Provided at Checkout",
    phone: order.phone || order.customer?.phone || "N/A",
    email: order.email || order.customer?.email || "N/A",
  };

  const shippingChargesTotal = Number(order.shipping_charges || 0);
  const discountTotal = Number(order.discount || 0);

  const products: Product[] = rawItems.map((item: any, idx: number) => {
    const qty = Number(item.quantity || item.qty || 1);
    const unitPrice = Number(item.price || 0);
    const shipping = item.shipping !== undefined ? Number(item.shipping) : (idx === 0 ? shippingChargesTotal : 0);
    const discount = item.discount !== undefined ? Number(item.discount) : (idx === 0 ? discountTotal : 0);

    return {
      name: item.name || item.title || "Product Item",
      sku: item.sku || (item.product_id ? `EM-PROD-${item.product_id}` : `EM-ITEM-${idx + 1}`),
      qty,
      unitPrice,
      shipping,
      discount,
    };
  });

  if (products.length === 0) {
    products.push({
      name: "Egnaro Mart Order Purchase",
      sku: `EM-ORD-${rawOrderId}`,
      qty: 1,
      unitPrice: Number(order.subtotal || order.total || 0),
      shipping: shippingChargesTotal,
      discount: discountTotal,
    });
  }

  const rawPaymentStatus = (order.payment_status || "").toLowerCase();
  const paymentStatus: "Paid" | "Pending" | "Failed" =
    rawPaymentStatus === "paid" || order.payment_method === "upi" || order.payment_method === "online"
      ? "Paid"
      : rawPaymentStatus === "failed"
      ? "Failed"
      : "Pending";

  const rawOrderStatus = (order.status || "").toLowerCase();
  const orderStatus: "Delivered" | "Processing" | "Shipped" | "Cancelled" =
    rawOrderStatus === "delivered"
      ? "Delivered"
      : rawOrderStatus === "cancelled"
      ? "Cancelled"
      : rawOrderStatus === "shipped" || rawOrderStatus === "out-for-delivery"
      ? "Shipped"
      : "Processing";

  return {
    invoiceNumber,
    orderId: rawOrderId,
    invoiceDate,
    dueDate: invoiceDate,
    paymentMethod: (order.payment_method || "COD").toUpperCase(),
    paymentStatus,
    orderStatus,
    seller,
    buyer,
    products,
  };
}

// ─── Calculations ─────────────────────────────────────────────────────────────
function calcRow(p: Product) {
  const lineTotal = p.unitPrice * p.qty;
  const total = lineTotal + p.shipping - p.discount;
  return { lineTotal, total };
}

function calcSummary(products: Product[]) {
  let subtotal = 0, shipping = 0, discount = 0;
  for (const p of products) {
    subtotal += p.unitPrice * p.qty;
    shipping += p.shipping;
    discount += p.discount;
  }
  const grand = subtotal + shipping - discount;
  return { subtotal, shipping, discount, grand };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

// ─── Sub-Components ───────────────────────────────────────────────────────────
const StatusPill: React.FC<{ label: string; type: "green" | "amber" | "red" | "blue" }> = ({ label, type }) => {
  const styles = {
    green: { bg: "#ECFDF5", color: "#065F46", dot: "#10B981" },
    amber: { bg: "#FFFBEB", color: "#92400E", dot: "#F59E0B" },
    red:   { bg: "#FEF2F2", color: "#991B1B", dot: "#EF4444" },
    blue:  { bg: "#EFF6FF", color: "#1E40AF", dot: "#3B82F6" },
  }[type];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: styles.bg, color: styles.color,
      padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: styles.dot, display: "inline-block" }} />
      {label}
    </span>
  );
};

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ display: "flex", gap: 6, marginBottom: 5, lineHeight: 1.5 }}>
    <span style={{ color: "#9CA3AF", fontSize: 11, minWidth: 96, flexShrink: 0 }}>{label}</span>
    <span style={{ color: "#111827", fontSize: 11, fontWeight: 500, wordBreak: "break-word" }}>{value}</span>
  </div>
);

const SectionCard: React.FC<{ title: string; children: React.ReactNode; accent?: string }> = ({
  title, children, accent = "#E8500A"
}) => (
  <div style={{
    background: "#FFFFFF", border: "1px solid #F3F4F6",
    borderRadius: 12, overflow: "hidden",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)",
  }}>
    <div style={{
      padding: "10px 16px", borderBottom: "1px solid #F9FAFB",
      display: "flex", alignItems: "center", gap: 8, background: "#FAFAFA",
    }}>
      <div style={{ width: 3, height: 14, background: accent, borderRadius: 2, flexShrink: 0 }} />
      <span style={{ fontSize: 11, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.06em" }}>{title}</span>
    </div>
    <div style={{ padding: "14px 16px" }}>{children}</div>
  </div>
);

// ─── Main Invoice Component ───────────────────────────────────────────────────
export const EgnaroMartInvoice: React.FC<{ data?: InvoiceData }> = ({ data = defaultEmptyInvoiceData }) => {
  const summary = calcSummary(data.products);

  const paymentColor = data.paymentStatus === "Paid" ? "green" : data.paymentStatus === "Pending" ? "amber" : "red";
  const orderColor   = data.orderStatus === "Delivered" ? "green" : data.orderStatus === "Cancelled" ? "red" : data.orderStatus === "Shipped" ? "blue" : "amber";

  return (
    <>
      {/* ── Global Print Styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: #F1F5F9;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .invoice-page {
          width: 794px;
          min-height: 1123px;
          margin: 0 auto;
          background: #FFFFFF;
          border-radius: 0;
          overflow: hidden;
          box-shadow: none;
        }

        @media print {
          body { background: white; }
          .invoice-page {
            margin: 0;
            border-radius: 0;
            box-shadow: none;
            width: 794px;
            min-height: 1123px;
          }
          .no-print { display: none !important; }
        }

        table { border-collapse: collapse; width: 100%; }
      `}</style>

      {/* ══ INVOICE PAGE ══════════════════════════════════════════════════════ */}
      <div className="invoice-page">

        {/* ── TOP ACCENT BAR ── */}
        <div style={{ height: 5, background: "linear-gradient(90deg, #E8500A 0%, #F59E0B 50%, #16A34A 100%)" }} />

        {/* ── HEADER ─────────────────────────────────────────────────────────── */}
        <div style={{ padding: "24px 36px 20px", borderBottom: "1px solid #F3F4F6" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>

            {/* Logo + Contact Info */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <img
                  src={invoiceLogo}
                  alt="Egnaro Mart Logo"
                  style={{
                    height: "54px",
                    width: "auto",
                    maxHeight: "60px",
                    maxWidth: "260px",
                    objectFit: "contain",
                    display: "block",
                  }}
                />
              </div>

              {/* Contact row */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px", marginTop: 4 }}>
                {[
                  { icon: "🌐", val: "egnaromart.com" },
                  { icon: "✉️", val: "egnaromart@gmail.com" },
                  { icon: "📞", val: "+91 9442581506" },
                ].map(({ icon, val }) => (
                  <span key={val} style={{ fontSize: 10.5, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
                    <span>{icon}</span>{val}
                  </span>
                ))}
              </div>
              <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 2 }}>
                No: 2A, Venkatesh Nagar, Sarkarsamakulam, Kovilpalayam, Coimbatore – 641107 TN
              </div>
            </div>

            {/* Invoice label */}
            <div style={{ textAlign: "right" }}>
              <div style={{
                background: "linear-gradient(135deg, #FFF7ED, #FEF2F2)",
                border: "1px solid #FED7AA", borderRadius: 10, padding: "12px 20px", marginBottom: 10,
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#9A3412", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 3 }}>
                  Tax Invoice
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#E8500A", letterSpacing: -0.5 }}>
                  {data.invoiceNumber}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 3, alignItems: "flex-end" }}>
                <StatusPill label={data.paymentStatus} type={paymentColor as any} />
                <StatusPill label={data.orderStatus} type={orderColor as any} />
              </div>
            </div>
          </div>
        </div>

        {/* ── INVOICE META BAND ───────────────────────────────────────────────── */}
        <div style={{
          background: "#F9FAFB", borderBottom: "1px solid #F3F4F6",
          padding: "12px 36px", display: "flex", gap: 0,
        }}>
          {[
            { label: "Order ID",        value: data.orderId },
            { label: "Invoice Date",    value: data.invoiceDate },
            { label: "Due Date",        value: data.dueDate },
            { label: "Payment Method",  value: data.paymentMethod },
          ].map(({ label, value }, i) => (
            <div key={label} style={{
              flex: 1, paddingLeft: i === 0 ? 0 : 20,
              borderLeft: i === 0 ? "none" : "1px solid #E5E7EB",
            }}>
              <div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>
                {label}
              </div>
              <div style={{ fontSize: 11.5, color: "#111827", fontWeight: 600 }}>{value}</div>
            </div>
          ))}
        </div>

        {/* ── SELLER / BUYER ──────────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: "16px 36px" }}>

          <SectionCard title="Sold By — Seller Details" accent="#16A34A">
            <InfoRow label="Name"    value={data.seller.name} />
            <InfoRow label="Company" value={data.seller.company} />
            <InfoRow label="GSTIN"   value={data.seller.gst} />
            <InfoRow label="Address" value={data.seller.address} />
            <InfoRow label="Email"   value={data.seller.email} />
            <InfoRow label="Phone"   value={data.seller.phone} />
          </SectionCard>

          <SectionCard title="Bill To — Buyer Details" accent="#3B82F6">
            <InfoRow label="Name"    value={data.buyer.name} />
            <InfoRow label="Address" value={data.buyer.address} />
            <InfoRow label="Phone"   value={data.buyer.phone} />
            <InfoRow label="Email"   value={data.buyer.email} />
          </SectionCard>
        </div>

        {/* ── PRODUCTS TABLE ──────────────────────────────────────────────────── */}
        <div style={{ padding: "0 36px 16px" }}>
          <div style={{
            border: "1px solid #F3F4F6", borderRadius: 12, overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}>
            {/* Table header */}
            <div style={{
              background: "#111827", padding: "11px 16px",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <div style={{ width: 3, height: 14, background: "#E8500A", borderRadius: 2 }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#F9FAFB", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Order Items
              </span>
            </div>

            <table>
              <thead>
                <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #F3F4F6" }}>
                  {["#", "Product", "SKU", "Qty", "Unit Price", "Shipping", "Discount", "Total"].map((h, i) => (
                    <th key={h} style={{
                      padding: "9px 12px", fontSize: 10, fontWeight: 700,
                      color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.06em",
                      textAlign: i >= 3 ? "right" : i === 0 ? "center" : "left",
                      whiteSpace: "nowrap",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.products.map((p, i) => {
                  const { total } = calcRow(p);
                  return (
                    <tr key={`${p.sku}-${i}`} style={{
                      borderBottom: i < data.products.length - 1 ? "1px solid #F9FAFB" : "none",
                      background: i % 2 === 0 ? "#FFFFFF" : "#FAFAFA",
                    }}>
                      <td style={{ padding: "11px 12px", textAlign: "center" }}>
                        <span style={{
                          width: 20, height: 20, borderRadius: "50%",
                          background: "#FFF7ED", color: "#E8500A",
                          fontSize: 10, fontWeight: 700, display: "inline-flex",
                          alignItems: "center", justifyContent: "center",
                        }}>{i + 1}</span>
                      </td>
                      <td style={{ padding: "11px 12px" }}>
                        <div style={{ fontSize: 11.5, fontWeight: 600, color: "#111827", marginBottom: 2 }}>{p.name}</div>
                      </td>
                      <td style={{ padding: "11px 12px" }}>
                        <span style={{
                          fontSize: 10, color: "#6B7280", background: "#F3F4F6",
                          padding: "2px 7px", borderRadius: 4, fontFamily: "monospace", whiteSpace: "nowrap",
                        }}>{p.sku}</span>
                      </td>
                      <td style={{ padding: "11px 12px", textAlign: "right", fontSize: 12, fontWeight: 600, color: "#374151" }}>{p.qty}</td>
                      <td style={{ padding: "11px 12px", textAlign: "right", fontSize: 12, color: "#374151", whiteSpace: "nowrap" }}>{fmt(p.unitPrice)}</td>
                      <td style={{ padding: "11px 12px", textAlign: "right", fontSize: 12, color: "#374151", whiteSpace: "nowrap" }}>
                        {p.shipping > 0 ? fmt(p.shipping) : <span style={{ color: "#10B981", fontSize: 10, fontWeight: 600 }}>FREE</span>}
                      </td>
                      <td style={{ padding: "11px 12px", textAlign: "right", fontSize: 12, color: p.discount > 0 ? "#10B981" : "#9CA3AF", whiteSpace: "nowrap" }}>
                        {p.discount > 0 ? `−${fmt(p.discount)}` : "—"}
                      </td>
                      <td style={{ padding: "11px 12px", textAlign: "right" }}>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: "#111827", whiteSpace: "nowrap" }}>{fmt(total)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── FINANCIAL SUMMARY ───────────────────────────────────────────────── */}
        <div style={{ padding: "0 36px 16px", display: "flex", justifyContent: "flex-end" }}>
          <div style={{
            width: 300, background: "#FFFFFF", border: "1px solid #F3F4F6",
            borderRadius: 12, overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}>
            {/* Header */}
            <div style={{
              background: "#F9FAFB", padding: "10px 16px", borderBottom: "1px solid #F3F4F6",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <div style={{ width: 3, height: 14, background: "#E8500A", borderRadius: 2 }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Payment Summary
              </span>
            </div>

            <div style={{ padding: "12px 16px" }}>
              {[
                { label: "Subtotal",          value: fmt(summary.subtotal),  color: "#374151", bold: false },
                { label: "Shipping Charges",  value: fmt(summary.shipping),  color: "#374151", bold: false },
                { label: "Total Discount",    value: `−${fmt(summary.discount)}`, color: "#10B981", bold: false },
              ].map(({ label, value, color, bold }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: "#6B7280" }}>{label}</span>
                  <span style={{ fontSize: 11, color, fontWeight: bold ? 700 : 500 }}>{value}</span>
                </div>
              ))}

              <div style={{ height: 1, background: "#F3F4F6", margin: "10px 0" }} />

              {/* Grand total */}
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                background: "linear-gradient(135deg, #FFF7ED, #FEF2F2)",
                border: "1px solid #FED7AA", borderRadius: 8, padding: "10px 12px",
              }}>
                <div>
                  <div style={{ fontSize: 10, color: "#9A3412", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Grand Total</div>
                  <div style={{ fontSize: 9.5, color: "#C2410C", marginTop: 1 }}>Inclusive of all taxes</div>
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#E8500A" }}>{fmt(summary.grand)}</div>
              </div>

              {/* Paid stamp */}
              {data.paymentStatus === "Paid" && (
                <div style={{
                  marginTop: 10, textAlign: "center", padding: "7px",
                  background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 8,
                }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#065F46" }}>✓ Payment Received — Thank You!</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── TERMS & DISCLAIMER ──────────────────────────────────────────────── */}
        <div style={{ padding: "0 36px 16px" }}>
          <div style={{
            background: "#F9FAFB", border: "1px solid #F3F4F6", borderRadius: 10, padding: "12px 16px",
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 7 }}>
              Terms & Conditions
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 24px" }}>
              {[
                "This is a computer-generated invoice and does not require a physical signature.",
                "Goods once sold will only be taken back per the platform's return & refund policy.",
                "For disputes or queries, contact support within 7 days of delivery.",
                "All prices are inclusive of applicable GST as per Indian tax regulations.",
                "Egnaro Mart acts as a marketplace facilitator and is not directly liable for product quality.",
                "The seller is solely responsible for product authenticity, warranty, and after-sales support.",
              ].map((term) => (
                <div key={term} style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                  <span style={{ color: "#E8500A", fontSize: 9, marginTop: 2, flexShrink: 0 }}>▸</span>
                  <span style={{ fontSize: 9.5, color: "#6B7280", lineHeight: 1.5 }}>{term}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
        <div style={{ marginTop: "auto" }}>
          {/* Support band */}
          <div style={{
            padding: "10px 36px", borderTop: "1px solid #F3F4F6", borderBottom: "1px solid #F3F4F6",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            background: "#FAFAFA",
          }}>
            <span style={{ fontSize: 10, color: "#6B7280" }}>
              Support: <strong style={{ color: "#111827" }}>egnaromart@gmail.com</strong>
            </span>
            <span style={{ fontSize: 10, color: "#6B7280" }}>
              Phone: <strong style={{ color: "#111827" }}>+91 9442581506</strong>
            </span>
            <span style={{ fontSize: 10, color: "#6B7280" }}>
              Web: <strong style={{ color: "#E8500A" }}>egnaromart.com</strong>
            </span>
          </div>

          {/* Trust badges */}
          <div style={{ padding: "12px 36px", background: "#FFFFFF" }}>
            <div style={{ display: "flex", justifyContent: "center", gap: 0, borderTop: "1px solid #F3F4F6", paddingTop: 12 }}>
              {[
                { icon: "✔", label: "Verified Sellers",    color: "#16A34A" },
                { icon: "★", label: "Genuine Products",    color: "#F59E0B" },
                { icon: "🚚", label: "Fast & Reliable Delivery", color: "#E8500A" },
                { icon: "🔒", label: "Secure Payments",    color: "#3B82F6" },
                { icon: "🎧", label: "Dedicated Support",  color: "#8B5CF6" },
              ].map(({ icon, label, color }, i) => (
                <div key={label} style={{
                  flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                  padding: "0 12px",
                  borderLeft: i > 0 ? "1px solid #F3F4F6" : "none",
                }}>
                  <span style={{ fontSize: 16, color }}>{icon}</span>
                  <span style={{ fontSize: 9, color: "#6B7280", fontWeight: 500, textAlign: "center", lineHeight: 1.3 }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom color bar */}
          <div style={{ display: "flex", height: 6 }}>
            <div style={{ flex: 1, background: "#16A34A" }} />
            <div style={{ flex: 1, background: "#F59E0B" }} />
            <div style={{ flex: 1, background: "#E8500A" }} />
          </div>
        </div>

      </div>
      {/* end invoice-page */}
    </>
  );
};

export type OrderInvoiceProps = {
  order?: any;
  data?: InvoiceData;
};

export function InvoiceTemplate({ order, data }: OrderInvoiceProps) {
  const resolvedData = data || mapOrderToInvoiceData(order);
  return <EgnaroMartInvoice data={resolvedData} />;
}

export default EgnaroMartInvoice;
export type { InvoiceData, Product };
