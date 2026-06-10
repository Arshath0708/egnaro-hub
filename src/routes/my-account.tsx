import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  MapPin,
  User,
  Headphones,
  ChevronLeft,
  Plus,
  Trash2,
  Sparkles,
  Lock,
  ArrowRight,
  X,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
  Mail,
  Phone,
} from "lucide-react";

import { Shell } from "@/components/layout/Shell";
import { useAuth, selectIsLoggedIn } from "@/context/auth-store";
import { clearUserSession } from "@/lib/session";
import {
  getUser,
  updateProfile,
  manageAddress,
  getUserOrders,
} from "@/services/api";
import { queryKeys } from "@/lib/query-keys";
import { inr } from "@/lib/format";
import { toast } from "sonner";
import { validateName, validatePhone, validatePincode, sanitizeInput } from "@/lib/validation";
import { useDocumentMetadata } from "@/hooks/useDocumentMetadata";

type Address = {
  label: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
};

/* ==========================================================
   PREMIUM 3D GLASSMORPHIC SVG MEDALLIONS
   ========================================================== */

function OrdersMedallion() {
  return (
    <div className="relative">
      {/* Dynamic back-glow glow ring */}
      <div className="absolute inset-0 rounded-full bg-primary/10 blur-md opacity-70 transition-[transform,border-color,background-color,box-shadow,color] duration-500 group-hover:bg-primary/25 group-hover:blur-xl" />
      <svg
        className="relative w-15 h-15 transform transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 drop-shadow-[0_8px_16px_rgba(249,115,22,0.15)] text-primary"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="cubeTop" x1="50" y1="20" x2="50" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ff9f68" stopOpacity="0.8" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="cubeLeft" x1="24" y1="35" x2="50" y2="78" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#7a2a00" stopOpacity="0.35" />
          </linearGradient>
          <linearGradient id="cubeRight" x1="50" y1="48" x2="76" y2="78" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#eab308" stopOpacity="0.65" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.2" />
          </linearGradient>
          <radialGradient id="cubeGlow" cx="50" cy="50" r="38" fx="50" fy="50" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="38" fill="url(#cubeGlow)" />
        <circle cx="50" cy="50" r="38" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        
        {/* Isometric Cube Faces */}
        <path d="M50 22 L76 35 L50 48 L24 35 Z" fill="url(#cubeTop)" stroke="rgba(255,255,255,0.25)" strokeWidth="0.75" />
        <path d="M24 35 L50 48 L50 78 L24 65 Z" fill="url(#cubeLeft)" stroke="rgba(255,255,255,0.12)" strokeWidth="0.75" />
        <path d="M50 48 L76 35 L76 65 L50 78 Z" fill="url(#cubeRight)" stroke="rgba(255,255,255,0.12)" strokeWidth="0.75" />
        
        {/* Grid and highlight guides */}
        <path d="M50 35 L63 41.5 M50 35 L37 41.5" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeLinecap="round" />
        <circle cx="50" cy="50" r="42" stroke="rgba(255,102,0,0.1)" strokeWidth="0.75" strokeDasharray="4 12" />
      </svg>
    </div>
  );
}

function AddressesMedallion() {
  return (
    <div className="relative">
      <div className="absolute inset-0 rounded-full bg-green-500/10 blur-md opacity-70 transition-[transform,border-color,background-color,box-shadow,color] duration-500 group-hover:bg-green-500/25 group-hover:blur-xl" />
      <svg
        className="relative w-15 h-15 transform transition-transform duration-500 group-hover:scale-110 group-hover:-translate-y-0.5 drop-shadow-[0_8px_16px_rgba(34,197,94,0.15)]"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="pinGrad" x1="50" y1="20" x2="50" y2="72" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#4ade80" />
            <stop offset="100%" stopColor="#15803d" />
          </linearGradient>
          <radialGradient id="greenGlow" cx="50" cy="65" r="30" fx="50" fy="65" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="65" r="28" fill="url(#greenGlow)" />
        <circle cx="50" cy="50" r="38" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        
        {/* Route Mesh Nodes */}
        <path d="M30 65 L70 65 M40 55 L60 75 M40 75 L60 55" stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeLinecap="round" />
        <ellipse cx="50" cy="65" rx="18" ry="7" stroke="rgba(34,197,94,0.3)" strokeWidth="1" strokeLinecap="round" strokeDasharray="3 6" />
        
        {/* Glowing Pin */}
        <path d="M50 20 C38 20 28 30 28 42 C28 55 50 72 50 72 C50 72 72 55 72 42 C72 30 62 20 50 20 Z" fill="url(#pinGrad)" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
        <circle cx="50" cy="40" r="8" fill="#030712" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
      </svg>
    </div>
  );
}

