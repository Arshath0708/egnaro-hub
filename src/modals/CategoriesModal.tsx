import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Pencil,
  X,
  Loader2,
} from "lucide-react";
import {
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
} from "@/services/api";

type Category = {
  id: number;
  name: string;
  state?: string;
  city?: string;
};

interface Props {
  onClose: () => void;
}

export function CategoriesModal({
  onClose,
}: Props) {
  const queryClient = useQueryClient();

  const [newCategory, setNewCategory] =
    useState("");
  const [newState, setNewState] =
    useState("");
  const [newCity, setNewCity] =
    useState("");

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [editingName, setEditingName] =
    useState("");
  const [editingState, setEditingState] =
    useState("");
  const [editingCity, setEditingCity] =
    useState("");

  const [deletingCategory, setDeletingCategory] =
    useState<Category | null>(null);

  const { data: apiCategories = [], isLoading } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const categories = Array.isArray(apiCategories) ? apiCategories : [];

  const addMutation = useMutation({
    mutationFn: ({ name, state, city }: { name: string; state: string; city: string }) =>
      addCategory(name, state, city),
    onSuccess: (res) => {
      if (res.success) {
        toast.success("Category added");
        setNewCategory("");
        setNewState("");
        setNewCity("");
        queryClient.invalidateQueries({ queryKey: ["categories"] });
      } else {
        toast.error(res.message || "Failed");
      }
    },
    onError: () => {
      toast.error("Failed to add category");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name, state, city }: { id: number; name: string; state: string; city: string }) =>
      updateCategory(id, name, state, city),
    onSuccess: (res) => {
      if (res.success) {
        toast.success("Category updated successfully");
        setEditingId(null);
        queryClient.invalidateQueries({ queryKey: ["categories"] });
      } else {
        toast.error(res.message || "Failed");
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
        toast.success("Deleted");
        setDeletingCategory(null);
        queryClient.invalidateQueries({ queryKey: ["categories"] });
      } else {
        toast.error(res.message || "Failed");
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
    if (!newState.trim()) {
      toast.error("State required");
      return;
    }
    if (!newCity.trim()) {
      toast.error("City required");
      return;
    }
    addMutation.mutate({ name: newCategory, state: newState, city: newCity });
  }

  function handleUpdate(id: number) {
    if (!editingName.trim()) {
      toast.error("Category name required");
      return;
    }
    if (!editingState.trim()) {
      toast.error("State required");
      return;
    }
    if (!editingCity.trim()) {
      toast.error("City required");
      return;
    }
    updateMutation.mutate({ id, name: editingName, state: editingState, city: editingCity });
  }

  function handleDelete(cat: Category) {
    setDeletingCategory(cat);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[#0f172a] p-6 max-h-[90vh] flex flex-col">

        {/* HEADER */}

        <div className="mb-6 flex items-center justify-between shrink-0">
          <h2 className="text-2xl font-bold text-white">
            Categories
          </h2>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X />
          </button>
        </div>

        {/* ADD FORM */}

        <div className="mb-6 rounded-2xl border border-white/5 bg-white/[0.02] p-4 space-y-4 shrink-0">
          <div className="text-xs font-bold uppercase tracking-widest text-[#FF6600]">
            Add New Category
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Category Name"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-gray-400 outline-none transition-all focus:border-[#FF6600]"
            />
            <input
              value={newState}
              onChange={(e) => setNewState(e.target.value)}
              placeholder="State (e.g. Tamil Nadu)"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-gray-400 outline-none transition-all focus:border-[#FF6600]"
            />
            <input
              value={newCity}
              onChange={(e) => setNewCity(e.target.value)}
              placeholder="City (e.g. Chennai)"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-gray-400 outline-none transition-all focus:border-[#FF6600]"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={isPending}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF6600] py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#e65c00] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {addMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            <span>Add Category</span>
          </button>
        </div>

        {/* LIST */}

        <div className="flex-1 overflow-y-auto pr-1 space-y-3 scrollbar-thin">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-[#FF6600]" />
            </div>
          ) : categories.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              No categories found
            </p>
          ) : (
            categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                {editingId === cat.id ? (
                  <div className="grid gap-2 grid-cols-1 sm:grid-cols-3 flex-1 mr-4">
                    <input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      placeholder="Category Name"
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-[#FF6600]"
                    />
                    <input
                      value={editingState}
                      onChange={(e) => setEditingState(e.target.value)}
                      placeholder="State"
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-[#FF6600]"
                    />
                    <input
                      value={editingCity}
                      onChange={(e) => setEditingCity(e.target.value)}
                      placeholder="City"
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-[#FF6600]"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-bold text-white">
                      {cat.name}
                    </span>
                    {(cat.state || cat.city) && (
                      <span className="text-[10px] font-medium text-gray-400">
                        {cat.city ? `${cat.city}, ` : ""}{cat.state || ""}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex gap-2 shrink-0">
                  {editingId === cat.id ? (
                    <button
                      onClick={() => handleUpdate(cat.id)}
                      className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-green-700 cursor-pointer"
                    >
                      Save
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingId(cat.id);
                        setEditingName(cat.name);
                        setEditingState(cat.state || "");
                        setEditingCity(cat.city || "");
                      }}
                      className="rounded-lg bg-cyan-600 p-2 text-white transition hover:bg-cyan-700 cursor-pointer"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(cat)}
                    className="rounded-lg bg-red-600 p-2 text-white transition hover:bg-red-700 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Sleek Custom Delete Category Modal Overlay */}
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
            <p className="mt-3 text-gray-400">
              Are you sure you want to delete <span className="font-bold text-white">{deletingCategory.name}</span>? This action cannot be undone.
            </p>

            <div className="mt-8 flex gap-4">
              <button
                onClick={() => setDeletingCategory(null)}
                className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-4 font-bold text-white transition hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteMutation.mutate(deletingCategory.id);
                }}
                disabled={deleteMutation.isPending}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-red-500 py-4 font-bold text-white transition hover:bg-red-600 disabled:opacity-60"
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Trash2 className="h-5 w-5" />
                )}
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}