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
      id="printable-invoice"
      className="printable-container relative box-border overflow-hidden bg-white text-slate-900 font-sans"
      style={{
        width: "794px",
        height: "1123px",
        backgroundImage: `url(${letterheadImg})`,
        backgroundSize: "100% 100%",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        color: "#0f172a",
        fontFamily: "Inter, Arial, Helvetica, sans-serif",
      }}
    >
      {/* INNER CONTENT CONTAINER POSITIONED EXACTLY BETWEEN LETTERHEAD HEADER & FOOTER */}
      <div
        className="flex flex-col justify-between box-border"
        style={{
          paddingLeft: "44px",
          paddingRight: "44px",
          paddingTop: "215px",
          paddingBottom: "135px",
          height: "100%",
          width: "100%",
        }}
      >
        {/* TOP CONTENT AREA */}
        <div className="space-y-4">
          {/* 1. INVOICE TITLE & METADATA BAR */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/90 p-3.5 shadow-sm">
            <div className="flex justify-between items-center pb-2 mb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-600 inline-block" />
                <h2 className="text-xs font-black tracking-widest text-slate-900 uppercase">
                  Tax Invoice / Bill of Supply
                </h2>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-bold text-slate-400 uppercase block">Invoice No.</span>
                <span className="text-xs font-mono font-black text-emerald-700">{invoiceNo}</span>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-2 text-[10px] text-slate-700">
              <div>
                <span className="text-slate-400 font-bold uppercase text-[8px] block">Order ID</span>
                <span className="font-mono font-bold text-slate-900">{orderId}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[8px] block">Date</span>
                <span className="font-semibold text-slate-900">{createdDate}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[8px] block">Payment Mode</span>
                <span className="font-bold text-slate-900 uppercase">{order.payment_method || "COD"}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[8px] block">Payment Status</span>
                <span
                  className={`font-black uppercase text-[9px] px-1.5 py-0.5 rounded inline-block ${
                    order.payment_status === "paid"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : "bg-amber-100 text-amber-800 border border-amber-300"
                  }`}
                >
                  {order.payment_status || (order.payment_method === "cod" ? "Pending" : "Paid")}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[8px] block">Order Status</span>
                <span className="font-bold text-slate-900 uppercase">{order.status || "Confirmed"}</span>
              </div>
            </div>
          </div>

          {/* 2. SELLER & BUYER INFORMATION BOXES */}
          <div className="grid grid-cols-2 gap-4">
            {/* SELLER BOX */}
            <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/30 p-3.5 space-y-1">
              <div className="flex justify-between items-center border-b border-emerald-200/60 pb-1 mb-1.5">
                <span className="text-[9px] font-black uppercase tracking-wider text-emerald-800">
                  Seller / Supplier Details
                </span>
                <span className="text-[8px] font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                  Verified Seller
                </span>
              </div>
              <p className="font-black text-xs text-slate-900">{seller.name}</p>
              <p className="text-[10.5px] font-bold text-slate-700">{seller.company_name}</p>
              {seller.gst && (
                <p className="text-[10px] font-mono font-bold text-orange-700">
                  GSTIN: {seller.gst}
                </p>
              )}
              <p className="text-[10px] text-slate-600 leading-tight pt-0.5">{seller.address}</p>
              <div className="text-[9.5px] text-slate-500 pt-1 flex flex-wrap gap-x-2">
                <span>Ph: {seller.phone}</span>
                <span>•</span>
                <span>Email: {seller.email}</span>
              </div>
            </div>

            {/* BUYER BOX */}
            <div className="rounded-xl border border-orange-200/80 bg-orange-50/30 p-3.5 space-y-1">
              <div className="border-b border-orange-200/60 pb-1 mb-1.5">
                <span className="text-[9px] font-black uppercase tracking-wider text-orange-800">
                  Buyer Shipping & Billing Details
                </span>
              </div>
              <p className="font-black text-xs text-slate-900">
                {order.customer_name || "Valued Buyer"}
              </p>
              <p className="text-[10px] text-slate-700 leading-tight pt-0.5">
                {order.address || "Delivery Address Provided at Checkout"}
              </p>
              <div className="text-[9.5px] text-slate-500 pt-1 space-y-0.5">
                {order.phone && <p>Ph: {order.phone}</p>}
                {order.email && <p>Email: {order.email}</p>}
              </div>
            </div>
          </div>

          {/* 3. PRODUCTS ORDERED TABLE */}
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left border-collapse text-[10.5px]">
              <thead>
                <tr className="bg-slate-900 text-white uppercase text-[8.5px] font-bold tracking-wider">
                  <th className="py-2 px-3 text-center w-[5%]">#</th>
                  <th className="py-2 px-3 w-[45%]">Product Description</th>
                  <th className="py-2 px-3 text-center w-[8%]">Qty</th>
                  <th className="py-2 px-3 text-right w-[14%]">Unit Price</th>
                  <th className="py-2 px-3 text-right w-[13%]">Shipping</th>
                  <th className="py-2 px-3 text-right w-[15%]">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white text-slate-800">
                {items.map((item, idx) => {
                  const qty = item.quantity || item.qty || 1;
                  const unitPrice = Number(item.price) || 0;
                  const lineTotal = unitPrice * qty;

                  return (
                    <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                      <td className="py-2 px-3 text-center font-mono font-bold text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3">
                        <p className="font-bold text-slate-900 text-[11px]">
                          {item.name || item.title || "Product Item"}
                        </p>
                        {item.seller_name && (
                          <p className="text-[8.5px] text-slate-400">
                            Seller: <span className="font-semibold text-slate-600">{item.seller_name}</span>
                          </p>
                        )}
                      </td>
                      <td className="py-2 px-3 text-center font-mono font-bold text-slate-900">
                        {qty}
                      </td>
                      <td className="py-2 px-3 text-right font-mono">{inr(unitPrice)}</td>
                      <td className="py-2 px-3 text-right font-mono text-slate-500">
                        {shippingNum === 0 ? "FREE" : inr(shippingNum / Math.max(1, items.length))}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                        {inr(lineTotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* BOTTOM CONTENT AREA (FINANCIAL SUMMARY & DECLARATION) */}
        <div>
          <div className="flex justify-between items-end gap-6 pt-2">
            {/* TERMS & DECLARATION */}
            <div className="flex-1 space-y-1 text-[9px] text-slate-500">
              <p className="font-bold text-slate-800 uppercase tracking-wider text-[9.5px]">
                Declaration & Terms:
              </p>
              <p className="leading-tight">
                This is a computer-generated tax invoice issued by Egnaro Mart Marketplace under the Information Technology Act.
              </p>
              <p className="leading-tight">
                Goods once sold are covered under Egnaro Mart Marketplace Protection policy. Manufacturer warranties apply.
              </p>
            </div>

            {/* FINANCIAL SUMMARY BOX */}
            <div className="w-60 rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] space-y-1.5 shadow-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-mono font-semibold">{inr(subtotalNum)}</span>
              </div>
              {discountNum > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Discount</span>
                  <span className="font-mono">-{inr(discountNum)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Shipping Charges</span>
                <span className="font-mono font-semibold text-slate-900">
                  {shippingNum === 0 ? "FREE" : inr(shippingNum)}
                </span>
              </div>
              <div className="border-t-2 border-slate-900 pt-1.5 flex justify-between items-baseline font-black text-slate-900 text-xs">
                <span>Grand Total</span>
                <span className="font-mono text-sm text-orange-600">{inr(totalNum)}</span>
              </div>
            </div>
          </div>

          <p className="text-center text-[9px] text-slate-400 font-mono mt-4">
            Thank you for shopping on Egnaro Mart — India's Premium B2B & Retail Marketplace!
          </p>
        </div>
      </div>
    </div>
  );
}
