import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  X,
  Loader2,
  MapPin,
  Sparkles,
} from "lucide-react";
import {
  getLocations,
  addLocation,
  deleteLocation,
} from "@/services/api";
import { LocationSelect } from "@/components/LocationSelect";
import { queryKeys, QUERY_KEYS } from "@/lib/query-keys";
import { sanitizeInput } from "@/lib/validation";

type LocationItem = {
  id: number;
  state: string;
  city: string;
  town: string;
};

interface Props {
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

export function LocationsModal({ onClose }: Props) {
  const queryClient = useQueryClient();

  const [isNewState, setIsNewState] = useState(false);
  const [selectedState, setSelectedState] = useState("");
  const [customState, setCustomState] = useState("");

  const [isNewCity, setIsNewCity] = useState(false);
  const [selectedCity, setSelectedCity] = useState("");
  const [customCity, setCustomCity] = useState("");

  const [townInput, setTownInput] = useState("");

  const [deletingLoc, setDeletingLoc] = useState<LocationItem | null>(null);

  // Fetch Locations
  const { data: apiLocations = [], isLoading } = useQuery<LocationItem[]>({
    queryKey: queryKeys.locations(),
    queryFn: getLocations,
  });

  const locations = Array.isArray(apiLocations) ? apiLocations : [];

  // Cascading Derivations
  const uniqueStates = useMemo(() => {
    return Array.from(new Set(locations.map((l) => l.state))).sort();
  }, [locations]);

  const activeState = isNewState ? customState.trim() : selectedState;

  const availableCities = useMemo(() => {
    if (!activeState) return [];
    return Array.from(
      new Set(
        locations
          .filter((l) => l.state.toLowerCase() === activeState.toLowerCase())
          .map((l) => l.city)
      )
    ).sort();
  }, [locations, activeState]);

  const activeCity = isNewCity || availableCities.length === 0 ? customCity.trim() : selectedCity;

  const addMutation = useMutation({
    mutationFn: ({ state, city, town }: { state: string; city: string; town: string }) =>
      addLocation(state, city, town),
    onSuccess: (res) => {
      if (res.success) {
        toast.success("Location link added successfully");
        setTownInput(""); // Clear town for easy batch additions
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LOCATIONS] });
      } else {
        toast.error(res.message || "Failed to add location link");
      }
    },
    onError: () => {
      toast.error("Server error adding location");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteLocation(id),
    onSuccess: (res) => {
      if (res.success) {
        toast.success("Location link removed");
        setDeletingLoc(null);
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LOCATIONS] });
      } else {
        toast.error(res.message || "Failed to delete");
      }
    },
    onError: () => {
      toast.error("Failed to delete location link");
    },
  });

  const isPending = addMutation.isPending || deleteMutation.isPending;

  function handleAdd() {
    const finalState = activeState;
    const finalCity = activeCity;
    const finalTown = townInput.trim();

    if (!finalState) {
      toast.error("Please select or enter a State");
      return;
    }
    if (!finalCity) {
      toast.error("Please select or enter a City");
      return;
    }
    if (!finalTown) {
      toast.error("Please enter a Town / Area");
      return;
    }

    const isDuplicate = locations.some(
      (loc) =>
        loc.state.trim().toLowerCase() === finalState.trim().toLowerCase() &&
        loc.city.trim().toLowerCase() === finalCity.trim().toLowerCase() &&
        loc.town.trim().toLowerCase() === finalTown.trim().toLowerCase()
    );

    if (isDuplicate) {
      toast.error("Duplicate Location Link! This combination already exists.");
      return;
    }

    addMutation.mutate({
      state: finalState,
      city: finalCity,
      town: finalTown,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className="relative z-10 w-full max-w-3xl max-h-[90vh] flex flex-col rounded-[32px] border border-white/5 bg-gradient-to-b from-[#0a0f1d] to-[#05070a] shadow-[0_30px_70px_rgba(0,0,0,0.8)] overflow-hidden"
      >
        {/* Glow orbs */}
        <div className="absolute -top-12 -left-12 h-40 w-40 rounded-full blur-3xl opacity-15 pointer-events-none bg-amber-500" />
        <div className="absolute -bottom-12 -right-12 h-40 w-40 rounded-full blur-3xl opacity-15 pointer-events-none bg-cyan-500" />

        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-white/5 px-6 py-5 relative z-10">
          <div className="flex items-center gap-3">
            <LayeredIconContainer
              icon={<MapPin className="h-5 w-5 text-amber-400" />}
              glowColor="rgba(245, 158, 11, 0.4)"
            />
            <div>
              <h2 className="text-xl font-black text-white tracking-wide">Locations Hub Directory</h2>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">
                Configure regional State → City → Town cascades with duplicate locks
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all hover:bg-white/10 active:scale-90 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 scrollbar-thin relative z-10">
          
          {/* BUILDER FORM */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-4">
            <div className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>Hierarchical Scope Builder</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {/* STATE */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">State</label>
                  <button
                    onClick={() => {
                      setIsNewState(!isNewState);
                      setSelectedState("");
                      setCustomState("");
                      setSelectedCity("");
                      setCustomCity("");
                    }}
                    className="text-[9px] font-black uppercase tracking-wider text-amber-500 hover:underline cursor-pointer"
                  >
                    {isNewState ? "Existing" : "New"}
                  </button>
                </div>
                {isNewState ? (
                  <input
                    value={customState}
                    onChange={(e) => setCustomState(sanitizeInput(e.target.value))}
                    placeholder="Type new state..."
                    className="w-full h-11 rounded-xl border border-white/10 bg-slate-950/80 px-3.5 py-2.5 text-xs text-white placeholder:text-gray-600 outline-none focus:border-primary"
                  />
                ) : (
                  <LocationSelect
                    label=""
                    value={selectedState}
                    onValueChange={(val) => {
                      setSelectedState(val);
                      setSelectedCity("");
                      setCustomCity("");
                    }}
                    options={uniqueStates}
                    placeholder="Choose State..."
                    showOther={false}
                  />
                )}
              </div>

              {/* CITY */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">City</label>
                  {activeState && availableCities.length > 0 && (
                    <button
                      onClick={() => {
                        setIsNewCity(!isNewCity);
                        setSelectedCity("");
                        setCustomCity("");
                      }}
                      className="text-[9px] font-black uppercase tracking-wider text-amber-500 hover:underline cursor-pointer"
                    >
                      {isNewCity ? "Existing" : "New"}
                    </button>
                  )}
                </div>
                {isNewCity || availableCities.length === 0 ? (
                  <input
                    value={customCity}
                    onChange={(e) => setCustomCity(sanitizeInput(e.target.value))}
                    disabled={!activeState}
                    placeholder={activeState ? "Type new city..." : "Select state first"}
                    className="w-full h-11 rounded-xl border border-white/10 bg-slate-950/80 px-3.5 py-2.5 text-xs text-white placeholder:text-gray-600 outline-none focus:border-primary disabled:opacity-40 disabled:pointer-events-none"
                  />
                ) : (
                  <LocationSelect
                    label=""
                    value={selectedCity}
                    onValueChange={(val) => setSelectedCity(val)}
                    options={availableCities}
                    placeholder="Choose City..."
                    disabled={!activeState}
                    showOther={false}
                  />
                )}
              </div>

              {/* TOWN */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Town / Area</label>
                <input
                  value={townInput}
                  onChange={(e) => setTownInput(sanitizeInput(e.target.value))}
                  disabled={!activeState || !activeCity}
                  placeholder={activeState && activeCity ? "Type Town/Area..." : "Complete scope first"}
                  className="w-full h-11 rounded-xl border border-white/10 bg-slate-950/80 px-3.5 py-2.5 text-xs text-white placeholder:text-gray-600 outline-none focus:border-primary disabled:opacity-40 disabled:pointer-events-none"
                />
              </div>
            </div>

            <button
              onClick={handleAdd}
              disabled={isPending || !activeState || !activeCity || !townInput.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 py-3 text-xs font-extrabold uppercase tracking-wider text-white transition hover:opacity-90 active:scale-98 disabled:opacity-50 cursor-pointer shadow-lg shadow-amber-950/20"
            >
              {addMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Register Location Scope
            </button>
          </div>

          {/* LIST */}
          <div className="space-y-3">
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1 border-b border-white/5 pb-2">
              Registered Locations Directory
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-500">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-xs font-semibold">Indexing active scopes...</span>
              </div>
            ) : locations.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-white/5 rounded-2xl bg-white/[0.01] text-gray-500 text-xs font-semibold">
                No location links configured. Add locations above.
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                <div className="px-4 py-2 grid grid-cols-3 text-[9px] font-black uppercase tracking-widest text-gray-500 border-b border-white/5 bg-white/[0.01]">
                  <span>State Scope</span>
                  <span>City Scope</span>
                  <span>Town Scope</span>
                </div>
                
                {locations.map((loc) => (
                  <div
                    key={loc.id}
                    className="grid grid-cols-3 items-center rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent hover:border-white/10 p-3.5 transition-all duration-300 relative group animate-in fade-in"
                  >
                    <span className="text-xs font-bold text-gray-300 truncate">{loc.state}</span>
                    <span className="text-xs font-semibold text-gray-400 truncate">{loc.city}</span>
                    <span className="text-xs font-extrabold text-primary truncate flex items-center justify-between">
                      {loc.town}
                      <button
                        onClick={() => setDeletingLoc(loc)}
                        className="rounded-lg bg-red-500/10 p-2 text-red-400 hover:bg-red-500 hover:text-white transition-colors cursor-pointer shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* DELETE CONFIRM OVERLAY */}
      <AnimatePresence>
        {deletingLoc && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
              onClick={() => setDeletingLoc(null)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-sm rounded-[32px] border border-red-500/20 bg-gradient-to-b from-[#0a0f1d] to-[#05070a] p-6 text-center shadow-[0_30px_70px_rgba(0,0,0,0.8)] overflow-hidden animate-in zoom-in-95 duration-200"
            >
              <div className="absolute -top-12 -left-12 h-32 w-32 rounded-full blur-2xl opacity-10 bg-red-500 pointer-events-none" />

              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20">
                <Trash2 className="h-7 w-7 text-red-500 animate-pulse" />
              </div>

              <h3 className="text-lg font-black text-white tracking-wide">Delete Location Scope?</h3>
              <p className="mt-2 text-xs text-gray-400 leading-relaxed max-w-xs mx-auto">
                Are you sure you want to remove the link:<br />
                <span className="font-extrabold text-white block my-1">{deletingLoc.state} → {deletingLoc.city} → {deletingLoc.town}</span>
                This removes it immediately from registration directories.
              </p>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setDeletingLoc(null)}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white transition hover:bg-white/10 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    deleteMutation.mutate(deletingLoc.id);
                  }}
                  disabled={deleteMutation.isPending}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white transition hover:opacity-90 disabled:opacity-60 cursor-pointer"
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
