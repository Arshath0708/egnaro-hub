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
  gst_percentage: number;
  hsn_code: string;
  taxable_value: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
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
    city: string;
    state: string;
    pincode: string;
  };
  buyer: {
    name: string;
    billing_address: string;
    billing_city: string;
    billing_state: string;
    billing_pincode: string;
    shipping_address: string;
    shipping_city: string;
    shipping_state: string;
    shipping_pincode: string;
    phone: string;
    email: string;
    buyer_gst?: string | null;
  };
  products: Product[];
  total_taxable_amount: number;
  total_tax: number;
  subtotal: number;
  shippingCharges: number;
  discountTotal: number;
  grandTotal: number;
}

// ─── Default Empty Production Data ────────────────────────────────────────────
const defaultEmptyInvoiceData: InvoiceData = {
  invoiceNumber: "INV-0000",
  orderId: "N/A",
  invoiceDate: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }),
  dueDate: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }),
  paymentMethod: "COD",
  paymentStatus: "Pending",
  orderStatus: "Processing",
  seller: {
    name: "Egnaro Mart Seller",
    company: "Egnaro Mart Marketplace",
    gst: "N/A",
    address: "No: 2A, Venkatesh Nagar, Kovilpalayam",
    city: "Coimbatore",
    state: "Tamil Nadu",
    pincode: "641107",
    email: "egnaromart@gmail.com",
    phone: "+91 9442581506",
  },
  buyer: {
    name: "Valued Customer",
    billing_address: "Billing Address Provided at Checkout",
    billing_city: "",
    billing_state: "",
    billing_pincode: "",
    shipping_address: "Shipping Address Provided at Checkout",
    shipping_city: "",
    shipping_state: "",
    shipping_pincode: "",
    phone: "N/A",
    email: "N/A",
    buyer_gst: null,
  },
  products: [],
  total_taxable_amount: 0,
  total_tax: 0,
  subtotal: 0,
  shippingCharges: 0,
  discountTotal: 0,
  grandTotal: 0,
};

// ─── Indian State Code Mapping ──────────────────────────────────────────────
function getStateCode(stateName: string): string {
  const cleanState = (stateName || "").trim().toLowerCase();
  if (cleanState.includes("jammu") || cleanState.includes("jk")) return "01";
  if (cleanState.includes("himachal") || cleanState.includes("hp")) return "02";
  if (cleanState.includes("punjab") || cleanState.includes("pb")) return "03";
  if (cleanState.includes("chandigarh") || cleanState.includes("ch")) return "04";
  if (cleanState.includes("uttarakhand") || cleanState.includes("uk")) return "05";
  if (cleanState.includes("haryana") || cleanState.includes("hr")) return "06";
  if (cleanState.includes("delhi") || cleanState.includes("dl")) return "07";
  if (cleanState.includes("rajasthan") || cleanState.includes("rj")) return "08";
  if (cleanState.includes("uttar pradesh") || cleanState.includes("up")) return "09";
  if (cleanState.includes("bihar") || cleanState.includes("br")) return "10";
  if (cleanState.includes("sikkim") || cleanState.includes("sk")) return "11";
  if (cleanState.includes("arunachal") || cleanState.includes("ar")) return "12";
  if (cleanState.includes("nagaland") || cleanState.includes("nl")) return "13";
  if (cleanState.includes("manipur") || cleanState.includes("mn")) return "14";
  if (cleanState.includes("mizoram") || cleanState.includes("mz")) return "15";
  if (cleanState.includes("tripura") || cleanState.includes("tr")) return "16";
  if (cleanState.includes("meghalaya") || cleanState.includes("ml")) return "17";
  if (cleanState.includes("assam") || cleanState.includes("as")) return "18";
  if (cleanState.includes("west bengal") || cleanState.includes("wb")) return "19";
  if (cleanState.includes("jharkhand") || cleanState.includes("jh")) return "20";
  if (cleanState.includes("odisha") || cleanState.includes("or") || cleanState.includes("orissa")) return "21";
  if (cleanState.includes("chhattisgarh") || cleanState.includes("cg")) return "22";
  if (cleanState.includes("madhya pradesh") || cleanState.includes("mp")) return "23";
  if (cleanState.includes("gujarat") || cleanState.includes("gj")) return "24";
  if (cleanState.includes("daman") || cleanState.includes("diu")) return "25";
  if (cleanState.includes("dadra") || cleanState.includes("haveli")) return "26";
  if (cleanState.includes("maharashtra") || cleanState.includes("mh")) return "27";
  if (cleanState.includes("andhra pradesh") || cleanState.includes("ap")) return "37"; // default to new AP
  if (cleanState.includes("karnataka") || cleanState.includes("ka")) return "29";
  if (cleanState.includes("goa") || cleanState.includes("ga")) return "30";
  if (cleanState.includes("lakshadweep") || cleanState.includes("ld")) return "31";
  if (cleanState.includes("kerala") || cleanState.includes("kl")) return "32";
  if (cleanState.includes("tamil nadu") || cleanState.includes("tamilnadu") || cleanState.includes("tn")) return "33";
  if (cleanState.includes("puducherry") || cleanState.includes("py")) return "34";
  if (cleanState.includes("telangana") || cleanState.includes("ts")) return "36";
  if (cleanState.includes("ladakh") || cleanState.includes("la")) return "38";
  return "33"; // Default to 33 (Tamil Nadu) if unresolvable to prevent N/A state codes
}

