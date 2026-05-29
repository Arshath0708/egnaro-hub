import { motion } from "framer-motion";
import { X, User, Mail, Phone, Calendar, MapPin, Award, ShoppingBag, IndianRupee, Sparkles, Building } from "lucide-react";
import { inr } from "@/lib/format";

type Address = {
  fullName?: string;
  phone?: string;
  state?: string;
  city?: string;
  town?: string;
  street_address?: string;
  landmark?: string;
  pincode?: string;
};

type UserType = {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  joined_date: string;
  address_count: number;
  addresses: Address[];
  total_orders: number;
  total_spent: number;
  status: string;
};

interface Props {
  user: UserType;
  onClose: () => void;
}

/* ================= LAYERED ICON CONTAINER ================= */
function LayeredIconContainer({
  icon,
  glowColor,
}: {
  icon: React.ReactNode;
  glowColor: string;
}) {
  return (
    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-slate-950/80 backdrop-blur-xl overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
      <div
        className="absolute inset-0 opacity-40 blur-md"
        style={{
          background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`
        }}
      />
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
      <div className="relative text-white z-10">{icon}</div>
    </div>
  );
}

export function ViewUserModal({ user, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 flex items-center justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/85 backdrop-blur-md"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className="relative z-10 w-full max-w-4xl rounded-[32px] border border-white/5 bg-gradient-to-b from-[#0a0f1d] to-[#05070a] shadow-[0_30px_70px_rgba(0,0,0,0.8)] overflow-hidden"
      >
        {/* Glow orbs */}
        <div className="absolute -top-12 -left-12 h-48 w-48 rounded-full blur-3xl opacity-15 pointer-events-none bg-violet-500" />
        <div className="absolute -bottom-12 -right-12 h-48 w-48 rounded-full blur-3xl opacity-15 pointer-events-none bg-cyan-500" />

        <div className="p-6 md:p-8 lg:p-10 relative z-10">
          {/* HEADER */}
          <div className="mb-8 flex items-start justify-between">
            <div className="flex gap-4">
              <LayeredIconContainer
                icon={<User className="h-5 w-5 text-violet-400" />}
                glowColor="rgba(139, 92, 246, 0.4)"
              />
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-violet-300">
                  <Sparkles className="h-3 w-3 text-violet-400" />
                  Customer Intelligence profile
                </div>
                <h2 className="text-2xl font-black text-white md:text-3xl tracking-wide mt-1.5 leading-none">
                  {user.fullName}
                </h2>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500 font-semibold">
                  <Calendar className="h-3.5 w-3.5 text-gray-500" />
                  <span>Joined: {user.joined_date ? new Date(user.joined_date).toLocaleDateString('en-IN') : 'N/A'}</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all hover:bg-white/10 active:scale-90 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* GRID LAYOUT */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* COLUMN 1: ANALYTICS & INSIGHTS */}
            <div className="space-y-6 lg:col-span-2">
              {/* Dynamic Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-cyan-400">
                    <ShoppingBag className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-white">{user.total_orders}</div>
                    <div className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mt-1">Total Orders Placed</div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/5 bg-[#FF6600]/5 p-5 space-y-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 border border-[#FF6600]/25 text-[#FF6600]">
                    <IndianRupee className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-[#FF6600]">{inr(user.total_spent)}</div>
                    <div className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mt-1">Gross Spend (GMV)</div>
                  </div>
                </div>
              </div>

              {/* Dynamic Customer Segmentation */}
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 space-y-4">
                <h3 className="flex items-center gap-2 text-xs font-extrabold text-white uppercase tracking-wider">
                  <Award className="h-4 w-4 text-violet-400" />
                  Customer Segmentation & Classification
                </h3>
                
                <div className="flex items-start gap-4 p-4 rounded-xl bg-black/40 border border-white/5">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-400">Status Classification:</span>
                      <StatusBadge status={user.status} />
                    </div>
                    <p className="text-[11px] text-gray-500 leading-relaxed mt-1">
                      {user.status === "Premium Customer" && "High-priority corporate accounts with top-tier purchase frequency and volume. Handled by rapid resolution queue."}
                      {user.status === "Frequent Buyer" && "Engaged merchant customers shopping consistently across catalogs. Prime candidate for loyalty campaign enrollment."}
                      {user.status === "New Customer" && "Recent onboarding account registry. Welcome campaigns and coupon activations are recommended."}
                      {user.status === "Inactive User" && "Account registered over 30 days ago with zero transaction history. Re-engagement protocols recommended."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact card */}
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 space-y-4">
                <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">Profile Contact Ledger</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <Mail className="h-4 w-4 text-gray-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block">Registered Email</span>
                      <span className="text-xs font-bold text-white block mt-0.5 truncate">{user.email || "N/A"}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="h-4 w-4 text-gray-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block">Phone Connection</span>
                      <span className="text-xs font-bold text-white block mt-0.5">{user.phone || "N/A"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* COLUMN 2: ADDRESSES */}
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 flex flex-col h-full max-h-[420px] overflow-hidden">
              <h3 className="flex items-center gap-2 text-xs font-extrabold text-white uppercase tracking-wider pb-4 border-b border-white/5">
                <MapPin className="h-4 w-4 text-[#FF6600]" />
                Delivery Registers ({user.address_count})
              </h3>
              
              <div className="flex-1 overflow-y-auto mt-4 pr-1 space-y-3.5 scrollbar-thin">
                {user.addresses.length === 0 ? (
                  <div className="py-12 text-center text-xs text-gray-500 italic">
                    No addresses registered for this customer.
                  </div>
                ) : (
                  user.addresses.map((addr, idx) => (
                    <div key={idx} className="rounded-xl border border-white/5 bg-black/40 p-4 space-y-1.5 text-xs text-gray-400">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-white text-xs">{addr.fullName || "Recipient Address"}</span>
                        <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-white/5 text-gray-500">
                          #{idx + 1}
                        </span>
                      </div>
                      {addr.phone && <p className="text-[11px]">📞 {addr.phone}</p>}
                      <p className="text-[11px] leading-relaxed italic text-gray-500">
                        {addr.street_address && `${addr.street_address}, `}
                        {addr.landmark && `Near ${addr.landmark}, `}
                        {addr.town && `${addr.town}, `}
                        {addr.city && `${addr.city}, `}
                        {addr.state && `${addr.state}`}
                        {addr.pincode && ` - ${addr.pincode}`}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "Premium Customer") {
    return (
      <span className="inline-flex items-center rounded-lg bg-violet-500/10 border border-violet-500/20 px-2.5 py-0.5 text-[9px] font-black uppercase text-violet-400 tracking-wider">
        💎 Premium Customer
      </span>
    );
  }
  if (status === "Frequent Buyer") {
    return (
      <span className="inline-flex items-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[9px] font-black uppercase text-emerald-400 tracking-wider">
        🔥 Frequent Buyer
      </span>
    );
  }
  if (status === "Inactive User") {
    return (
      <span className="inline-flex items-center rounded-lg bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 text-[9px] font-black uppercase text-red-400 tracking-wider">
        💤 Inactive User
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-lg bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 text-[9px] font-black uppercase text-cyan-400 tracking-wider">
      🌱 New Customer
    </span>
  );
}
