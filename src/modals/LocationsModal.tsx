import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

type LocationItem = {
  id: number;
  state: string;
  city: string;
  town: string;
};

interface Props {
  onClose: () => void;
}

export function LocationsModal({ onClose }: Props) {
  const queryClient = useQueryClient();

  // State Management Modes
  const [isNewState, setIsNewState] = useState(false);
  const [selectedState, setSelectedState] = useState("");
  const [customState, setCustomState] = useState("");

  // City Management Modes
  const [isNewCity, setIsNewCity] = useState(false);
  const [selectedCity, setSelectedCity] = useState("");
  const [customCity, setCustomCity] = useState("");

  // Town Management (always text input)
  const [townInput, setTownInput] = useState("");

  const [deletingLoc, setDeletingLoc] = useState<LocationItem | null>(null);

  // Fetch Locations
  const { data: apiLocations = [], isLoading } = useQuery<LocationItem[]>({
    queryKey: ["locations"],
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
        queryClient.invalidateQueries({ queryKey: ["locations"] });
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
        queryClient.invalidateQueries({ queryKey: ["locations"] });
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

    // CASE-INSENSITIVE DUPLICATE LINK CHECK
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl rounded-3xl border border-white/10 bg-[#0f172a] p-6 max-h-[90vh] flex flex-col shadow-2xl relative animate-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="mb-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF6600]/10 text-[#FF6600]">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Locations Hub Directory</h2>
              <p className="text-xs text-gray-400">Configure State → City → Town hierarchy with strict duplicate safeguards</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* DYNAMIC HIERARCHICAL BUILDER */}
        <div className="mb-6 rounded-2xl border border-white/5 bg-white/[0.02] p-4 space-y-4 shrink-0">
          <div className="text-xs font-bold uppercase tracking-widest text-[#FF6600] flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Interactive Location Hierarchy Builder</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {/* STEP 1: STATE SELECTION */}
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
                  className="text-[9px] font-bold text-[#FF6600] hover:underline cursor-pointer"
                >
                  {isNewState ? "Select Existing" : "Create New State"}
                </button>
              </div>

              {isNewState ? (
                <input
                  value={customState}
                  onChange={(e) => setCustomState(e.target.value)}
                  placeholder="Type new state name..."
                  className="w-full h-11 rounded-xl border border-white/10 bg-[#090d1a]/60 backdrop-blur-md px-3 py-2.5 text-sm text-white placeholder:text-gray-500 shadow-lg outline-none focus:border-[#FF6600] focus:ring-1 focus:ring-[#FF6600] transition-all duration-200"
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

            {/* STEP 2: CITY SELECTION */}
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
                    className="text-[9px] font-bold text-[#FF6600] hover:underline cursor-pointer"
                  >
                    {isNewCity ? "Select Existing" : "Create New City"}
                  </button>
                )}
              </div>

              {isNewCity || availableCities.length === 0 ? (
                <input
                  value={customCity}
                  onChange={(e) => setCustomCity(e.target.value)}
                  disabled={!activeState}
                  placeholder={activeState ? "Type new city name..." : "Select state first"}
                  className="w-full h-11 rounded-xl border border-white/10 bg-[#090d1a]/60 backdrop-blur-md px-3 py-2.5 text-sm text-white placeholder:text-gray-500 shadow-lg outline-none focus:border-[#FF6600] focus:ring-1 focus:ring-[#FF6600] transition-all duration-200 disabled:opacity-40"
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

            {/* STEP 3: TOWN SELECTION */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Town / Area</label>
              <input
                value={townInput}
                onChange={(e) => setTownInput(e.target.value)}
                disabled={!activeState || !activeCity}
                placeholder={activeState && activeCity ? "Type Town/Area..." : "Complete hierarchy first"}
                className="w-full h-11 rounded-xl border border-white/10 bg-[#090d1a]/60 backdrop-blur-md px-3 py-2.5 text-sm text-white placeholder:text-gray-500 shadow-lg outline-none focus:border-[#FF6600] focus:ring-1 focus:ring-[#FF6600] transition-all duration-200 disabled:opacity-40"
              />
            </div>
          </div>

          <button
            onClick={handleAdd}
            disabled={isPending || !activeState || !activeCity || !townInput.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF6600] py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#e65c00] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {addMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            <span>Register Location Link</span>
          </button>
        </div>

        {/* LIST */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 scrollbar-thin">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#FF6600]" />
            </div>
          ) : locations.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-500">
              No locations registered. Add a location link above to start.
            </p>
          ) : (
            <div className="space-y-2">
              <div className="px-4 py-1.5 grid grid-cols-3 text-[10px] font-black uppercase tracking-widest text-gray-500 border-b border-white/5">
                <span>State</span>
                <span>City</span>
                <span>Town</span>
              </div>
              
              {locations.map((loc) => (
                <div
                  key={loc.id}
                  className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 hover:bg-white/[0.08] p-3.5 transition-all animate-in fade-in"
                >
                  <div className="grid grid-cols-3 flex-1 text-sm font-medium text-white mr-4">
                    <span className="text-gray-300 font-semibold">{loc.state}</span>
                    <span className="text-gray-400">{loc.city}</span>
                    <span className="text-[#FF6600] font-bold">{loc.town}</span>
                  </div>

                  <button
                    onClick={() => setDeletingLoc(loc)}
                    className="rounded-lg bg-red-500/10 p-2 text-red-400 transition hover:bg-red-500 hover:text-white cursor-pointer shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SLA COMPLIANT DELETE CONFIRMATION */}
      {deletingLoc && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-[32px] border border-red-500/20 bg-[#050816] p-6 text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
              <Trash2 className="h-7 w-7 text-red-500 animate-bounce" />
            </div>

            <h3 className="text-xl font-bold text-white">Delete Location?</h3>
            <p className="mt-2 text-xs text-gray-400 leading-relaxed">
              Are you sure you want to remove the link:<br />
              <span className="font-bold text-white">{deletingLoc.state} → {deletingLoc.city} → {deletingLoc.town}</span>?<br />
              This removes it from registration and category choice lists.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setDeletingLoc(null)}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-bold text-white transition hover:bg-white/10 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteMutation.mutate(deletingLoc.id);
                }}
                disabled={deleteMutation.isPending}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 py-2.5 text-xs font-bold text-white transition hover:bg-red-600 disabled:opacity-60 cursor-pointer"
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