function resolveStateCode(gstin: string, stateName: string): string {
  const cleanGst = (gstin || "").trim().toUpperCase();
  if (cleanGst.length >= 2) {
    const code = cleanGst.substring(0, 2);
    if (!isNaN(Number(code))) {
      return code;
    }
  }
  return getStateCode(stateName);
}

function getPanFromGst(gstin: string): string {
  const cleanGst = (gstin || "").trim().toUpperCase();
  if (cleanGst.length === 15) {
    return cleanGst.substring(2, 12);
  }
  return "N/A";
}

// ─── State Extractor Helper ─────────────────────────────────────────────────
function extractState(address: string, city: string, existingState: string): string {
  if (existingState && existingState.trim().toLowerCase() !== "n/a" && existingState.trim() !== "") {
    return existingState.trim();
  }
  const addr = (address + " " + city).toLowerCase();
  if (addr.includes("tamil nadu") || addr.includes("tamilnadu") || addr.includes("chennai") || addr.includes("coimbatore")) {
    return "Tamil Nadu";
  }
  if (addr.includes("karnataka") || addr.includes("bangalore") || addr.includes("bengaluru")) {
    return "Karnataka";
  }
  if (addr.includes("kerala") || addr.includes("kochi") || addr.includes("trivandrum")) {
    return "Kerala";
  }
  if (addr.includes("maharashtra") || addr.includes("mumbai") || addr.includes("pune")) {
    return "Maharashtra";
  }
  if (addr.includes("delhi") || addr.includes("new delhi")) {
    return "Delhi";
  }
  if (addr.includes("karnataka") || addr.includes("bangalore")) {
    return "Karnataka";
  }
  return "Tamil Nadu"; // Default fallback
}

// ─── Clean Address Formatter ────────────────────────────────────────────────
function formatCleanAddress(address: string, city: string, state: string, pincode: string): string {
  if (!address || address.trim() === "") return "Address Details Provided at Checkout";
  
  const cleanAddr = address.trim();
  const addrLower = cleanAddr.toLowerCase();
  let parts = [cleanAddr];
  
  if (city && city.trim() !== "" && !addrLower.includes(city.trim().toLowerCase())) {
    parts.push(city.trim());
  }
  
  if (state && state.trim() !== "" && !addrLower.includes(state.trim().toLowerCase())) {
    const cleanStateStr = state.trim();
    // Prevent appending state if it is already present in part of the address list
    if (!parts.some(p => p.toLowerCase().includes(cleanStateStr.toLowerCase()))) {
      parts.push(cleanStateStr);
    }
  }
  
  if (pincode && pincode.trim() !== "" && !addrLower.includes(pincode.trim())) {
    parts.push(pincode.trim());
  }
  
  return parts.join(", ");
}

// ─── Number To Words Converter (Indian Numbering System) ─────────────────────
export function numberToWords(num: number): string {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", 
                "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function convertInteger(n: number): string {
    if (n === 0) return "";
    let words = "";

    if (Math.floor(n / 10000000) > 0) {
      words += convertInteger(Math.floor(n / 10000000)) + " Crore ";
      n %= 10000000;
    }

    if (Math.floor(n / 100000) > 0) {
      words += convertInteger(Math.floor(n / 100000)) + " Lakh ";
      n %= 100000;
    }

    if (Math.floor(n / 1000) > 0) {
      words += convertInteger(Math.floor(n / 1000)) + " Thousand ";
      n %= 1000;
    }

    if (Math.floor(n / 100) > 0) {
      words += convertInteger(Math.floor(n / 100)) + " Hundred ";
      n %= 100;
    }

    if (n > 0) {
      if (words !== "") words += "and ";
      if (n < 20) {
        words += ones[n] + " ";
      } else {
        words += tens[Math.floor(n / 10)] + " ";
        if (n % 10 > 0) {
          words += ones[n % 10] + " ";
        }
      }
    }

    return words.trim();
  }

  const parts = Number(num).toFixed(2).split(".");
  const integerPart = Number(parts[0]);
  const decimalPart = Number(parts[1] || "0");

  let result = convertInteger(integerPart).trim();
  if (!result) result = "Zero";
  result += " Rupees";

  if (decimalPart > 0) {
    const paiseText = convertInteger(decimalPart).trim();
    if (paiseText) {
      result += " and " + paiseText + " Paise";
    }
  }

  return result.trim() + " Only";
}

