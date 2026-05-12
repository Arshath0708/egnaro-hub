//CategoriesModal.tsx
import { useEffect, useState } from "react";
import {
  addCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "@/services/api";

import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Pencil,
  X,
} from "lucide-react";

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
  const [categories, setCategories] = useState<
    Category[]
  >([]);

  const [newCategory, setNewCategory] =
    useState("");

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [editingName, setEditingName] =
    useState("");

  async function loadCategories() {
    try {
      const data = await getCategories();

      if (Array.isArray(data)) {
        setCategories(data);
      }
    } catch {
      toast.error("Failed to load categories");
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  async function handleAdd() {
    if (!newCategory.trim()) return;

    try {
      const res = await addCategory(
        newCategory
      );

      if (res.success) {
        toast.success("Category added");

        setNewCategory("");

        loadCategories();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed");
    }
  }

  async function handleUpdate(id: number) {
    try {
      const res = await updateCategory(
        id,
        editingName
      );

      if (res.success) {
        toast.success("Updated");

        setEditingId(null);

        loadCategories();
      }
    } catch {
      toast.error("Failed");
    }
  }

  async function handleDelete(id: number) {
    if (
      !confirm(
        "Delete this category?"
      )
    )
      return;

    try {
      const res = await deleteCategory(id);

      if (res.success) {
        toast.success("Deleted");

        loadCategories();
      }
    } catch {
      toast.error("Failed");
    }
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
                    handleDelete(cat.id)
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
    </div>
  );
}