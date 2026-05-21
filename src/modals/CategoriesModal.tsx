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

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [editingName, setEditingName] =
    useState("");

  const [deletingCategory, setDeletingCategory] =
    useState<Category | null>(null);

  const { data: apiCategories = [], isLoading } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const categories = Array.isArray(apiCategories) ? apiCategories : [];

  const addMutation = useMutation({
    mutationFn: (name: string) => addCategory(name),
    onSuccess: (res) => {
      if (res.success) {
        toast.success("Category added");
        setNewCategory("");
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
    mutationFn: ({ id, name }: { id: number; name: string }) => updateCategory(id, name),
    onSuccess: (res) => {
      if (res.success) {
        toast.success("Updated");
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
    if (!newCategory.trim()) return;
    addMutation.mutate(newCategory);
  }

  function handleUpdate(id: number) {
    if (!editingName.trim()) return;
    updateMutation.mutate({ id, name: editingName });
  }

  function handleDelete(cat: Category) {
    setDeletingCategory(cat);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-[#0f172a] p-6">

        {/* HEADER */}

        <div className="mb-6 flex items-center justify-between">
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

        {/* ADD */}

        <div className="mb-6 flex gap-3">
          <input
            value={newCategory}
            onChange={(e) =>
              setNewCategory(
                e.target.value
              )
            }
            placeholder="Enter category"
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
          />

          <button
            onClick={handleAdd}
            className="rounded-xl bg-[#FF6600] px-5 text-white"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        {/* LIST */}

        <div className="space-y-3">

          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4"
            >
              {editingId === cat.id ? (
                <input
                  value={editingName}
                  onChange={(e) =>
                    setEditingName(
                      e.target.value
                    )
                  }
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white"
                />
              ) : (
                <span className="text-white">
                  {cat.name}
                </span>
              )}

              <div className="flex gap-2">
                {editingId === cat.id ? (
                  <button
                    onClick={() =>
                      handleUpdate(cat.id)
                    }
                    className="rounded-lg bg-green-600 px-3 py-2 text-white"
                  >
                    Save
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setEditingId(cat.id);
                      setEditingName(
                        cat.name
                      );
                    }}
                    className="rounded-lg bg-cyan-600 p-2 text-white"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}

                <button
                  onClick={() =>
                    handleDelete(cat)
                  }
                  className="rounded-lg bg-red-600 p-2 text-white"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
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