// ─── Database Order Mapper ──────────────────────────────────────────────────
export function mapOrderToInvoiceData(order: any): InvoiceData {
  if (!order) return defaultEmptyInvoiceData;

  const actualOrder = order.order || order;
  const rawOrderId = actualOrder.order_id || String(actualOrder.id || "0000");
  const invoiceNumber = `INV-${rawOrderId.replace(/^ORD-/, "").replace(/^EM-ORD-/, "")}`;
  
  const invoiceDate = actualOrder.created_at
    ? new Date(actualOrder.created_at).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

  const rawItems = Array.isArray(actualOrder.items)
    ? actualOrder.items
    : typeof actualOrder.items === "string"
    ? JSON.parse(actualOrder.items || "[]")
    : Array.isArray(actualOrder.order_items)
    ? actualOrder.order_items
    : [];

  const firstItem = rawItems[0] || {};
  const sellerObj = actualOrder.seller || {};
  
  const sellerState = extractState(
    sellerObj.address || firstItem.seller_address || "",
    sellerObj.city || firstItem.seller_city || "",
    sellerObj.state || firstItem.seller_state || ""
  );

  const rawSellerAddress = sellerObj.address || firstItem.seller_address || "2A, Venkatesh Nagar, Kovilpalayam";
  const sellerCity = sellerObj.city || firstItem.seller_city || "Coimbatore";
  const sellerPincode = sellerObj.pincode || firstItem.seller_pincode || "641107";

  const seller = {
    name: sellerObj.name || sellerObj.vendor_name || firstItem.seller_name || "Egnaro Mart Seller",
    company: sellerObj.company_name || sellerObj.company || firstItem.company_name || "Egnaro Mart Marketplace",
    gst: sellerObj.gst || firstItem.gst || "N/A",
    address: formatCleanAddress(rawSellerAddress, sellerCity, sellerState, sellerPincode),
    city: sellerCity,
    state: sellerState,
    pincode: sellerPincode,
    email: sellerObj.email || firstItem.seller_email || "egnaromart@gmail.com",
    phone: sellerObj.phone || firstItem.seller_phone || "+91 9442581506",
  };

  const rawShippingAddress = actualOrder.address || actualOrder.delivery_address || actualOrder.customer?.address || "Shipping Address Provided at Checkout";
  const shippingCity = actualOrder.city || "";
  const rawShippingState = actualOrder.state || "";
  const shippingPincode = actualOrder.pincode || "";

  const shippingState = extractState(rawShippingAddress, shippingCity, rawShippingState);

  const rawBillingAddress = actualOrder.billing_address || actualOrder.address || actualOrder.delivery_address || actualOrder.customer?.address || "Billing Address Provided at Checkout";
  const billingCity = actualOrder.billing_city || actualOrder.city || "";
  const rawBillingState = actualOrder.billing_state || actualOrder.state || "";
  const billingPincode = actualOrder.billing_pincode || actualOrder.pincode || "";

  const billingState = extractState(rawBillingAddress, billingCity, rawBillingState);

  const buyer = {
    name: actualOrder.customer_name || actualOrder.customer?.fullName || "Valued Buyer",
    billing_address: formatCleanAddress(rawBillingAddress, billingCity, billingState, billingPincode),
    billing_city: billingCity,
    billing_state: billingState,
    billing_pincode: billingPincode,
    shipping_address: formatCleanAddress(rawShippingAddress, shippingCity, shippingState, shippingPincode),
    shipping_city: shippingCity,
    shipping_state: shippingState,
    shipping_pincode: shippingPincode,
    phone: actualOrder.phone || actualOrder.customer?.phone || "N/A",
    email: actualOrder.email || actualOrder.customer?.email || "N/A",
    buyer_gst: actualOrder.buyer_gst || actualOrder.customer?.gst_number || null,
  };

  const isIntraState = (() => {
    const sState = (seller.state || "").toLowerCase();
    const bState = (buyer.shipping_state || "").toLowerCase();
    if (bState.includes("tamil nadu") || bState.includes("tn") || sState.includes("tamil nadu")) {
      return true;
    }
    const cleanB = bState.replace(/[^a-z]/g, "");
    const cleanS = sState.replace(/[^a-z]/g, "");
    return cleanB.length > 3 && cleanS.includes(cleanB);
  })();

  const shippingChargesTotal = Number(actualOrder.shipping_charges || 0);
  const discountTotal = Number(actualOrder.discount || 0);

  let subtotal = 0;

  const products: Product[] = rawItems.map((item: any, idx: number) => {
    const qty = Number(item.quantity || item.qty || 1);
    const unitPrice = Number(item.unit_price ?? item.unitPrice ?? item.price ?? 0);
    const shipping = item.shipping !== undefined ? Number(item.shipping) : (idx === 0 ? shippingChargesTotal : 0);
    const discount = item.discount !== undefined ? Number(item.discount) : (idx === 0 ? discountTotal : 0);

    const gst_percentage = Number(item.gst_percentage ?? item.gstPercentage ?? item.gst_percent ?? item.gstPercent ?? 0);
    const hsn_code = item.hsn_code || item.hsnCode || item.hsn || "N/A";

    let taxable_value = Number(item.taxable_value ?? item.taxableValue ?? 0);
    if (!taxable_value && unitPrice > 0) {
      const lineTotal = unitPrice * qty;
      taxable_value = gst_percentage > 0 ? lineTotal / (1 + gst_percentage / 100) : lineTotal;
    }

    let cgst_amount = Number(item.cgst_amount ?? item.cgstAmount ?? 0);
    let sgst_amount = Number(item.sgst_amount ?? item.sgstAmount ?? 0);
    let igst_amount = Number(item.igst_amount ?? item.igstAmount ?? 0);

    if (gst_percentage > 0 && !cgst_amount && !sgst_amount && !igst_amount) {
      const gstAmount = (unitPrice * qty) - taxable_value;
      if (isIntraState) {
        cgst_amount = gstAmount / 2;
        sgst_amount = gstAmount / 2;
      } else {
        igst_amount = gstAmount;
      }
    } else if (isIntraState && !cgst_amount && !sgst_amount && igst_amount > 0) {
      cgst_amount = igst_amount / 2;
      sgst_amount = igst_amount / 2;
      igst_amount = 0;
    } else if (!isIntraState && !igst_amount && (cgst_amount > 0 || sgst_amount > 0)) {
      igst_amount = cgst_amount + sgst_amount;
      cgst_amount = 0;
      sgst_amount = 0;
    }

    subtotal += unitPrice * qty;

    return {
      name: item.name || item.product_name || item.title || "Product Item",
      sku: item.sku || (item.product_id ? `EM-PROD-${item.product_id}` : `EM-ITEM-${idx + 1}`),
      qty,
      unitPrice,
      shipping,
      discount,
      gst_percentage,
      hsn_code,
      taxable_value,
      cgst_amount,
      sgst_amount,
      igst_amount,
    };
  });

  if (products.length === 0) {
    const fallbackPrice = Number(actualOrder.subtotal || actualOrder.total || 0);
    subtotal = fallbackPrice;
    products.push({
      name: "Egnaro Mart Order Purchase",
      sku: `EM-ORD-${rawOrderId}`,
      qty: 1,
      unitPrice: fallbackPrice,
      shipping: shippingChargesTotal,
      discount: discountTotal,
      gst_percentage: 0,
      hsn_code: "N/A",
      taxable_value: fallbackPrice,
      cgst_amount: 0,
      sgst_amount: 0,
      igst_amount: 0,
    });
  }

  const rawPaymentStatus = (actualOrder.payment_status || "").toLowerCase();
  const paymentStatus: "Paid" | "Pending" | "Failed" =
    rawPaymentStatus === "paid" || actualOrder.payment_method === "upi" || actualOrder.payment_method === "online" || actualOrder.payment_method === "razorpay"
      ? "Paid"
      : rawPaymentStatus === "failed"
      ? "Failed"
      : "Pending";

  const rawOrderStatus = (actualOrder.status || "").toLowerCase();
  const orderStatus: "Delivered" | "Processing" | "Shipped" | "Cancelled" =
    rawOrderStatus === "delivered"
      ? "Delivered"
      : rawOrderStatus === "cancelled"
      ? "Cancelled"
      : rawOrderStatus === "shipped" || rawOrderStatus === "out-for-delivery"
      ? "Shipped"
      : "Processing";

  let total_taxable_amount = Number(actualOrder.total_taxable_amount ?? actualOrder.totalTaxableAmount ?? 0);
  let total_tax = Number(actualOrder.total_tax ?? actualOrder.totalTax ?? 0);

  if (!total_taxable_amount && products.length > 0) {
    total_taxable_amount = products.reduce((acc, p) => acc + p.taxable_value, 0);
  }
  if (!total_tax && products.length > 0) {
    total_tax = products.reduce((acc, p) => acc + p.cgst_amount + p.sgst_amount + p.igst_amount, 0);
  }

  const grandTotal = subtotal + shippingChargesTotal - discountTotal;

  return {
    invoiceNumber,
    orderId: rawOrderId,
    invoiceDate,
    dueDate: invoiceDate,
    paymentMethod: (actualOrder.payment_method || "COD").toUpperCase(),
    paymentStatus,
    orderStatus,
    seller,
    buyer,
    products,
    total_taxable_amount,
    total_tax,
    subtotal,
    shippingCharges: shippingChargesTotal,
    discountTotal,
    grandTotal,
  };
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n);

