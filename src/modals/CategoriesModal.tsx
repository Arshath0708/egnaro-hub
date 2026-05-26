import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Pencil,
  X,
  Loader2,
  FolderOpen,
} from "lucide-react";
import {
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  getLocations,
} from "@/services/api";
import { LocationSelect } from "@/components/LocationSelect";

type Category = {
  id: number;
  name: string;
  state?: string;
  city?: string;
  town?: string;
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

export function CategoriesModal({
  onClose,
}: Props) {
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
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const categories = Array.isArray(apiCategories) ? apiCategories : [];

  // Fetch Locations Index
  const { data: apiLocations = [], isLoading: locationsLoading } = useQuery<LocationItem[]>({
    queryKey: ["locations"],
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
        queryClient.invalidateQueries({ queryKey: ["categories"] });
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
        queryClient.invalidateQueries({ queryKey: ["categories"] });
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
        queryClient.invalidateQueries({ queryKey: ["categories"] });
      } else {
        toast.error(res.message || "Failed to delete category");
      }
    },
    onError: () => {
      toast.error("Failed to delete category");
    },
  });

  const isPending = addMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  function handleAdd() {
    if (!newCategory.trim()) {
      toast.error("Category name required");
      return;
    }
    // Location is 100% OPTIONAL now. If 'all' or empty, we send empty string representing global.
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl rounded-3xl border border-white/10 bg-[#0f172a] p-6 max-h-[90vh] flex flex-col shadow-2xl relative animate-in zoom-in-95 duration-200">

        {/* HEADER */}
        <div className="mb-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF6600]/10 text-[#FF6600]">
              <FolderOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Categories Directory</h2>
              <p className="text-xs text-gray-400">Configure catalog categories with normalized regional hubs</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ADD FORM */}
        <div className="mb-6 rounded-2xl border border-white/5 bg-white/[0.02] p-4 space-y-4 shrink-0">
          <div className="text-xs font-bold uppercase tracking-widest text-[#FF6600]">
            Add New Normalized Category
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Category Name</label>
              <input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="e.g. Rice & Pulses"
                className="w-full h-11 rounded-xl border border-white/10 bg-[#090d1a]/60 px-3 py-2.5 text-sm text-white placeholder:text-gray-500 shadow-lg outline-none focus:border-[#FF6600] focus:ring-1 focus:ring-[#FF6600] transition-all duration-200"
              />
            </div>

            <LocationSelect
              label="State"
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
              label="City"
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
              label="Town / Area"
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
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF6600] py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#e65c00] active:scale-[0.98] disabled:opacity-50 cursor-pointer animate-duration-150"
          >
            {addMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            <span>Add Normalized Category</span>
          </button>
        </div>

        {/* LIST */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 scrollbar-thin">
          {categoriesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#FF6600]" />
            </div>
          ) : categories.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-500">
              No categories configured. Add a category above to start.
            </p>
          ) : (
            categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 hover:bg-white/[0.08] p-4 transition-all"
              >
                {editingId === cat.id ? (
                  <div className="grid gap-2 grid-cols-1 sm:grid-cols-4 flex-1 mr-4 items-end">
                    <div className="flex flex-col gap-1.5 w-full">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Name</label>
                      <input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        placeholder="Category Name"
                        className="w-full h-11 rounded-xl border border-white/10 bg-[#090d1a]/60 px-3 py-1.5 text-xs text-white outline-none focus:border-[#FF6600] focus:ring-1 focus:ring-[#FF6600] transition-all duration-200"
                      />
                    </div>
                    
                    <LocationSelect
                      label="State"
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
                      label="City"
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
                      label="Town"
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
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-bold text-white">
                      {cat.name}
                    </span>
                    {(cat.state || cat.city || cat.town) && (
                      <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                        <span>Regional Scope:</span>
                        <span className="text-white">{cat.state}</span>
                        <span>→</span>
                        <span className="text-white">{cat.city}</span>
                        {cat.town && (
                          <>
                            <span>→</span>
                            <span className="text-[#FF6600] font-black">{cat.town}</span>
                          </>
                        )}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex gap-2 shrink-0 ml-4">
                  {editingId === cat.id ? (
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleUpdate(cat.id)}
                        className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-green-700 cursor-pointer"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="rounded-lg bg-white/5 px-3 py-1.5 text-xs font-bold text-gray-400 transition hover:bg-white/10 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingId(cat.id);
                        setEditingName(cat.name);
                        setEditingState(cat.state || "");
                        setEditingCity(cat.city || "");
                        setEditingTown(cat.town || "");
                      }}
                      className="rounded-lg bg-cyan-600/10 p-2 text-cyan-400 transition hover:bg-cyan-600 hover:text-white cursor-pointer"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(cat)}
                    className="rounded-lg bg-red-600/10 p-2 text-red-400 transition hover:bg-red-600 hover:text-white cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* SLA COMPLIANT DELETE OVERLAY */}
      {deletingCategory && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-[36px] border border-red-500/20 bg-[#050816] p-8 text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setDeletingCategory(null)}
              className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white transition hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10">
              <Trash2 className="h-10 w-10 text-red-500 animate-bounce" />
            </div>

            <h2 className="text-3xl font-black text-white">Delete Category</h2>
            <p className="mt-3 text-sm text-gray-400 leading-relaxed">
              Are you sure you want to delete the category:<br />
              <span className="font-bold text-white text-lg">{deletingCategory.name}</span>?<br />
              This will remove it from shop displays. This action is permanent.
            </p>

            <div className="mt-8 flex gap-4">
              <button
                onClick={() => setDeletingCategory(null)}
                className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-3 text-sm font-bold text-white transition hover:bg-white/10 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteMutation.mutate(deletingCategory.id);
                }}
                disabled={deleteMutation.isPending}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-red-500 py-3 text-sm font-bold text-white transition hover:bg-red-600 disabled:opacity-60 cursor-pointer"
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Trash2 className="h-5 w-5" />
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