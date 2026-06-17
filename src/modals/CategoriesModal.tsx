import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Pencil,
  X,
  Loader2,
  FolderOpen,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  getLocations,
  addSubcategory,
  updateSubcategory,
  deleteSubcategory,
} from "@/services/api";
import { LocationSelect } from "@/components/LocationSelect";
import { sanitizeInput } from "@/lib/validation";
import { queryKeys, QUERY_KEYS } from "@/lib/query-keys";

type Category = {
  id: number;
  name: string;
  state?: string;
  city?: string;
  town?: string;
  subcategories?: Array<{ id: number; name: string }>;
};

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

export function CategoriesModal({ onClose }: Props) {
  const queryClient = useQueryClient();

  const [newCategory, setNewCategory] = useState("");
  const [newState, setNewState] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newTown, setNewTown] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingState, setEditingState] = useState("");
  const [editingCity, setEditingCity] = useState("");
  const [editingTown, setEditingTown] = useState("");

  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  // Fetch Categories
  const { data: apiCategories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: queryKeys.categories(),
    queryFn: getCategories,
  });

  const categories = Array.isArray(apiCategories) ? apiCategories : [];

  // Fetch Locations Index
  const { data: apiLocations = [], isLoading: locationsLoading } = useQuery<LocationItem[]>({
    queryKey: queryKeys.locations(),
    queryFn: getLocations,
  });

  const locations = Array.isArray(apiLocations) ? apiLocations : [];

  // Cascading Helpers - Add Form
  const addUniqueStates = useMemo(() => {
    return Array.from(new Set(locations.map((l) => l.state))).sort();
  }, [locations]);

  const addAvailableCities = useMemo(() => {
    if (!newState) return [];
    return Array.from(
      new Set(
        locations
          .filter((l) => l.state.toLowerCase() === newState.toLowerCase())
          .map((l) => l.city)
      )
    ).sort();
  }, [locations, newState]);

  const addAvailableTowns = useMemo(() => {
    if (!newState || !newCity) return [];
    return Array.from(
      new Set(
        locations
          .filter(
            (l) =>
              l.state.toLowerCase() === newState.toLowerCase() &&
              l.city.toLowerCase() === newCity.toLowerCase()
          )
          .map((l) => l.town)
      )
    ).sort();
  }, [locations, newState, newCity]);

  // Cascading Helpers - Edit Form
  const editUniqueStates = useMemo(() => {
    return Array.from(new Set(locations.map((l) => l.state))).sort();
  }, [locations]);

  const editAvailableCities = useMemo(() => {
    if (!editingState) return [];
    return Array.from(
      new Set(
        locations
          .filter((l) => l.state.toLowerCase() === editingState.toLowerCase())
          .map((l) => l.city)
      )
    ).sort();
  }, [locations, editingState]);

  const editAvailableTowns = useMemo(() => {
    if (!editingState || !editingCity) return [];
    return Array.from(
      new Set(
        locations
          .filter(
            (l) =>
              l.state.toLowerCase() === editingState.toLowerCase() &&
              l.city.toLowerCase() === editingCity.toLowerCase()
          )
          .map((l) => l.town)
      )
    ).sort();
  }, [locations, editingState, editingCity]);

  const addMutation = useMutation({
    mutationFn: ({ name, state, city, town }: { name: string; state: string; city: string; town: string }) =>
      addCategory(name, state, city, town),
    onSuccess: (res) => {
      if (res.success) {
        toast.success("Category added successfully");
        setNewCategory("");
        setNewState("");
        setNewCity("");
        setNewTown("");
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CATEGORIES] });
      } else {
        toast.error(res.message || "Failed to add category");
      }
    },
    onError: () => {
      toast.error("Failed to add category");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name, state, city, town }: { id: number; name: string; state: string; city: string; town: string }) =>
      updateCategory(id, name, state, city, town),
    onSuccess: (res) => {
      if (res.success) {
        toast.success("Category updated successfully");
        setEditingId(null);
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CATEGORIES] });
      } else {
        toast.error(res.message || "Failed to update category");
      }
    },
    onError: () => {
      toast.error("Failed to update category");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteCategory(id),
    onSuccess: (res) => {
      if (res.success) {
        toast.success("Category deleted");
        setDeletingCategory(null);
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CATEGORIES] });
      } else {
        toast.error(res.message || "Failed to delete category");
      }
    },
    onError: () => {
      toast.error("Failed to delete category");
    },
  });

  const [expandedCategoryId, setExpandedCategoryId] = useState<number | null>(null);
  const [newSubcategoryName, setNewSubcategoryName] = useState("");
  const [editingSubcatId, setEditingSubcatId] = useState<number | null>(null);
  const [editingSubcatName, setEditingSubcatName] = useState("");

  const addSubcatMutation = useMutation({
    mutationFn: ({ categoryId, name }: { categoryId: number; name: string }) =>
      addSubcategory(categoryId, name),
    onSuccess: (res) => {
      if (res.success) {
        toast.success("Subcategory added successfully");
        setNewSubcategoryName("");
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CATEGORIES] });
      } else {
        toast.error(res.message || "Failed to add subcategory");
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to add subcategory");
    },
  });

  const updateSubcatMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      updateSubcategory(id, name),
    onSuccess: (res) => {
      if (res.success) {
        toast.success("Subcategory updated successfully");
        setEditingSubcatId(null);
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CATEGORIES] });
      } else {
        toast.error(res.message || "Failed to update subcategory");
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update subcategory");
    },
  });

  const deleteSubcatMutation = useMutation({
    mutationFn: (id: number) => deleteSubcategory(id),
    onSuccess: (res) => {
      if (res.success) {
        toast.success("Subcategory deleted successfully");
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CATEGORIES] });
      } else {
        toast.error(res.message || "Failed to delete subcategory");
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete subcategory");
    },
  });

  const isPending =
    addMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending ||
    addSubcatMutation.isPending ||
    updateSubcatMutation.isPending ||
    deleteSubcatMutation.isPending;

  function handleAdd() {
    if (!newCategory.trim()) {
      toast.error("Category name required");
      return;
    }
    const finalState = newState === "all" ? "" : newState;
    const finalCity = newCity === "all" ? "" : newCity;
    const finalTown = newTown === "all" ? "" : newTown;

    addMutation.mutate({
      name: newCategory.trim(),
      state: finalState,
      city: finalCity,
      town: finalTown,
    });
  }

  function handleUpdate(id: number) {
    if (!editingName.trim()) {
      toast.error("Category name required");
      return;
    }
    const finalState = editingState === "all" ? "" : editingState;
    const finalCity = editingCity === "all" ? "" : editingCity;
    const finalTown = editingTown === "all" ? "" : editingTown;

    updateMutation.mutate({
      id,
      name: editingName.trim(),
      state: finalState,
      city: finalCity,
      town: finalTown,
    });
  }

  function handleDelete(cat: Category) {
    setDeletingCategory(cat);
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
        <div className="absolute -top-12 -left-12 h-40 w-40 rounded-full blur-3xl opacity-15 pointer-events-none bg-primary" />
        <div className="absolute -bottom-12 -right-12 h-40 w-40 rounded-full blur-3xl opacity-15 pointer-events-none bg-cyan-500" />

        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-white/5 px-6 py-5 relative z-10">
          <div className="flex items-center gap-3">
            <LayeredIconContainer
              icon={<FolderOpen className="h-5 w-5 text-primary" />}
              glowColor="rgba(255, 102, 0, 0.4)"
            />
            <div>
              <h2 className="text-xl font-black text-white tracking-wide">Categories Directory</h2>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">
                Configure catalog tags with regional logistics scopes
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

        {/* BODY PANEL */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 scrollbar-thin relative z-10">
          
          {/* ADD FORM */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-4">
            <div className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Register Scoped Catalog Category</span>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Category Name</label>
                <input
                  value={newCategory}
                  onChange={(e) => setNewCategory(sanitizeInput(e.target.value))}
                  placeholder="e.g. Rice & Pulses"
                  className="w-full h-11 rounded-xl border border-white/10 bg-slate-950/80 px-3.5 py-2.5 text-xs text-white placeholder:text-gray-600 outline-none focus:border-primary transition-colors"
                />
              </div>

              <LocationSelect
                label="State Scope"
                value={newState}
                onValueChange={(val) => {
                  setNewState(val);
                  setNewCity("");
                  setNewTown("");
                }}
                options={addUniqueStates}
                placeholder="Global (All Regions)"
                showOther={false}
                allOptionLabel="Global (All Regions)"
              />

              <LocationSelect
                label="City Scope"
                value={newCity}
                onValueChange={(val) => {
                  setNewCity(val);
                  setNewTown("");
                }}
                options={addAvailableCities}
                placeholder="Global (All Regions)"
                disabled={!newState || newState === "all"}
                showOther={false}
                allOptionLabel="Global (All Regions)"
              />

              <LocationSelect
                label="Town / Area Scope"
                value={newTown}
                onValueChange={(val) => setNewTown(val)}
                options={addAvailableTowns}
                placeholder="Global (All Regions)"
                disabled={!newCity || newCity === "all"}
                showOther={false}
                allOptionLabel="Global (All Regions)"
              />
            </div>

            <button
              onClick={handleAdd}
              disabled={isPending || locationsLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-hover py-3 text-xs font-extrabold uppercase tracking-wider text-white transition hover:opacity-90 active:scale-98 disabled:opacity-50 cursor-pointer shadow-lg shadow-primary/15"
            >
              {addMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Add Category Directory Link
            </button>
          </div>

          {/* LIST */}
          <div className="space-y-3.5">
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1 border-b border-white/5 pb-2">
              Registered Categories Catalog
            </div>

            {categoriesLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-500">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-xs font-semibold">Indexing active categories...</span>
              </div>
            ) : categories.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-white/5 rounded-2xl bg-white/[0.01] text-gray-500 text-xs font-semibold">
                No categories configured. Insert a category above.
              </div>
            ) : (
              categories.map((cat) => {
                const isExpanded = expandedCategoryId === cat.id;
                return (
                  <div
                    key={cat.id}
                    className="rounded-2xl border border-white/5 bg-gradient-to-b from-[#0e1424]/40 to-[#070b12]/60 hover:border-white/10 transition-all duration-300 overflow-hidden"
                  >
                    <div className="flex items-center justify-between p-4 border-b border-white/5">
                      {editingId === cat.id ? (
                        <div className="grid gap-3 grid-cols-1 sm:grid-cols-4 flex-1 mr-4 items-end animate-fadeIn">
                          <div className="flex flex-col gap-1.5 w-full">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Name</label>
                            <input
                              value={editingName}
                              onChange={(e) => setEditingName(sanitizeInput(e.target.value))}
                              placeholder="Category Name"
                              className="w-full h-11 rounded-xl border border-white/10 bg-slate-950/80 px-3 py-1.5 text-xs text-white outline-none focus:border-primary"
                            />
                          </div>
                          
                          <LocationSelect
                            label="State Scope"
                            value={editingState}
                            onValueChange={(val) => {
                              setEditingState(val);
                              setEditingCity("");
                              setEditingTown("");
                            }}
                            options={editUniqueStates}
                            placeholder="Global"
                            showOther={false}
                            allOptionLabel="Global"
                          />

                          <LocationSelect
                            label="City Scope"
                            value={editingCity}
                            onValueChange={(val) => {
                              setEditingCity(val);
                              setEditingTown("");
                            }}
                            options={editAvailableCities}
                            placeholder="Global"
                            disabled={!editingState || editingState === "all"}
                            showOther={false}
                            allOptionLabel="Global"
                          />

                          <LocationSelect
                            label="Town Scope"
                            value={editingTown}
                            onValueChange={(val) => setEditingTown(val)}
                            options={editAvailableTowns}
                            placeholder="Global"
                            disabled={!editingCity || editingCity === "all"}
                            showOther={false}
                            allOptionLabel="Global"
                          />
                        </div>
                      ) : (
                        <div 
                          className="flex flex-col gap-1.5 flex-1 cursor-pointer select-none"
                          onClick={() => setExpandedCategoryId(isExpanded ? null : cat.id)}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-extrabold text-white tracking-wide">
                              {cat.name}
                            </span>
                            {cat.subcategories && cat.subcategories.length > 0 && (
                              <span className="rounded-full bg-cyan-500/10 border border-cyan-500/25 px-2 py-0.5 text-[9px] font-black text-cyan-400">
                                {cat.subcategories.length} subcategories
                              </span>
                            )}
                          </div>
                          {(cat.state || cat.city || cat.town) ? (
                            <span className="text-[10px] font-semibold text-gray-400 flex items-center gap-1.5 flex-wrap">
                              <span className="inline-flex items-center rounded bg-primary/10 border border-primary/20 px-1.5 py-0.5 text-[8.5px] font-black text-primary uppercase tracking-wider">Scope</span>
                              <span className="text-white font-bold">{cat.state}</span>
                              <span>→</span>
                              <span className="text-gray-300">{cat.city}</span>
                              {cat.town && (
                                <>
                                  <span>→</span>
                                  <span className="text-cyan-400 font-extrabold">{cat.town}</span>
                                </>
                              )}
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 inline-flex items-center gap-1">
                              🌐 Scope: Global (All Regions)
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex gap-2 shrink-0 ml-4 items-center">
                        {editingId === cat.id ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdate(cat.id)}
                              className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-white transition hover:from-emerald-500 cursor-pointer"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-gray-400 hover:bg-white/10 cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => setExpandedCategoryId(isExpanded ? null : cat.id)}
                              className="rounded-xl bg-white/5 border border-white/10 p-2 text-gray-400 hover:text-white transition-all cursor-pointer"
                            >
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>
                            <button
                              onClick={() => {
                                setEditingId(cat.id);
                                setEditingName(cat.name);
                                setEditingState(cat.state || "");
                                setEditingCity(cat.city || "");
                                setEditingTown(cat.town || "");
                              }}
                              className="rounded-xl bg-cyan-500/10 p-2.5 text-cyan-400 hover:bg-cyan-500/20 active:scale-95 transition-all cursor-pointer"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => handleDelete(cat)}
                          className="rounded-xl bg-red-500/10 p-2.5 text-red-400 hover:bg-red-500/20 active:scale-95 transition-all cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-5 bg-black/40 border-t border-white/5 space-y-4 animate-slideDown">
                        <div className="text-[10px] font-black uppercase tracking-wider text-cyan-400">
                          Nested Subcategories
                        </div>
                        {(!cat.subcategories || cat.subcategories.length === 0) ? (
                          <div className="text-[11px] text-gray-500 font-medium italic">
                            No subcategories registered for this category yet.
                          </div>
                        ) : (
                          <div className="grid gap-2 sm:grid-cols-2">
                            {cat.subcategories.map((sub) => (
                              <div
                                key={sub.id}
                                className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.01] px-3.5 py-2"
                              >
                                {editingSubcatId === sub.id ? (
                                  <div className="flex items-center gap-2 flex-1 mr-2">
                                    <input
                                      value={editingSubcatName}
                                      onChange={(e) => setEditingSubcatName(sanitizeInput(e.target.value))}
                                      className="flex-1 h-8 rounded-lg border border-white/10 bg-slate-950 px-2.5 text-xs text-white outline-none focus:border-cyan-400"
                                      autoFocus
                                    />
                                    <button
                                      onClick={() => {
                                        if (editingSubcatName.trim()) {
                                          updateSubcatMutation.mutate({ id: sub.id, name: editingSubcatName.trim() });
                                        }
                                      }}
                                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[10px] font-bold text-white uppercase"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => setEditingSubcatId(null)}
                                      className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-[10px] font-bold text-gray-400"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <span className="text-xs font-bold text-gray-200">
                                      {sub.name}
                                    </span>
                                    <div className="flex gap-1.5">
                                      <button
                                        onClick={() => {
                                          setEditingSubcatId(sub.id);
                                          setEditingSubcatName(sub.name);
                                        }}
                                        className="text-gray-400 hover:text-cyan-400 p-1"
                                      >
                                        <Pencil className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          if (confirm(`Delete subcategory "${sub.name}"?`)) {
                                            deleteSubcatMutation.mutate(sub.id);
                                          }
                                        }}
                                        className="text-gray-400 hover:text-red-400 p-1"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex gap-2 pt-2 border-t border-white/5 items-center">
                          <input
                            value={newSubcategoryName}
                            onChange={(e) => setNewSubcategoryName(sanitizeInput(e.target.value))}
                            placeholder="Add new subcategory (e.g. Mobiles)"
                            className="flex-1 h-9 rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white placeholder:text-gray-600 outline-none focus:border-cyan-400"
                          />
                          <button
                            onClick={() => {
                              if (!newSubcategoryName.trim()) {
                                toast.error("Subcategory name is required");
                                return;
                              }
                              addSubcatMutation.mutate({ categoryId: cat.id, name: newSubcategoryName.trim() });
                            }}
                            disabled={addSubcatMutation.isPending}
                            className="h-9 rounded-xl bg-cyan-500 hover:bg-cyan-400 px-4 text-xs font-extrabold uppercase tracking-wider text-slate-950 transition active:scale-95 disabled:opacity-50"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </motion.div>

      {/* DELETE CONFIRM OVERLAY */}
      <AnimatePresence>
        {deletingCategory && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
              onClick={() => setDeletingCategory(null)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md rounded-[32px] border border-red-500/20 bg-gradient-to-b from-[#0a0f1d] to-[#05070a] p-8 text-center shadow-[0_30px_70px_rgba(0,0,0,0.8)] overflow-hidden"
            >
              <div className="absolute -top-12 -left-12 h-32 w-32 rounded-full blur-2xl opacity-10 bg-red-500 pointer-events-none" />

              <button
                onClick={() => setDeletingCategory(null)}
                className="absolute right-6 top-6 flex h-8 w-8 items-center justify-center rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20">
                <Trash2 className="h-8 w-8 text-red-500 animate-pulse" />
              </div>

              <h2 className="text-2xl font-black text-white tracking-wide">Delete Category</h2>
              <p className="mt-3 text-xs text-gray-400 leading-relaxed max-w-xs mx-auto">
                Are you sure you want to delete:<br />
                <span className="font-extrabold text-white text-base block my-1.5">{deletingCategory.name}</span>
                This action is permanent and removes the category scopes immediately from shop displays.
              </p>

              <div className="mt-8 flex gap-3.5">
                <button
                  onClick={() => setDeletingCategory(null)}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-xs font-extrabold uppercase tracking-wider text-white transition hover:bg-white/10 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    deleteMutation.mutate(deletingCategory.id);
                  }}
                  disabled={deleteMutation.isPending}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 py-3 text-xs font-extrabold uppercase tracking-wider text-white transition hover:opacity-90 disabled:opacity-60 cursor-pointer"
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