// ─── Main Invoice Component ───────────────────────────────────────────────────
export const EgnaroMartInvoice: React.FC<{ data?: InvoiceData }> = ({ data = defaultEmptyInvoiceData }) => {
  const sellerStateCode = resolveStateCode(data.seller.gst, data.seller.state);
  const billingStateCode = resolveStateCode("", data.buyer.billing_state);
  const shippingStateCode = resolveStateCode("", data.buyer.shipping_state);
  
  const sellerPan = getPanFromGst(data.seller.gst);
  const amtInWords = numberToWords(data.grandTotal);

  const cgstTotal = data.products.reduce((sum, p) => sum + p.cgst_amount, 0);
  const sgstTotal = data.products.reduce((sum, p) => sum + p.sgst_amount, 0);
  const igstTotal = data.products.reduce((sum, p) => sum + p.igst_amount, 0);

  return (
    <>
      {/* ── Scoped Print Styles ── */}
      <style id="invoice-scoped-styles">{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        .invoice-page {
          box-sizing: border-box;
          margin: 0 auto;
          padding: 30px;
          width: 794px;
          min-height: 1123px;
          background: #FFFFFF;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          color: #1e293b;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          display: flex;
          flex-direction: column;
          border: 1px solid #e2e8f0;
        }

        .invoice-page * {
          box-sizing: border-box;
        }

        .inv-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
          margin-bottom: 15px;
        }

        .inv-table th {
          background-color: #f1f5f9;
          border: 1px solid #cbd5e1;
          padding: 8px 6px;
          font-size: 9px;
          font-weight: 700;
          color: #334155;
          text-align: center;
          text-transform: uppercase;
        }

        .inv-table td {
          border: 1px solid #cbd5e1;
          padding: 8px 6px;
          font-size: 10px;
          color: #0f172a;
          vertical-align: top;
        }

        @media print {
          body {
            background: white;
            margin: 0;
          }
          .invoice-page {
            border: none;
            padding: 20px;
            width: 100%;
            height: 100%;
            box-shadow: none;
          }
        }
      `}</style>

      {/* ══ INVOICE PAGE ══════════════════════════════════════════════════════ */}
      <div className="invoice-page">
        
        {/* ── TOP SECTION: LOGO & TITLE ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          {/* Left: Brand Details */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <img
              src={invoiceLogo}
              alt="Egnaro Mart Logo"
              style={{
                height: "44px",
                width: "auto",
                objectFit: "contain",
                display: "block",
                marginBottom: 6
              }}
            />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#ea580c" }}>Egnaro Mart Marketplace</span>
            <span style={{ fontSize: 10, color: "#64748b" }}>Website: egnaromart.com</span>
            <span style={{ fontSize: 10, color: "#64748b" }}>Email: egnaromart@gmail.com</span>
            <span style={{ fontSize: 10, color: "#64748b" }}>Phone: +91 9442581506</span>
          </div>

          {/* Right: Tax Invoice Title */}
          <div style={{ textAlign: "right" }}>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Tax Invoice/Bill of Supply/Cash Memo
            </h1>
            <p style={{ fontSize: 10, color: "#64748b", margin: "2px 0 10px 0", fontStyle: "italic" }}>
              (Original for Recipient)
            </p>

            <table style={{ borderCollapse: "collapse", marginLeft: "auto", fontSize: 10 }}>
              <tbody>
                <tr>
                  <td style={{ border: "none", padding: "2px 10px", color: "#64748b", textAlign: "right", fontWeight: 500 }}>Invoice Number:</td>
                  <td style={{ border: "none", padding: "2px 0", fontWeight: 700, color: "#0f172a" }}>{data.invoiceNumber}</td>
                </tr>
                <tr>
                  <td style={{ border: "none", padding: "2px 10px", color: "#64748b", textAlign: "right", fontWeight: 500 }}>Invoice Date:</td>
                  <td style={{ border: "none", padding: "2px 0", fontWeight: 600 }}>{data.invoiceDate}</td>
                </tr>
                <tr>
                  <td style={{ border: "none", padding: "2px 10px", color: "#64748b", textAlign: "right", fontWeight: 500 }}>Order Number:</td>
                  <td style={{ border: "none", padding: "2px 0", fontWeight: 600 }}>{data.orderId}</td>
                </tr>
                <tr>
                  <td style={{ border: "none", padding: "2px 10px", color: "#64748b", textAlign: "right", fontWeight: 500 }}>Payment Method:</td>
                  <td style={{ border: "none", padding: "2px 0", fontWeight: 700, color: "#ea580c" }}>{data.paymentMethod}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ height: 1, backgroundColor: "#e2e8f0", marginBottom: 20 }} />

        {/* ── ADDRESS SECTION ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
          {/* Left Column: Sold By (Seller details) */}
          <div style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: 12, backgroundColor: "#f8fafc" }}>
            <h3 style={{ fontSize: 11, fontWeight: 700, color: "#0f172a", margin: "0 0 8px 0", borderBottom: "1px solid #e2e8f0", paddingBottom: 4, textTransform: "uppercase" }}>
              Sold By :
            </h3>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#0f172a", margin: "0 0 2px 0" }}>{data.seller.name}</p>
            <p style={{ fontSize: 10, fontWeight: 500, color: "#334155", margin: "0 0 6px 0" }}>{data.seller.company}</p>
            <p style={{ fontSize: 10, color: "#334155", margin: "0 0 10px 0", lineHeight: 1.4 }}>{data.seller.address}</p>
            
            <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: "3px 0", fontSize: 10, borderTop: "1px dashed #cbd5e1", paddingTop: 8 }}>
              <span style={{ color: "#64748b" }}>PAN No:</span>
              <span style={{ fontWeight: 600 }}>{sellerPan}</span>
              
              <span style={{ color: "#64748b" }}>GSTIN:</span>
              <span style={{ fontWeight: 700, color: "#0f172a" }}>{data.seller.gst}</span>
              
              <span style={{ color: "#64748b" }}>State/UT:</span>
              <span>{data.seller.state}</span>

              <span style={{ color: "#64748b" }}>State Code:</span>
              <span style={{ fontWeight: 600 }}>{sellerStateCode}</span>

              <span style={{ color: "#64748b" }}>Phone:</span>
              <span>{data.seller.phone}</span>

              <span style={{ color: "#64748b" }}>Email:</span>
              <span>{data.seller.email}</span>
            </div>
          </div>

          {/* Right Column: Billing & Shipping Address */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Billing Address */}
            <div style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: 10 }}>
              <h3 style={{ fontSize: 10, fontWeight: 700, color: "#0f172a", margin: "0 0 6px 0", borderBottom: "1px solid #e2e8f0", paddingBottom: 4, textTransform: "uppercase" }}>
                Billing Address :
              </h3>
              <p style={{ fontSize: 10, fontWeight: 700, color: "#0f172a", margin: "0 0 2px 0" }}>{data.buyer.name}</p>
              <p style={{ fontSize: 10, color: "#334155", margin: "0 0 4px 0", lineHeight: 1.3 }}>
                {data.buyer.billing_address}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 15px", fontSize: 9.5, color: "#475569", borderTop: "1px dashed #e2e8f0", paddingTop: 4, marginTop: 4 }}>
                <span>Phone: {data.buyer.phone}</span>
                <span>State Code: {billingStateCode}</span>
                <span>GSTIN: <strong style={{ color: "#0f172a" }}>{data.buyer.buyer_gst || "N/A"}</strong></span>
              </div>
            </div>

            {/* Shipping Address */}
            <div style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: 10 }}>
              <h3 style={{ fontSize: 10, fontWeight: 700, color: "#0f172a", margin: "0 0 6px 0", borderBottom: "1px solid #e2e8f0", paddingBottom: 4, textTransform: "uppercase" }}>
                Shipping Address :
              </h3>
              <p style={{ fontSize: 10, fontWeight: 700, color: "#0f172a", margin: "0 0 2px 0" }}>{data.buyer.name}</p>
              <p style={{ fontSize: 10, color: "#334155", margin: "0 0 4px 0", lineHeight: 1.3 }}>
                {data.buyer.shipping_address}
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 10px", fontSize: 9.5, color: "#475569", borderTop: "1px dashed #e2e8f0", paddingTop: 4, marginTop: 4 }}>
                <span>State Code: {shippingStateCode}</span>
                <span>Place of Supply: {data.buyer.shipping_state || "N/A"}</span>
                <span>Place of Delivery: {data.buyer.shipping_state || "N/A"}</span>
                <span>Phone: {data.buyer.phone}</span>
                <span style={{ gridColumn: "span 2" }}>GSTIN: <strong style={{ color: "#0f172a" }}>{data.buyer.buyer_gst || "N/A"}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* ── ORDER TABLE ── */}
        <table className="inv-table">
          <thead>
            <tr>
              <th style={{ width: "4%" }}>Sl. No.</th>
              <th style={{ width: "35%", textAlign: "left" }}>Description</th>
              <th style={{ width: "10%" }}>HSN</th>
              <th style={{ width: "5%" }}>Qty</th>
              <th style={{ width: "9%", textAlign: "right" }}>Unit Price</th>
              <th style={{ width: "8%", textAlign: "right" }}>Discount</th>
              <th style={{ width: "10%", textAlign: "right" }}>Taxable Value</th>
              <th style={{ width: "5%" }}>GST %</th>
              <th style={{ width: "7%", textAlign: "right" }}>CGST</th>
              <th style={{ width: "7%", textAlign: "right" }}>SGST</th>
              <th style={{ width: "7%", textAlign: "right" }}>IGST</th>
              <th style={{ width: "10%", textAlign: "right" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {data.products.map((p, idx) => (
              <tr key={idx}>
                <td style={{ textAlign: "center" }}>{idx + 1}</td>
                <td>
                  <div style={{ fontWeight: 600, color: "#0f172a" }}>{p.name}</div>
                  <div style={{ fontSize: 8.5, color: "#64748b", marginTop: 2 }}>SKU: {p.sku}</div>
                </td>
                <td style={{ textAlign: "center" }}>{p.hsn_code}</td>
                <td style={{ textAlign: "center" }}>{p.qty}</td>
                <td style={{ textAlign: "right" }}>{fmt(p.unitPrice)}</td>
                <td style={{ textAlign: "right", color: p.discount > 0 ? "#16a34a" : "#0f172a" }}>
                  {p.discount > 0 ? `-${fmt(p.discount)}` : "₹0.00"}
                </td>
                <td style={{ textAlign: "right" }}>{fmt(p.taxable_value)}</td>
                <td style={{ textAlign: "center" }}>{p.gst_percentage}%</td>
                <td style={{ textAlign: "right" }}>{p.cgst_amount > 0 ? fmt(p.cgst_amount) : "₹0.00"}</td>
                <td style={{ textAlign: "right" }}>{p.sgst_amount > 0 ? fmt(p.sgst_amount) : "₹0.00"}</td>
                <td style={{ textAlign: "right" }}>{p.igst_amount > 0 ? fmt(p.igst_amount) : "₹0.00"}</td>
                <td style={{ textAlign: "right", fontWeight: 600 }}>{fmt((p.unitPrice * p.qty) + p.shipping - p.discount)}</td>
              </tr>
            ))}

            {/* Total Row */}
            <tr style={{ backgroundColor: "#f8fafc", fontWeight: 700 }}>
              <td colSpan={6} style={{ textAlign: "right", textTransform: "uppercase", fontSize: 9 }}>Total:</td>
              <td style={{ textAlign: "right" }}>{fmt(data.total_taxable_amount)}</td>
              <td></td>
              <td style={{ textAlign: "right" }}>{fmt(cgstTotal)}</td>
              <td style={{ textAlign: "right" }}>{fmt(sgstTotal)}</td>
              <td style={{ textAlign: "right" }}>{fmt(igstTotal)}</td>
              <td style={{ textAlign: "right", color: "#ea580c" }}>{fmt(data.grandTotal)}</td>
            </tr>
          </tbody>
        </table>

        {/* ── SUMMARY SECTION ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 20, marginTop: "auto", marginBottom: 20 }}>
          {/* Left: Amount in Words */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
              Amount in Words:
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", textTransform: "capitalize", lineHeight: 1.4 }}>
              {amtInWords}
            </span>
            
            <div style={{ marginTop: 15, border: "1px solid #cbd5e1", borderRadius: 8, padding: 10, backgroundColor: "#f8fafc" }}>
              <span style={{ fontSize: 9.5, fontWeight: 700, color: "#475569" }}>Declaration / Marketplace Disclaimer:</span>
              <p style={{ fontSize: 8.5, color: "#64748b", margin: "4px 0 0 0", lineHeight: 1.4 }}>
                Egnaro Mart operates as a marketplace facilitator connecting buyers and independent sellers. The tax invoice details above represent financial transactions between the respective buyer and vendor. The seller is solely responsible for product compliance, local warranties, and tax declarations.
              </p>
            </div>
          </div>

          {/* Right: Detailed Summary Box */}
          <div style={{ border: "1px solid #cbd5e1", borderRadius: 8, overflow: "hidden" }}>
            <div style={{ backgroundColor: "#f1f5f9", padding: "8px 12px", borderBottom: "1px solid #cbd5e1", fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#334155" }}>
              Tax Breakdown Summary
            </div>
            
            <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 6, fontSize: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Total Taxable Value:</span>
                <span style={{ fontWeight: 600 }}>{fmt(data.total_taxable_amount)}</span>
              </div>
              
              {cgstTotal > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b" }}>CGST Total:</span>
                  <span>{fmt(cgstTotal)}</span>
                </div>
              )}

              {sgstTotal > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b" }}>SGST Total:</span>
                  <span>{fmt(sgstTotal)}</span>
                </div>
              )}

              {igstTotal > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b" }}>IGST Total:</span>
                  <span>{fmt(igstTotal)}</span>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Total Tax:</span>
                <span style={{ fontWeight: 600 }}>{fmt(data.total_tax)}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Shipping Charges:</span>
                <span>{fmt(data.shippingCharges)}</span>
              </div>

              {data.discountTotal > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", color: "#16a34a" }}>
                  <span>Total Discount:</span>
                  <span>-{fmt(data.discountTotal)}</span>
                </div>
              )}

              <div style={{ height: 1, backgroundColor: "#e2e8f0", margin: "4px 0" }} />

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 800, color: "#ea580c" }}>
                <span>Grand Total:</span>
                <span>{fmt(data.grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── AUTHORIZED SIGNATORY ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderTop: "1px solid #e2e8f0", paddingTop: 15, marginBottom: 15 }}>
          <div style={{ fontSize: 9, color: "#64748b" }}>
            <span>Whether tax is payable under reverse charge - No</span>
          </div>

          <div style={{ textAlign: "right", fontSize: 10 }}>
            <span style={{ fontWeight: 700, color: "#334155" }}>For {data.seller.company}:</span>
            <div style={{ 
              height: 40, 
              width: 160, 
              border: "1px dashed #cbd5e1", 
              borderRadius: 6,
              margin: "5px 0 3px auto", 
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#f8fafc",
              fontSize: 8,
              color: "#475569",
              fontStyle: "italic",
              lineHeight: 1.2
            }}>
              <span>Digitally Generated Invoice</span>
              <span style={{ fontSize: 7, fontWeight: 500, color: "#64748b" }}>No Signature Required</span>
            </div>
            <span style={{ fontSize: 9, color: "#64748b" }}>Authorized Signatory</span>
          </div>
        </div>

        {/* ── FOOTER & DISCLAIMER ── */}
        <div style={{ 
          marginTop: "auto", 
          borderTop: "1px solid #cbd5e1", 
          paddingTop: 12, 
          fontSize: 8, 
          color: "#64748b", 
          lineHeight: 1.4 
        }}>
          <p style={{ margin: "0 0 8px 0", fontSize: 7.5, color: "#94a3b8", fontStyle: "italic", textAlign: "center" }}>
            * Egnaro Mart is a registered online marketplace facilitator. Product liability and statutory GST compliance lies solely with the registered merchant seller listed above.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1.3fr 0.7fr", gap: 15 }}>
            <div>
              <span style={{ fontWeight: 700, color: "#475569" }}>Important Instructions:</span>
              <ul style={{ margin: "2px 0 0 0", paddingLeft: 12, listStyleType: "square", color: "#64748b" }}>
                <li>All disputes are subject to the jurisdiction of the seller's registered business state.</li>
                <li>Ensure the outer packaging is intact upon delivery before signing the acknowledgment.</li>
              </ul>
            </div>
            <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: 2 }}>
              <span>Egnaro Mart: <strong>egnaromart.com</strong></span>
              <span>Support Email: <strong>egnaromart@gmail.com</strong></span>
              <span>Phone helpline: <strong>+91 9442581506</strong></span>
            </div>
          </div>
        </div>

      </div>
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
