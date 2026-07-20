import letterheadImg from "@/assets/invoice-letterhead.png";
import { inr } from "@/lib/format";

export type OrderInvoiceProps = {
  order: {
    id?: number;
    order_id?: string;
    customer_name?: string;
    phone?: string;
    email?: string;
    address?: string;
    total?: number | string;
    subtotal?: number | string;
    discount?: number | string;
    shipping_charges?: number | string;
    payment_method?: string;
    payment_status?: string;
    status?: string;
    created_at?: string;
    items?: Array<{
      id?: number;
      name?: string;
      title?: string;
      quantity?: number;
      qty?: number;
      price?: number | string;
      seller_name?: string;
      company_name?: string;
      gst?: string;
      seller_phone?: string;
      seller_email?: string;
      seller_address?: string;
    }>;
    seller?: {
      name?: string;
      company_name?: string;
      gst?: string;
      phone?: string;
      email?: string;
      address?: string;
    };
  };
};

export function InvoiceTemplate({ order }: OrderInvoiceProps) {
  const orderId = order.order_id || `ORD-${order.id || "2026"}`;
  const invoiceNo = `INV-${orderId.replace(/^ORD-/, "")}`;
  const createdDate = order.created_at
    ? new Date(order.created_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

  const items = order.items && order.items.length > 0 ? order.items : [];

  const subtotalNum =
    Number(order.subtotal) ||
    items.reduce(
      (acc, it) => acc + Number(it.price || 0) * (it.quantity || it.qty || 1),
      0
    );
  const discountNum = Number(order.discount) || 0;
  const totalNum = Number(order.total) || Math.max(0, subtotalNum - discountNum);
  const shippingNum =
    Number(order.shipping_charges) || (totalNum >= 5000 ? 0 : 99);

  const seller = order.seller || {
    name: items[0]?.seller_name || "Egnaro Mart Seller",
    company_name: items[0]?.company_name || "Egnaro Mart Marketplace",
    gst: items[0]?.gst || null,
    phone: items[0]?.seller_phone || "+91 9442581506",
    email: items[0]?.seller_email || "support@egnaromart.com",
    address:
      items[0]?.seller_address ||
      "2A, Venkatesh Nagar, Sarkarsamakulam Kovilpalayam, Coimbatore, Tamil Nadu - 641107",
  };

  return (
    <div
      className="printable-invoice-page"
      style={{
        position: "relative",
        width: "794px",
        height: "1123px",
        backgroundColor: "#ffffff",
        color: "#0f172a",
        fontFamily: "'Inter', Arial, Helvetica, sans-serif",
        boxSizing: "border-box",
        overflow: "hidden",
        margin: "0 auto",
      }}
    >
      {/* 1. OFFICIAL LETTERHEAD BACKGROUND IMAGE */}
      <img
        src={letterheadImg}
        alt="Egnaro Mart Letterhead"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "794px",
          height: "1123px",
          objectFit: "fill",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* 2. INNER CONTENT OVERLAY CONTAINER */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "794px",
          height: "1123px",
          boxSizing: "border-box",
          paddingTop: "215px",
          paddingBottom: "140px",
          paddingLeft: "44px",
          paddingRight: "44px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        {/* TOP CONTENT WRAPPER */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          
          {/* SECTION A: TAX INVOICE METADATA BAR */}
          <div
            style={{
              border: "1px solid #cbd5e1",
              backgroundColor: "rgba(248, 250, 252, 0.95)",
              borderRadius: "10px",
              padding: "12px 16px",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingBottom: "8px",
                marginBottom: "8px",
                borderBottom: "1px solid #e2e8f0",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: "#047857",
                    display: "inline-block",
                  }}
                />
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 900,
                    letterSpacing: "1px",
                    color: "#0f172a",
                    textTransform: "uppercase",
                  }}
                >
                  Tax Invoice / Bill of Supply
                </span>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "9px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", display: "block" }}>
                  Invoice No.
                </span>
                <span style={{ fontSize: "12px", fontFamily: "monospace", fontWeight: 900, color: "#047857" }}>
                  {invoiceNo}
                </span>
              </div>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px" }}>
              <tbody>
                <tr>
                  <td style={{ width: "20%" }}>
                    <span style={{ fontSize: "8px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", display: "block" }}>Order ID</span>
                    <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#0f172a" }}>{orderId}</span>
                  </td>
                  <td style={{ width: "20%" }}>
                    <span style={{ fontSize: "8px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", display: "block" }}>Date</span>
                    <span style={{ fontWeight: 600, color: "#0f172a" }}>{createdDate}</span>
                  </td>
                  <td style={{ width: "20%" }}>
                    <span style={{ fontSize: "8px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", display: "block" }}>Payment Mode</span>
                    <span style={{ fontWeight: 700, color: "#0f172a", textTransform: "uppercase" }}>{order.payment_method || "COD"}</span>
                  </td>
                  <td style={{ width: "20%" }}>
                    <span style={{ fontSize: "8px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", display: "block" }}>Payment Status</span>
                    <span
                      style={{
                        fontSize: "9px",
                        fontWeight: 900,
                        textTransform: "uppercase",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        display: "inline-block",
                        backgroundColor: order.payment_status === "paid" ? "#d1fae5" : "#fef3c7",
                        color: order.payment_status === "paid" ? "#065f46" : "#92400e",
                        border: order.payment_status === "paid" ? "1px solid #6ee7b7" : "1px solid #fcd34d",
                      }}
                    >
                      {order.payment_status || (order.payment_method === "cod" ? "Pending" : "Paid")}
                    </span>
                  </td>
                  <td style={{ width: "20%" }}>
                    <span style={{ fontSize: "8px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", display: "block" }}>Order Status</span>
                    <span style={{ fontWeight: 700, color: "#0f172a", textTransform: "uppercase" }}>{order.status || "Confirmed"}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* SECTION B: SELLER & BUYER INFORMATION BOXES */}
          <div style={{ display: "flex", gap: "16px", width: "100%" }}>
            
            {/* SELLER DETAILS BOX */}
            <div
              style={{
                flex: 1,
                border: "1px solid #a7f3d0",
                backgroundColor: "rgba(236, 253, 245, 0.5)",
                borderRadius: "10px",
                padding: "12px 14px",
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingBottom: "6px",
                  marginBottom: "6px",
                  borderBottom: "1px solid #a7f3d0",
                }}
              >
                <span style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.5px", color: "#065f46" }}>
                  Seller / Supplier Details
                </span>
                <span style={{ fontSize: "8px", fontWeight: 700, padding: "2px 6px", backgroundColor: "#d1fae5", color: "#065f46", borderRadius: "3px" }}>
                  Verified Seller
                </span>
              </div>
              <div style={{ fontSize: "12px", fontWeight: 900, color: "#0f172a", marginBottom: "2px" }}>{seller.name}</div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>{seller.company_name}</div>
              {seller.gst && (
                <div style={{ fontSize: "10px", fontFamily: "monospace", fontWeight: 800, color: "#c2410c", marginBottom: "4px" }}>
                  GSTIN: {seller.gst}
                </div>
              )}
              <div style={{ fontSize: "10px", color: "#475569", lineHeight: "1.3", marginBottom: "6px" }}>{seller.address}</div>
              <div style={{ fontSize: "9.5px", color: "#64748b" }}>
                <span>Ph: {seller.phone}</span> • <span>Email: {seller.email}</span>
              </div>
            </div>

            {/* BUYER DETAILS BOX */}
            <div
              style={{
                flex: 1,
                border: "1px solid #fed7aa",
                backgroundColor: "rgba(255, 247, 237, 0.5)",
                borderRadius: "10px",
                padding: "12px 14px",
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  paddingBottom: "6px",
                  marginBottom: "6px",
                  borderBottom: "1px solid #fed7aa",
                }}
              >
                <span style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.5px", color: "#9a3412" }}>
                  Buyer Shipping & Billing Details
                </span>
              </div>
              <div style={{ fontSize: "12px", fontWeight: 900, color: "#0f172a", marginBottom: "4px" }}>
                {order.customer_name || "Valued Buyer"}
              </div>
              <div style={{ fontSize: "10px", color: "#334155", lineHeight: "1.3", marginBottom: "6px" }}>
                {order.address || "Delivery Address Provided at Checkout"}
              </div>
              <div style={{ fontSize: "9.5px", color: "#64748b" }}>
                {order.phone && <div>Ph: {order.phone}</div>}
                {order.email && <div>Email: {order.email}</div>}
              </div>
            </div>
          </div>

          {/* SECTION C: PRODUCTS ORDERED TABLE */}
          <div
            style={{
              border: "1px solid #cbd5e1",
              borderRadius: "10px",
              overflow: "hidden",
              boxSizing: "border-box",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10.5px", tableLayout: "fixed" }}>
              <thead>
                <tr style={{ backgroundColor: "#0f172a", color: "#ffffff", fontSize: "8.5px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  <th style={{ padding: "8px 10px", textAlign: "center", width: "5%" }}>#</th>
                  <th style={{ padding: "8px 10px", textAlign: "left", width: "45%" }}>Product Description</th>
                  <th style={{ padding: "8px 10px", textAlign: "center", width: "8%" }}>Qty</th>
                  <th style={{ padding: "8px 10px", textAlign: "right", width: "14%" }}>Unit Price</th>
                  <th style={{ padding: "8px 10px", textAlign: "right", width: "13%" }}>Shipping</th>
                  <th style={{ padding: "8px 10px", textAlign: "right", width: "15%" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const qty = item.quantity || item.qty || 1;
                  const unitPrice = Number(item.price) || 0;
                  const lineTotal = unitPrice * qty;

                  return (
                    <tr
                      key={idx}
                      style={{
                        backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f8fafc",
                        borderBottom: "1px solid #e2e8f0",
                      }}
                    >
                      <td style={{ padding: "8px 10px", textAlign: "center", fontFamily: "monospace", fontWeight: 700, color: "#94a3b8" }}>
                        {idx + 1}
                      </td>
                      <td style={{ padding: "8px 10px" }}>
                        <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "11px" }}>
                          {item.name || item.title || "Product Item"}
                        </div>
                        {item.seller_name && (
                          <div style={{ fontSize: "8.5px", color: "#94a3b8", marginTop: "2px" }}>
                            Seller: <span style={{ fontWeight: 600, color: "#475569" }}>{item.seller_name}</span>
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "center", fontFamily: "monospace", fontWeight: 700, color: "#0f172a" }}>
                        {qty}
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: "monospace" }}>
                        {inr(unitPrice)}
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: "monospace", color: "#64748b" }}>
                        {shippingNum === 0 ? "FREE" : inr(shippingNum / Math.max(1, items.length))}
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: "monospace", fontWeight: 800, color: "#0f172a" }}>
                        {inr(lineTotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* BOTTOM CONTENT WRAPPER (SUMMARY & DECLARATION) */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "24px" }}>
            
            {/* DECLARATION & TERMS */}
            <div style={{ flex: 1, fontSize: "9px", color: "#64748b", display: "flex", flexDirection: "column", gap: "4px" }}>
              <div style={{ fontWeight: 800, color: "#1e293b", textTransform: "uppercase", fontSize: "9.5px", letterSpacing: "0.5px" }}>
                Declaration & Terms:
              </div>
              <div style={{ lineHeight: "1.3" }}>
                This is a computer-generated tax invoice issued by Egnaro Mart Marketplace under the Information Technology Act.
              </div>
              <div style={{ lineHeight: "1.3" }}>
                Goods once sold are covered under Egnaro Mart Marketplace Protection policy. Manufacturer warranties apply.
              </div>
            </div>

            {/* FINANCIAL SUMMARY BOX */}
            <div
              style={{
                width: "240px",
                border: "1px solid #cbd5e1",
                backgroundColor: "#f8fafc",
                borderRadius: "10px",
                padding: "10px 14px",
                fontSize: "11px",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", color: "#475569" }}>
                <span>Subtotal</span>
                <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{inr(subtotalNum)}</span>
              </div>
              {discountNum > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", color: "#047857", fontWeight: 600 }}>
                  <span>Discount</span>
                  <span style={{ fontFamily: "monospace" }}>-{inr(discountNum)}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", color: "#475569" }}>
                <span>Shipping Charges</span>
                <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#0f172a" }}>
                  {shippingNum === 0 ? "FREE" : inr(shippingNum)}
                </span>
              </div>
              <div
                style={{
                  borderTop: "2px solid #0f172a",
                  paddingTop: "6px",
                  marginTop: "2px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  fontWeight: 900,
                  color: "#0f172a",
                }}
              >
                <span>Grand Total</span>
                <span style={{ fontFamily: "monospace", fontSize: "14px", color: "#c2410c" }}>{inr(totalNum)}</span>
              </div>
            </div>
          </div>

          <div style={{ textAlign: "center", fontSize: "9px", color: "#94a3b8", fontFamily: "monospace", marginTop: "16px" }}>
            Thank you for shopping on Egnaro Mart — India's Premium B2B & Retail Marketplace!
          </div>
        </div>
      </div>
    </div>
  );
}