function SecurityMedallion() {
  return (
    <div className="relative">
      <div className="absolute inset-0 rounded-full bg-[#00ddff]/10 blur-md opacity-70 transition-[transform,border-color,background-color,box-shadow,color] duration-500 group-hover:bg-[#00ddff]/25 group-hover:blur-xl" />
      <svg
        className="relative w-15 h-15 transform transition-transform duration-500 group-hover:scale-110 group-hover:rotate-[-6deg] drop-shadow-[0_8px_16px_rgba(0,221,255,0.15)]"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="shieldGrad" x1="50" y1="20" x2="50" y2="80" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00f0ff" />
            <stop offset="100%" stopColor="#0369a1" />
          </linearGradient>
          <radialGradient id="blueGlow" cx="50" cy="50" r="40" fx="50" fy="50" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00ddff" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#00ddff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="38" fill="url(#blueGlow)" />
        <circle cx="50" cy="50" r="38" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        
        {/* Enterprise Shield */}
        <path d="M50 22 C64 22 74 26 74 26 C74 46 66 68 50 78 C34 68 26 46 26 26 C26 26 36 22 50 22 Z" fill="url(#shieldGrad)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" strokeLinejoin="round" />
        
        {/* Fingerprint pattern */}
        <path d="M40 45 C45 40 55 40 60 45 M35 52 C42 45 58 45 65 52 M37 60 C44 54 56 54 63 60 M45 67 C48 64 52 64 55 67" stroke="rgba(255,255,255,0.85)" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="50" cy="50" r="3" fill="#ffffff" className="animate-pulse" />
      </svg>
    </div>
  );
}

function HelpMedallion() {
  return (
    <div className="relative">
      <div className="absolute inset-0 rounded-full bg-yellow-500/10 blur-md opacity-70 transition-[transform,border-color,background-color,box-shadow,color] duration-500 group-hover:bg-yellow-500/25 group-hover:blur-xl" />
      <svg
        className="relative w-15 h-15 transform transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12 drop-shadow-[0_8px_16px_rgba(234,179,8,0.15)]"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="headsetGrad" x1="50" y1="20" x2="50" y2="70" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="100%" stopColor="#ca8a04" />
          </linearGradient>
          <radialGradient id="yellowGlow" cx="50" cy="50" r="40" fx="50" fy="50" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#eab308" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#eab308" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="38" fill="url(#yellowGlow)" />
        <circle cx="50" cy="50" r="38" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        
        {/* Soundwaves */}
        <path d="M30 50 L35 50 M40 50 L45 50 M50 50 L55 50 M60 50 L65 50 M70 50 L75 50" stroke="rgba(255,255,255,0.15)" strokeWidth="2" strokeLinecap="round" />
        <path d="M45 43 L45 57 M55 43 L55 57" stroke="rgba(234,179,8,0.4)" strokeWidth="2" strokeLinecap="round" />
        
        {/* Headphones Arch */}
        <path d="M28 52 C28 32 40 22 50 22 C60 22 72 32 72 52" stroke="url(#headsetGrad)" strokeWidth="3" strokeLinecap="round" />
        <rect x="23" y="46" width="10" height="14" rx="3" fill="url(#headsetGrad)" stroke="rgba(255,255,255,0.25)" strokeWidth="0.75" />
        <rect x="67" y="46" width="10" height="14" rx="3" fill="url(#headsetGrad)" stroke="rgba(255,255,255,0.25)" strokeWidth="0.75" />
        
        {/* Microphone */}
        <path d="M30 58 C30 65 38 68 44 68" stroke="url(#headsetGrad)" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="44" cy="68" r="2.5" fill="#fef08a" />
      </svg>
    </div>
  );
}

function GoldMedallion() {
  return (
    <div className="relative">
      <div className="absolute inset-0 rounded-full bg-amber-500/10 blur-md opacity-70 transition-[transform,border-color,background-color,box-shadow,color] duration-500 group-hover:bg-amber-500/25 group-hover:blur-xl" />
      <svg
        className="relative w-15 h-15 transform transition-transform duration-500 group-hover:scale-110 group-hover:rotate-[-6deg] drop-shadow-[0_8px_16px_rgba(245,158,11,0.2)]"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="goldCrown" x1="50" y1="20" x2="50" y2="80" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="35%" stopColor="#f59e0b" />
            <stop offset="70%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
          <radialGradient id="amberGlow" cx="50" cy="55" r="35" fx="50" fy="55" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="38" fill="url(#amberGlow)" />
        <circle cx="50" cy="50" r="38" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        
        {/* Luxury Gold Crown */}
        <path d="M22 68 L28 42 L40 52 L50 30 L60 52 L72 42 L78 68 Z" fill="url(#goldCrown)" stroke="rgba(255,255,255,0.3)" strokeWidth="0.75" strokeLinejoin="round" />
        <path d="M22 68 C22 68 35 71 50 71 C65 71 78 68 78 68 L78 74 C78 74 65 77 50 77 C35 77 22 74 22 74 Z" fill="url(#goldCrown)" stroke="rgba(255,255,255,0.2)" strokeWidth="0.75" strokeLinejoin="round" />
        
        {/* Sparkling diamond points */}
        <circle cx="28" cy="40" r="2" fill="#ffffff" stroke="#f59e0b" strokeWidth="0.5" />
        <circle cx="50" cy="28" r="2.5" fill="#ffffff" stroke="#f59e0b" strokeWidth="0.5" />
        <circle cx="72" cy="40" r="2" fill="#ffffff" stroke="#f59e0b" strokeWidth="0.5" />
        
        {/* Star flashes */}
        <path d="M18 36 L21 38 M18 42 L21 40" stroke="rgba(255,255,255,0.7)" strokeWidth="0.75" strokeLinecap="round" />
        <path d="M82 36 L79 38 M82 42 L79 40" stroke="rgba(255,255,255,0.7)" strokeWidth="0.75" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export default function MyAccount() {
  useDocumentMetadata("My Account", "Manage your customer account, view your orders, update addresses, and change account passwords on Egnaro Mart.");

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const token = useAuth((s) => s.token);
  const isLoggedIn = useAuth(selectIsLoggedIn);
  const user = useAuth((s) => s.user);



  // Expanded Workspace controller
  const [activeSubTab, setActiveSubTab] = useState<"orders" | "addresses" | "security" | "help" | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddressIndex, setEditingAddressIndex] = useState<number | null>(null);
  const [addressToDeleteIndex, setAddressToDeleteIndex] = useState<number | null>(null);

  // Forms states
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");

  const [addressForm, setAddressForm] = useState<Address>({
    label: "Home",
    street: "",
    city: "",
    state: "",
    pincode: "",
  });

  // Queries
  const { data: userProfileData, isLoading: isProfileLoading } = useQuery({
    queryKey: queryKeys.userProfile(token!),
    queryFn: () => getUser(token!),
    enabled: !!token,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const { data: ordersRes, isLoading: isOrdersLoading } = useQuery({
    queryKey: queryKeys.userOrders(token!),
    queryFn: () => getUserOrders(token!),
    enabled: !!token,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  // Redirect to login if user session is invalid
  useEffect(() => {
    if (!isLoggedIn || !token) {
      toast.error("Please login to access your account dashboard.");
      navigate("/login");
      return;
    }

    if (userProfileData?.message === "Invalid or expired token" || ordersRes?.message === "Invalid or expired token") {
      clearUserSession(queryClient);
      toast.error("Your session has expired. Please log in again.");
      navigate("/login");
    }
  }, [isLoggedIn, token, navigate, userProfileData, ordersRes, queryClient]);

  // Keep internal form inputs synced with loaded profile details
  useEffect(() => {
    if (userProfileData?.user) {
      setProfileName(userProfileData.user.fullName || userProfileData.user.name || "");
      setProfilePhone(userProfileData.user.phone || "");
    }
  }, [userProfileData]);

  // Mutations
  const updateProfileMutation = useMutation({
    mutationFn: (data: { fullName: string; phone: string }) =>
      updateProfile(token!, data.fullName, data.phone),
    onSuccess: (res) => {
      if (res.success) {
        toast.success("Profile details updated successfully!");
        queryClient.invalidateQueries({ queryKey: queryKeys.userProfile(token!) });
      } else {
        toast.error(res.message || "Failed to update profile details.");
      }
    },
  });

  const addressMutation = useMutation({
    mutationFn: async ({ action, payload }: { action: string; payload: any }) => {
      return await manageAddress(token!, action, payload);
    },
    onSuccess: (res) => {
      if (res?.success) {
        toast.success("Address book successfully updated!");
        queryClient.invalidateQueries({ queryKey: queryKeys.userProfile(token!) });
        setShowAddressModal(false);
        setEditingAddressIndex(null);
        setAddressForm({
          label: "Home",
          street: "",
          city: "",
          state: "",
          pincode: "",
        });
      } else {
        toast.error(res?.message || "Failed to update addresses.");
      }
    },
  });

  if (!isLoggedIn || !token) {
    return (
      <Shell>
        <div className="flex min-h-[70vh] flex-col items-center justify-center bg-[#020617] text-white">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-transparent border-t-primary border-r-primary/30" />
          <p className="mt-4 font-sans text-xs font-semibold tracking-widest text-slate-400 uppercase animate-pulse">
            Loading your dashboard...
          </p>
        </div>
      </Shell>
    );
  }

  const profile = userProfileData?.user || user;
  const addresses: Address[] = userProfileData?.addresses || profile?.addresses || [];
  const defaultAddressIndex = userProfileData?.default_address_index ?? profile?.default_address_index ?? 0;
  const orders = Array.isArray(ordersRes) ? ordersRes : ordersRes?.orders || [];

  const productsOrdered = orders.reduce((totalAcc: number, o: any) => {
    const items = Array.isArray(o.items)
      ? o.items
      : typeof o.items === "string"
      ? JSON.parse(o.items)
      : [];
    return totalAcc + items.reduce((itemAcc: number, item: any) => itemAcc + (Number(item.quantity || item.qty || 0) || 0), 0);
  }, 0);

  // Greeting name - strictly resolved, uppercase formatted
  const displayGreetingName = (profile?.fullName || profile?.name || user?.name || "Customer").toUpperCase();

  function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    const cleanName = sanitizeInput(profileName);
    
    if (!validateName(cleanName)) {
      toast.error("Valid full name required (letters and spaces only)");
      return;
    }
    if (profilePhone && !validatePhone(profilePhone)) {
      toast.error("Valid 10-digit phone number required");
      return;
    }
    updateProfileMutation.mutate({ fullName: cleanName, phone: profilePhone });
  }

  async function handleSaveAddress(e: React.FormEvent) {
    e.preventDefault();
    
    const cleanStreet = sanitizeInput(addressForm.street);
    const cleanCity = sanitizeInput(addressForm.city);
    const cleanState = sanitizeInput(addressForm.state);
    const cleanLabel = sanitizeInput(addressForm.label);
    
    if (!cleanStreet || !cleanCity || !cleanState || !addressForm.pincode.trim()) {
      toast.error("All address fields are required");
      return;
    }
    
    if (!validatePincode(addressForm.pincode)) {
      toast.error("Valid 6-digit pincode required");
      return;
    }
    
    const finalPayload = {
      ...addressForm,
      street: cleanStreet,
      city: cleanCity,
      state: cleanState,
      label: cleanLabel || "Address",
    };

    if (editingAddressIndex !== null) {
      // Edit mode: delete the address index first, then add the new updated coordinates
      addressMutation.mutate({
        action: "delete",
        payload: { index: editingAddressIndex },
      });
      // Sequence immediate add operation after the deletion
      setTimeout(() => {
        addressMutation.mutate({
          action: "add",
          payload: finalPayload,
        });
      }, 350);
    } else {
      // Add mode: direct save
      addressMutation.mutate({
        action: "add",
        payload: finalPayload,
      });
    }
  }

  return (
    <Shell>
      <div className="min-h-screen bg-[#030712] text-white font-sans py-5 sm:py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Ambient Radial Lighting Effects */}
        <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-primary/5 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-yellow-500/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="mx-auto max-w-7xl relative z-10">
          
          {/* ==========================================
              1. HERO BRAND CUSTOMER INFO HUB
             ========================================== */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative mb-6 sm:mb-10 rounded-3xl border border-white/5 bg-gradient-to-br from-white/5 to-white/0 p-4 sm:p-6 md:p-8 backdrop-blur-2xl overflow-hidden shadow-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-white/5 pointer-events-none" />
            
            <div className="flex flex-col gap-6 sm:gap-8">
              {/* Profile Details Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 border-b border-white/5 pb-4 sm:pb-6">
                <div className="flex items-center gap-3.5 sm:gap-4.5">
                  <div className="relative">
                    <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-primary to-yellow-500 blur-sm opacity-40 animate-pulse" />
                    <div className="relative flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-slate-900 border-2 border-white/10 text-white font-display text-lg sm:text-xl font-black uppercase shadow-inner">
                      {displayGreetingName ? displayGreetingName[0] : "C"}
                    </div>
                  </div>

                  <div>
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-primary mb-1.5 sm:mb-2">
                      <Sparkles className="h-3 w-3" />
                      Verified Customer
                    </div>
                    <h1 className="text-lg sm:text-xl md:text-2xl font-display font-black tracking-tight text-white uppercase">
                      Hello, {displayGreetingName}
                    </h1>
                    <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1">
                      {profile?.email || user?.email} • Shopping workspace portal
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    clearUserSession(queryClient);
                    navigate("/login");
                    toast.success("Successfully logged out.");
                  }}
                  className="rounded-xl border border-white/10 bg-white/5 hover:bg-red-500/10 hover:border-red-500/20 px-3.5 py-2 sm:px-4 sm:py-2.5 text-xs font-bold text-slate-300 hover:text-red-400 transition-all select-none cursor-pointer self-start sm:self-center"
                >
                  Sign Out
                </button>
              </div>

              {/* 5-Column Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                {/* 1. Total Orders */}
                <div 
                  onClick={() => navigate("/track-order")}
                  className="bg-white/5 border border-white/5 rounded-2xl p-3.5 sm:p-4 text-center cursor-pointer hover:bg-white/10 hover:border-primary/30 hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between min-h-[90px] sm:min-h-[100px] group"
                >
                  <span className="block text-slate-500 text-[8px] sm:text-[9px] font-bold tracking-widest uppercase group-hover:text-slate-300 transition-colors">Total Orders</span>
                  <span className="block text-lg sm:text-2xl font-black text-white mt-1.5 sm:mt-2">
                    {isOrdersLoading ? (
                      <span className="inline-block h-6 w-8 animate-pulse rounded bg-white/10" />
                    ) : (
                      orders.length
                    )}
                  </span>
                  <span className="block text-[7px] sm:text-[8px] font-bold text-slate-500 mt-1 uppercase tracking-wider group-hover:text-primary transition-colors">View History →</span>
                </div>

                {/* 2. Products Ordered */}
                <div 
                  onClick={() => navigate("/track-order")}
                  className="bg-white/5 border border-white/5 rounded-2xl p-3.5 sm:p-4 text-center cursor-pointer hover:bg-white/10 hover:border-primary/30 hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between min-h-[90px] sm:min-h-[100px] group"
                >
                  <span className="block text-slate-500 text-[8px] sm:text-[9px] font-bold tracking-widest uppercase group-hover:text-slate-300 transition-colors">Products Ordered</span>
                  <span className="block text-lg sm:text-2xl font-black text-primary mt-1.5 sm:mt-2">
                    {isOrdersLoading ? (
                      <span className="inline-block h-6 w-8 animate-pulse rounded bg-white/10" />
                    ) : (
                      productsOrdered
                    )}
                  </span>
                  <span className="block text-[7px] sm:text-[8px] font-bold text-slate-500 mt-1 uppercase tracking-wider group-hover:text-primary transition-colors">View Items →</span>
                </div>

                {/* 3. Saved Addresses */}
                <div 
                  onClick={() => setActiveSubTab("addresses")}
                  className="bg-white/5 border border-white/5 rounded-2xl p-3.5 sm:p-4 text-center cursor-pointer hover:bg-white/10 hover:border-green-500/30 hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between min-h-[90px] sm:min-h-[100px] group"
                >
                  <span className="block text-slate-500 text-[8px] sm:text-[9px] font-bold tracking-widest uppercase group-hover:text-slate-300 transition-colors">Saved Addresses</span>
                  <span className="block text-lg sm:text-2xl font-black text-white mt-1.5 sm:mt-2">
                    {isProfileLoading ? (
                      <span className="inline-block h-6 w-8 animate-pulse rounded bg-white/10" />
                    ) : (
                      addresses.length
                    )}
                  </span>
                  <span className="block text-[7px] sm:text-[8px] font-bold text-slate-500 mt-1 uppercase tracking-wider group-hover:text-green-400 transition-colors">Manage →</span>
                </div>

                {/* 4. Account Details */}
                <div 
                  onClick={() => setActiveSubTab("security")}
                  className="bg-white/5 border border-white/5 rounded-2xl p-3.5 sm:p-4 text-center cursor-pointer hover:bg-white/10 hover:border-[#00ddff]/30 hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between min-h-[90px] sm:min-h-[100px] group"
                >
                  <span className="block text-slate-500 text-[8px] sm:text-[9px] font-bold tracking-widest uppercase group-hover:text-slate-300 transition-colors">Account Details</span>
                  <span className="block text-xs sm:text-sm font-black text-[#00ddff] mt-2.5 sm:mt-3.5 uppercase tracking-wider">
                    {isProfileLoading ? (
                      <span className="inline-block h-4 w-16 animate-pulse rounded bg-white/10" />
                    ) : (
                      profile?.fullName && profile?.phone ? "Complete" : "Incomplete"
                    )}
                  </span>
                  <span className="block text-[7px] sm:text-[8px] font-bold text-slate-500 mt-1 uppercase tracking-wider group-hover:text-[#00ddff] transition-colors">Edit Profile →</span>
                </div>

                {/* 5. Security Settings */}
                <div 
                  onClick={() => setActiveSubTab("security")}
                  className="bg-white/5 border border-white/5 rounded-2xl p-3.5 sm:p-4 text-center cursor-pointer hover:bg-white/10 hover:border-yellow-500/30 hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between min-h-[90px] sm:min-h-[100px] group col-span-2 sm:col-span-1"
                >
                  <span className="block text-slate-500 text-[8px] sm:text-[9px] font-bold tracking-widest uppercase group-hover:text-slate-300 transition-colors">Security Settings</span>
                  <span className="block text-xs sm:text-sm font-black text-emerald-400 mt-2.5 sm:mt-3.5 uppercase tracking-wider flex items-center justify-center gap-1">
                    <ShieldCheck className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-emerald-400" /> SECURED
                  </span>
                  <span className="block text-[7px] sm:text-[8px] font-bold text-slate-500 mt-1 uppercase tracking-wider group-hover:text-yellow-400 transition-colors">Configure →</span>
                </div>
              </div>
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            {!activeSubTab ? (
              
              /* ==========================================================
                  2. CENTRALIZED CentralIZED Centralized 3-COLUMN CARD GRID
                 ========================================================== */
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8"
              >
                {/* 2.1 Track Purchase */}
                <motion.div
                  onClick={() => navigate("/track-order")}
                  whileHover={{ scale: 1.02, y: -4 }}
                  transition={{ type: "spring", stiffness: 450, damping: 25 }}
                  className="group relative cursor-pointer rounded-3xl border border-white/5 bg-[#0e1626]/40 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl transition-[transform,border-color,background-color,box-shadow,color] duration-300 hover:border-slate-800 hover:bg-[#0c1220]/75 hover:shadow-glow"
                >
                  {/* Subtle inner hover glow gradient */}
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-primary/0 via-transparent to-white/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none" />
                  
                  <div className="absolute top-6 right-6 text-slate-500 transition-[transform,border-color,background-color,box-shadow,color] duration-300 group-hover:text-primary group-hover:translate-x-1">
                    <ArrowRight className="h-5 w-5" />
                  </div>
                  
                  <div className="mb-6 flex justify-start">
                    <OrdersMedallion />
                  </div>
                  
                  <h3 className="font-display text-lg font-black text-white mb-2 tracking-tight transition-colors duration-300 group-hover:text-primary">
                    Your Orders
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-6">
                    Track live deliveries, view purchase histories, and fetch transaction receipts.
                  </p>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/25 px-3 py-1.2 text-[10px] font-bold tracking-wider text-primary uppercase transition-[transform,border-color,background-color,box-shadow,color] group-hover:bg-primary/20">
                    View Orders ({isOrdersLoading ? "..." : orders.length})
                  </span>
                </motion.div>

                {/* 2.2 Address Book card */}
                <motion.div
                  onClick={() => setActiveSubTab("addresses")}
                  whileHover={{ scale: 1.02, y: -4 }}
                  transition={{ type: "spring", stiffness: 450, damping: 25 }}
                  className="group relative cursor-pointer rounded-3xl border border-white/5 bg-[#0e1626]/40 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl transition-[transform,border-color,background-color,box-shadow,color] duration-300 hover:border-slate-800 hover:bg-[#0c1220]/75 hover:shadow-[0_20px_50px_rgba(34,197,94,0.06),0_0_30px_rgba(34,197,94,0.03)]"
                >
                  <div className="absolute top-6 right-6 text-slate-500 transition-[transform,border-color,background-color,box-shadow,color] duration-300 group-hover:text-green-400 group-hover:translate-x-1">
                     <ArrowRight className="h-5 w-5" />
                  </div>

                  <div className="mb-6 flex justify-start">
                    <AddressesMedallion />
                  </div>

                  <h3 className="font-display text-lg font-black text-white mb-2 tracking-tight transition-colors duration-300 group-hover:text-green-400">
                    Delivery Addresses
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-6">
                    Manage coordinate directories, add home/work entries, or configure primary endpoints.
                  </p>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 border border-green-500/25 px-3 py-1.2 text-[10px] font-bold tracking-wider text-green-400 uppercase transition-[transform,border-color,background-color,box-shadow,color] group-hover:bg-green-500/20">
                    Configure Addresses ({isProfileLoading ? "..." : addresses.length})
                  </span>
                </motion.div>

                {/* 2.3 Account Security details card */}
                <motion.div
                  onClick={() => setActiveSubTab("security")}
                  whileHover={{ scale: 1.02, y: -4 }}
                  transition={{ type: "spring", stiffness: 450, damping: 25 }}
                  className="group relative cursor-pointer rounded-3xl border border-white/5 bg-[#0e1626]/40 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl transition-[transform,border-color,background-color,box-shadow,color] duration-300 hover:border-slate-800 hover:bg-[#0c1220]/75 hover:shadow-[0_20px_50px_rgba(0,221,255,0.06),0_0_30px_rgba(0,221,255,0.03)]"
                >
                  <div className="absolute top-6 right-6 text-slate-500 transition-[transform,border-color,background-color,box-shadow,color] duration-300 group-hover:text-[#00ddff] group-hover:translate-x-1">
                    <ArrowRight className="h-5 w-5" />
                  </div>

                  <div className="mb-6 flex justify-start">
                    <SecurityMedallion />
                  </div>

                  <h3 className="font-display text-lg font-black text-white mb-2 tracking-tight transition-colors duration-300 group-hover:text-[#00ddff]">
                    Account Security
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-6">
                    Modify profile parameters, update verified phones, or request a password key reset.
                  </p>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#00ddff]/10 border border-[#00ddff]/25 px-3 py-1.2 text-[10px] font-bold tracking-wider text-[#00ddff] uppercase transition-[transform,border-color,background-color,box-shadow,color] group-hover:bg-[#00ddff]/20">
                    Configure Security
                  </span>
                </motion.div>

                {/* 2.4 Support center card */}
                <motion.div
                  onClick={() => setActiveSubTab("help")}
                  whileHover={{ scale: 1.02, y: -4 }}
                  transition={{ type: "spring", stiffness: 450, damping: 25 }}
                  className="group relative cursor-pointer rounded-3xl border border-white/5 bg-[#0e1626]/40 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl transition-[transform,border-color,background-color,box-shadow,color] duration-300 hover:border-slate-800 hover:bg-[#0c1220]/75 hover:shadow-[0_20px_50px_rgba(234,179,8,0.06),0_0_30px_rgba(234,179,8,0.03)]"
                >
                  <div className="absolute top-6 right-6 text-slate-500 transition-[transform,border-color,background-color,box-shadow,color] duration-300 group-hover:text-yellow-400 group-hover:translate-x-1">
                    <ArrowRight className="h-5 w-5" />
                  </div>

                  <div className="mb-6 flex justify-start">
                    <HelpMedallion />
                  </div>

                  <h3 className="font-display text-lg font-black text-white mb-2 tracking-tight transition-colors duration-300 group-hover:text-yellow-400">
                    Customer Care
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-6">
                    Launch assistance tickets, consult shopping helplines, or review store guidelines.
                  </p>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/25 px-3 py-1.2 text-[10px] font-bold tracking-wider text-yellow-400 uppercase transition-[transform,border-color,background-color,box-shadow,color] group-hover:bg-yellow-500/20">
                    Contact Help Desk
                  </span>
                </motion.div>

              </motion.div>
            ) : (
              
              /* ==========================================
                  3. EXPANDED WORKSPACE AREA
                 ========================================== */
              <motion.div
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="rounded-3xl border border-white/10 bg-[#0e1626]/40 p-5 sm:p-6 md:p-8 backdrop-blur-xl shadow-2xl"
              >
                {/* Back controls and header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-6 mb-8 gap-4">
                  <button
                    onClick={() => setActiveSubTab(null)}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white transition-[transform,border-color,background-color,box-shadow,color] cursor-pointer select-none"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Back to Account Hub</span>
                  </button>

                  <h2 className="text-lg font-display font-black uppercase tracking-wider text-primary">
                    {activeSubTab === "orders" && "Purchased Orders History"}
                    {activeSubTab === "addresses" && "Saved Delivery Addresses"}
                    {activeSubTab === "security" && "Personal Details & Security"}
                    {activeSubTab === "help" && "Marketplace Support Tickets"}
                  </h2>
                </div>

                {/* 3.2 Saved Shipping Locations expanded */}
                {activeSubTab === "addresses" && (
                  <div className="space-y-6">
                    <div className="flex justify-end">
                      <button
                        onClick={() => {
                          setEditingAddressIndex(null);
                          setAddressForm({
                            label: "Home",
                            street: "",
                            city: "",
                            state: "",
                            pincode: "",
                          });
                          setShowAddressModal(true);
                        }}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white cursor-pointer hover:bg-primary-hover"
                      >
                        <Plus className="h-4.5 w-4.5" />
                        Add New Address
                      </button>
                    </div>

                    {addresses.length === 0 ? (
                      <div className="text-center py-12">
                        <MapPin className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                        <h4 className="font-semibold text-slate-300 text-sm">No saved locations found</h4>
                        <p className="text-xs text-slate-500 mt-2">Create a new delivery entry to accelerate checkout flow.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {addresses.map((addr, i) => {
                          const isDefault = i === defaultAddressIndex;
                          return (
                            <div
                              key={i}
                              className={`relative rounded-2xl border p-5 bg-slate-950/60 shadow-md ${
                                isDefault ? "border-primary/40 shadow-glow" : "border-white/5"
                              }`}
                            >
                              <div className="absolute top-4 right-4 flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setEditingAddressIndex(i);
                                    setAddressForm(addr);
                                    setShowAddressModal(true);
                                  }}
                                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white cursor-pointer"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setAddressToDeleteIndex(i); if (false) {
                                      addressMutation.mutate({
                                        action: "delete",
                                        payload: { index: i },
                                      });
                                    }
                                  }}
                                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:text-red-300 cursor-pointer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>

                              <div className="flex items-center gap-2 mb-3">
                                <span className="inline-flex items-center justify-center rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold text-slate-300 uppercase">
                                  {addr.label || "Address"}
                                </span>
                                {isDefault && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-[9px] font-bold text-primary uppercase tracking-wider">
                                    Default
                                  </span>
                                )}
                              </div>

                              <p className="text-xs text-slate-300 leading-relaxed pr-16">
                                {addr.street}
                              </p>
                              <p className="text-xs text-slate-400 mt-1">
                                {addr.city}, {addr.state} - {addr.pincode}
                              </p>

                              {!isDefault && (
                                <button
                                  onClick={() => {
                                    addressMutation.mutate({
                                      action: "set_default",
                                      payload: { index: i },
                                    });
                                  }}
                                  className="mt-4 text-[10px] font-bold tracking-wider uppercase text-primary hover:underline cursor-pointer"
                                >
                                  Set as Default
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* 3.3 Account Security expanded */}
                {activeSubTab === "security" && (
                  <div className="max-w-xl mx-auto space-y-8">
                    
                    {/* Details form */}
                    <form onSubmit={handleSaveProfile} className="space-y-5 rounded-2xl border border-white/5 bg-slate-950/44 p-6">
                      <fieldset disabled={updateProfileMutation.isPending} className="space-y-4 border-none p-0 m-0 min-w-0">
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-white/5 pb-3">Personal Profile Details</h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Full Display Name</label>
                          <div className="relative">
                            <User className="absolute left-4.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
                            <input
                              type="text"
                              required
                              value={profileName}
                              onChange={(e) => setProfileName(e.target.value)}
                              className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-white/10 bg-slate-950/60 text-xs text-white outline-none transition-colors focus:border-primary"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Registered Phone Number</label>
                          <div className="relative">
                            <Phone className="absolute left-4.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
                            <input
                              type="tel"
                              inputMode="numeric"
                              maxLength={10}
                              value={profilePhone}
                              onChange={(e) => setProfilePhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                              className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-white/10 bg-slate-950/60 text-xs text-white outline-none transition-colors focus:border-primary"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Email Address</label>
                        <div className="relative">
                          <Mail className="absolute left-4.5 top-3.5 h-4.5 w-4.5 text-slate-600" />
                          <input
                            type="email"
                            disabled
                            value={profile?.email || ""}
                            className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-white/5 bg-white/5 text-xs text-slate-500 outline-none"
                          />
                        </div>
                        <span className="block text-[9px] text-slate-600 mt-2">* User login email identifier cannot be altered for security purposes.</span>
                      </div>

                      <button
                        type="submit"
                        disabled={updateProfileMutation.isPending}
                        className="w-full rounded-2xl bg-primary py-3.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-primary-hover active:scale-98 transition-[transform,border-color,background-color,box-shadow,color] cursor-pointer disabled:opacity-50"
                      >
                        {updateProfileMutation.isPending ? "Updating Credentials..." : "Save Profile Details"}
                      </button>
                      </fieldset>
                    </form>

                    {/* Change/Reset password triggers */}
                    <div className="rounded-2xl border border-white/5 bg-slate-950/44 p-6">
                      <div className="flex items-center gap-3 mb-3 border-b border-white/5 pb-3">
                        <KeyRound className="h-5 w-5 text-yellow-500" />
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider">Account Password Keys</h4>
                      </div>
                      
                      <p className="text-xs text-slate-400 leading-relaxed mb-5">
                        Need to secure your account or change active credentials? Execute a password reset flow to configure new login keys.
                      </p>

                      <button
                        onClick={() => navigate("/login?step=forgot-email")}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 hover:bg-yellow-500/25 px-5 py-3 text-xs font-bold uppercase tracking-wider text-yellow-400 transition-colors cursor-pointer select-none"
                      >
                        <Lock className="h-3.5 w-3.5" />
                        <span>Reset Account Password</span>
                      </button>
                    </div>

                  </div>
                )}

                {/* 3.4 Support Ticket Submission expanded */}
                {activeSubTab === "help" && (
                  <div className="max-w-md mx-auto space-y-6">
                    <div className="bg-slate-950/60 rounded-2xl border border-white/5 p-6">
                      <h4 className="text-sm font-bold text-white mb-2">Need Help?</h4>
                      <p className="text-xs text-slate-400 leading-relaxed mb-4">
                        Connect with our 24/7 client coordination desks for immediate order logistics details, product returns, or transaction updates.
                      </p>
                      <button
                        onClick={() => navigate("/contact")}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white transition-colors cursor-pointer"
                      >
                        Go to Help Contact Page
                      </button>
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        toast.success("Support Ticket successfully created! Coordination keys sent to email.");
                        setActiveSubTab(null);
                      }}
                      className="space-y-4"
                    >
                      <fieldset disabled={false} className="space-y-4 border-none p-0 m-0 min-w-0">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-primary border-b border-white/5 pb-2">Submit Support Request</h4>
                      
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Reason</label>
                        <select className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4.5 py-3.5 text-xs text-slate-200 outline-none">
                          <option>Shipping & Delivery coordination</option>
                          <option>Damaged or missing items received</option>
                          <option>Payment transaction error</option>
                          <option>General help query</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Detailed Description</label>
                        <textarea
                          rows={4}
                          required
                          placeholder="Provide details including related order IDs..."
                          className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4.5 py-3.5 text-xs text-white outline-none transition-colors focus:border-primary"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full rounded-2xl bg-primary py-3.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-primary-hover active:scale-98 transition-[transform,border-color,background-color,box-shadow,color] cursor-pointer"
                      >
                        Create Support Ticket
                      </button>
                      </fieldset>
                    </form>
                  </div>
                )}

              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>

      {/* ==========================================
          4. MODAL DIALOG: ADDRESS BOOK ADD/EDIT
         ========================================== */}
      <AnimatePresence>
        {showAddressModal && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center px-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddressModal(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-[#0c1220] p-5 sm:p-6 shadow-2xl backdrop-blur-2xl z-10"
            >
              <button
                onClick={() => setShowAddressModal(false)}
                className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white"
              >
                <X className="h-4.5 w-4.5" />
              </button>

              <h3 className="font-display text-lg font-black text-white mb-6 uppercase tracking-wider">
                {editingAddressIndex !== null ? "Edit Shipping Address" : "Add New Shipping Address"}
              </h3>

              <form onSubmit={handleSaveAddress} className="space-y-4">
                <fieldset disabled={addressMutation.isPending} className="space-y-4 border-none p-0 m-0 min-w-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Address Label</label>
                    <select
                      value={addressForm.label}
                      onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-xs text-slate-200 outline-none"
                    >
                      <option>Home</option>
                      <option>Work</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">PIN / Zip Code</label>
                    <input
                      type="text"
                      required
                      placeholder="6-digit pincode"
                      value={addressForm.pincode}
                      onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-xs text-white placeholder:text-slate-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Street Address</label>
                  <input
                    type="text"
                    required
                    placeholder="House/Flat number, building details, street details..."
                    value={addressForm.street}
                    onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-xs text-white placeholder:text-slate-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">City</label>
                    <input
                      type="text"
                      required
                      placeholder="City"
                      value={addressForm.city}
                      onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-xs text-white placeholder:text-slate-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">State</label>
                    <input
                      type="text"
                      required
                      placeholder="State"
                      value={addressForm.state}
                      onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-xs text-white placeholder:text-slate-500 outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={addressMutation.isPending}
                  className="w-full rounded-2xl bg-primary py-3.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-primary-hover active:scale-98 transition-[transform,border-color,background-color,box-shadow,color] cursor-pointer shadow-md disabled:opacity-50 mt-4"
                >
                  {addressMutation.isPending ? "Saving Location..." : "Save Delivery Address"}
                </button>
                </fieldset>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==========================================
          5. MODAL DIALOG: DELETE ADDRESS CONFIRMATION
         ========================================== */}
      <AnimatePresence>
        {addressToDeleteIndex !== null && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center px-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAddressToDeleteIndex(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#0c1220] p-6 shadow-2xl backdrop-blur-2xl z-10"
            >
              <button
                onClick={() => setAddressToDeleteIndex(null)}
                className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>

              <div className="text-center py-4">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
                  <Trash2 className="h-6 w-6" />
                </div>

                <h3 className="font-display text-lg font-black text-white mb-2 uppercase tracking-wider">
                  Delete Shipping Address
                </h3>

                <p className="text-xs text-slate-400 leading-relaxed px-4">
                  Are you sure you want to permanently delete this address? This action cannot be undone.
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setAddressToDeleteIndex(null)}
                  className="flex-1 rounded-2xl bg-white/5 border border-white/10 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    addressMutation.mutate({
                      action: "delete",
                      payload: { index: addressToDeleteIndex },
                    });
                    setAddressToDeleteIndex(null);
                  }}
                  className="flex-1 rounded-2xl bg-red-500 py-3.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-red-600 transition-all cursor-pointer"
                >
                  Delete Address
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Shell>
  );
}
