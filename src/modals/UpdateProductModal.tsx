import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X, Sparkles, ImagePlus, Eye } from "lucide-react";
import { toast } from "sonner";
import { updateProduct, adminUpdateProduct, getCategories, addSubcategory, addSubSubcategory } from "@/services/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { sanitizeInput } from "@/lib/validation";
import { QUERY_KEYS } from "@/lib/query-keys";


export function UpdateProductModal({
  product,
  vendorId,
  isAdmin = false,
  onClose,
}: {
  product: any;
  vendorId: string;
  isAdmin?: boolean;
  onClose: () => void;
}) {
  const [previewImage, setPreviewImage] = useState(product.image || "");
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const [form, setForm] = useState({
    product_id: product.id,
    vendor_id: vendorId,
    name: product.name || "",
    category: product.category || "",
    subcategory_id: product.subcategory_id || undefined,
    subcategory: product.subcategory || "",
    sub_subcategory_id: product.sub_subcategory_id || undefined,
    sub_subcategory: product.sub_subcategory || "",
    image: product.image || "",
    price: product.price || "",
    original_price: product.original_price || "",
    discount: product.discount || "",
    description: product.description || "",
    stock_quantity: product.stock_quantity || "",
    role: "admin",
    approved: 1,
    status: "approved",
    gst_percentage: product.gst_percentage || "0",
    hsn_code: product.hsn_code || "",
  });

  useEffect(() => {
    if (categories.length > 0 && !form.category && !product.category) {
      const defaultCat = categories[0];
      const subcats = defaultCat.subcategories || [];
      const firstSub = subcats[0];
      const subsubcats = firstSub?.sub_subcategories || [];
      const firstSubSub = subsubcats[0];
      setForm((prev) => ({
        ...prev,
        category: defaultCat.name,
        subcategory_id: firstSub ? Number(firstSub.id) : undefined,
        subcategory: firstSub ? firstSub.name : "",
        sub_subcategory_id: firstSubSub ? Number(firstSubSub.id) : undefined,
        sub_subcategory: firstSubSub ? firstSubSub.name : ""
      }));
    }
  }, [categories, form.category, product.category]);

  const [isCreatingSubcat, setIsCreatingSubcat] = useState(false);
  const [newSubcatName, setNewSubcatName] = useState("");
  const [subcatLoading, setSubcatLoading] = useState(false);

  const [isCreatingSubSubcat, setIsCreatingSubSubcat] = useState(false);
  const [newSubSubcatNameInput, setNewSubSubcatNameInput] = useState("");
  const [subsubcatLoading, setSubsubcatLoading] = useState(false);

  async function handleCreateSubcategory() {
    const nameTrimmed = newSubcatName.trim();
    if (!nameTrimmed) {
      toast.error("Please enter a subcategory name");
      return;
    }
    const currentCategoryObj = categories.find((c: any) => c.name === form.category);
    if (!currentCategoryObj) {
      toast.error("Please select a category first");
      return;
    }

    try {
      setSubcatLoading(true);
      const res = await addSubcategory(Number(currentCategoryObj.id), nameTrimmed);
      if (res.success) {
        toast.success("Subcategory added successfully");
        await queryClient.invalidateQueries({ queryKey: ["categories"] });
        setForm((prev: any) => ({
          ...prev,
          subcategory_id: Number(res.id),
          subcategory: nameTrimmed,
          sub_subcategory_id: undefined,
          sub_subcategory: "",
        }));
        setNewSubcatName("");
        setIsCreatingSubcat(false);
      } else {
        toast.error(res.message || "Failed to add subcategory");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Error creating subcategory");
    } finally {
      setSubcatLoading(false);
    }
  }

  async function handleCreateSubSubcategory() {
    const nameTrimmed = newSubSubcatNameInput.trim();
    if (!nameTrimmed) {
      toast.error("Please enter a sub-subcategory name");
      return;
    }
    if (!form.subcategory_id) {
      toast.error("Please select a subcategory first");
      return;
    }

    try {
      setSubsubcatLoading(true);
      const res = await addSubSubcategory(Number(form.subcategory_id), nameTrimmed);
      if (res.success) {
        toast.success("Sub-subcategory added successfully");
        await queryClient.invalidateQueries({ queryKey: ["categories"] });
        setForm((prev: any) => ({
          ...prev,
          sub_subcategory_id: Number(res.id),
          sub_subcategory: nameTrimmed,
        }));
        setNewSubSubcatNameInput("");
        setIsCreatingSubSubcat(false);
      } else {
        toast.error(res.message || "Failed to add sub-subcategory");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Error creating sub-subcategory");
    } finally {
      setSubsubcatLoading(false);
    }
  }

  const mutation = useMutation({
    mutationFn: async () => {
      return await adminUpdateProduct(form);
    },
    onSuccess: async () => {
      toast.success("Product updated successfully ");
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.VENDOR_PRODUCTS_ALL] });
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.VENDOR_PRODUCTS_PAGINATED] });
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.VENDOR_STATS] });
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PRODUCTS] });
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_PRODUCTS] });
      onClose();
    },
    onError: (err: any) => {
      console.error(err);
      toast.error(err.message || "Failed to update product");
    },
  });

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const localPreview = URL.createObjectURL(file);
    setPreviewImage(localPreview);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const apiBase = import.meta.env.VITE_API_URL || "/api";
      const res = await fetch(`${apiBase}/upload-image.php`, {
        method: "POST",
        body: formData,
      });

      clearTimeout(timeout);
      const data = await res.json();

      if (data.success && (data.url || data.image)) {
        setForm((prev) => ({
          ...prev,
          image: data.url || data.image,
        }));
        toast.success("Image uploaded successfully");
      } else {
        toast.error(data.message || "Image upload failed");
        setPreviewImage(product.image || "");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Upload failed");
      setPreviewImage(product.image || "");
    } finally {
      setUploading(false);
    }
  }

  const inputClass =
    "w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white outline-none placeholder:text-gray-500 focus:border-cyan-400";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 p-4 backdrop-blur-md">
      <div className="flex min-h-full items-start justify-center py-8">
        <div className="relative w-full max-w-5xl rounded-[36px] border border-white/10 bg-[#050816] shadow-2xl">
          <div className="p-8 lg:p-10">
            {/* HEADER */}
            <div className="mb-8 flex items-start justify-between">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
                  <Sparkles className="h-4 w-4" />
                  Edit Product
                </div>
                <h1 className="text-4xl font-black text-white">Update Product</h1>
                <p className="mt-3 text-gray-400">Modify your product details.</p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-white transition hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* FORM */}
            <form className="grid gap-8 lg:grid-cols-2">
              <fieldset disabled={mutation.isPending || uploading} className="contents border-none p-0 m-0">
              {/* LEFT */}
              <div className="space-y-5">
                <InputField
                  label="Product Name"
                  value={form.name}
                  onChange={(v) => setForm((p) => ({ ...p, name: v }))}
                  placeholder="Enter product name"
                  className={inputClass}
                />

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">Category</label>
                  <Select
                    value={form.category}
                    onValueChange={(val) => {
                      const selectedCat = categories.find((c: any) => c.name === val);
                      const subcats = selectedCat?.subcategories || [];
                      const firstSub = subcats[0];
                      const subsubcats = firstSub?.sub_subcategories || [];
                      const firstSubSub = subsubcats[0];
                      setForm((p) => ({
                        ...p,
                        category: val,
                        subcategory_id: firstSub ? Number(firstSub.id) : undefined,
                        subcategory: firstSub ? firstSub.name : "",
                        sub_subcategory_id: firstSubSub ? Number(firstSubSub.id) : undefined,
                        sub_subcategory: firstSubSub ? firstSubSub.name : ""
                      }));
                    }}
                  >
                    <SelectTrigger className="w-full h-11 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white focus:ring-1 focus:ring-primary outline-none">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat: any) => (
                        <SelectItem key={cat.id} value={cat.name}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                 {(() => {
                  const currentCategoryObj = categories.find((c: any) => c.name === form.category);
                  if (!form.category) return null;

                  const subcategories = currentCategoryObj?.subcategories || [];
                  const currentSubcatObj = subcategories.find((s: any) => Number(s.id) === Number(form.subcategory_id));
                  const subsubcategories = currentSubcatObj?.sub_subcategories || [];

                  return (
                    <>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-gray-300">Subcategory</label>
                          {!isCreatingSubcat && (
                            <button
                              type="button"
                              onClick={() => setIsCreatingSubcat(true)}
                              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 hover:underline transition-colors"
                            >
                              + Add New Subcategory
                            </button>
                          )}
                        </div>

                        {isCreatingSubcat ? (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Enter new subcategory name"
                              value={newSubcatName}
                              onChange={(e) => setNewSubcatName(e.target.value)}
                              disabled={subcatLoading}
                              className="flex-1 h-11 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-[#06b6d4]"
                            />
                            <button
                              type="button"
                              onClick={handleCreateSubcategory}
                              disabled={subcatLoading}
                              className="h-11 px-4 rounded-2xl bg-cyan-500 hover:bg-cyan-600 text-sm font-semibold text-white active:scale-95 transition-all disabled:opacity-50"
                            >
                              {subcatLoading ? "Adding..." : "Add"}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setIsCreatingSubcat(false);
                                setNewSubcatName("");
                              }}
                              disabled={subcatLoading}
                              className="h-11 px-4 rounded-2xl bg-white/5 text-sm font-semibold text-gray-300 hover:bg-white/10 active:scale-95 transition-all disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <Select
                            value={form.subcategory_id ? String(form.subcategory_id) : ""}
                            onValueChange={(val) => {
                              const sub = subcategories.find((s: any) => String(s.id) === val);
                              const subsubs = sub?.sub_subcategories || [];
                              const firstSubSub = subsubs[0];
                              setForm((p) => ({
                                ...p,
                                subcategory_id: sub ? Number(sub.id) : undefined,
                                subcategory: sub ? sub.name : "",
                                sub_subcategory_id: firstSubSub ? Number(firstSubSub.id) : undefined,
                                sub_subcategory: firstSubSub ? firstSubSub.name : ""
                              }));
                            }}
                          >
                            <SelectTrigger className="w-full h-11 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white focus:ring-1 focus:ring-primary outline-none">
                              <SelectValue placeholder={subcategories.length === 0 ? "No subcategories. Create one." : "Select subcategory"} />
                            </SelectTrigger>
                            <SelectContent>
                              {subcategories.map((sub: any) => (
                                <SelectItem key={sub.id} value={String(sub.id)}>
                                  {sub.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>

                      {form.subcategory_id && (
                        <div className="space-y-2 animate-fadeIn">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-300">Sub-subcategory (Level 3)</label>
                            {!isCreatingSubSubcat && (
                              <button
                                type="button"
                                onClick={() => setIsCreatingSubSubcat(true)}
                                className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 hover:underline transition-colors"
                              >
                                + Add New Sub-subcategory
                              </button>
                            )}
                          </div>

                          {isCreatingSubSubcat ? (
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Enter new sub-subcategory name"
                                value={newSubSubcatNameInput}
                                onChange={(e) => setNewSubSubcatNameInput(e.target.value)}
                                disabled={subsubcatLoading}
                                className="flex-1 h-11 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-[#06b6d4]"
                              />
                              <button
                                type="button"
                                onClick={handleCreateSubSubcategory}
                                disabled={subsubcatLoading}
                                className="h-11 px-4 rounded-2xl bg-cyan-500 hover:bg-cyan-600 text-sm font-semibold text-white active:scale-95 transition-all disabled:opacity-50"
                              >
                                {subsubcatLoading ? "Adding..." : "Add"}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsCreatingSubSubcat(false);
                                  setNewSubSubcatNameInput("");
                                }}
                                disabled={subsubcatLoading}
                                className="h-11 px-4 rounded-2xl bg-white/5 text-sm font-semibold text-gray-300 hover:bg-white/10 active:scale-95 transition-all disabled:opacity-50"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <Select
                              value={form.sub_subcategory_id ? String(form.sub_subcategory_id) : ""}
                              onValueChange={(val) => {
                                const subsub = subsubcategories.find((ss: any) => String(ss.id) === val);
                                setForm((p) => ({
                                  ...p,
                                  sub_subcategory_id: subsub ? Number(subsub.id) : undefined,
                                  sub_subcategory: subsub ? subsub.name : ""
                                }));
                              }}
                            >
                              <SelectTrigger className="w-full h-11 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white focus:ring-1 focus:ring-primary outline-none">
                                <SelectValue placeholder={subsubcategories.length === 0 ? "No sub-subcategories. Create one." : "Select sub-subcategory"} />
                              </SelectTrigger>
                              <SelectContent>
                                {subsubcategories.map((ssub: any) => (
                                  <SelectItem key={ssub.id} value={String(ssub.id)}>
                                    {ssub.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      )}
                    </>
                  );
                })()}

                <InputField
                  label="Selling Price"
                  type="number"
                  value={form.price.toString()}
                  onChange={(v) => setForm((p) => ({ ...p, price: v }))}
                  placeholder="₹ 0"
                  className={inputClass}
                />

                <InputField
                  label="Original Price"
                  type="number"
                  value={form.original_price.toString()}
                  onChange={(v) => setForm((p) => ({ ...p, original_price: v }))}
                  placeholder="₹ 0"
                  className={inputClass}
                />

                <InputField
                  label="Discount %"
                  type="number"
                  value={form.discount.toString()}
                  onChange={(v) => setForm((p) => ({ ...p, discount: v }))}
                  placeholder="10"
                  className={inputClass}
                />

                <InputField
                  label="Stock Quantity"
                  type="number"
                  value={form.stock_quantity?.toString() || ""}
                  onChange={(v) => setForm((p) => ({ ...p, stock_quantity: v }))}
                  placeholder="100"
                  className={inputClass}
                />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">GST %</label>
                    <Select
                      value={String(form.gst_percentage)}
                      onValueChange={(val) => setForm((p) => ({ ...p, gst_percentage: val }))}
                    >
                      <SelectTrigger className="w-full h-14 rounded-2xl border border-white/10 bg-white/5 px-5 text-base text-white outline-none focus:border-cyan-400">
                        <SelectValue placeholder="Select GST" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0% (None)</SelectItem>
                        <SelectItem value="5">5%</SelectItem>
                        <SelectItem value="12">12%</SelectItem>
                        <SelectItem value="18">18%</SelectItem>
                        <SelectItem value="28">28%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <InputField
                    label="HSN Code"
                    value={form.hsn_code || ""}
                    onChange={(v) => setForm((p) => ({ ...p, hsn_code: v }))}
                    placeholder="Enter HSN Code"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">Product Description</label>
                  <textarea
                    rows={5}
                    className={`${inputClass} resize-none`}
                    placeholder="Write product description..."
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: sanitizeInput(e.target.value) }))}
                  />
                </div>

                {/* IMAGE */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">Upload Product Image</label>
                  <label className="flex cursor-pointer items-center justify-center rounded-2xl border border-dashed border-cyan-400/30 bg-cyan-400/5 px-5 py-6 transition hover:bg-cyan-400/10">
                    <div className="flex flex-col items-center">
                      {previewImage ? (
                        <img src={previewImage} alt="preview" className="mb-3 h-28 w-28 rounded-2xl object-cover" />
                      ) : (
                        <ImagePlus className="mb-3 h-10 w-10 text-cyan-300" />
                      )}
                      <span className="font-semibold text-cyan-300">
                        {uploading ? "Uploading..." : previewImage ? "Change Image" : "Choose Image"}
                      </span>
                      <span className="mt-1 text-xs text-gray-500">JPG / PNG / WEBP</span>
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                </div>
              </div>

              {/* RIGHT PREVIEW */}
              <div>
                <div className="sticky top-10 rounded-3xl border border-white/10 bg-[#0b1220] p-6">
                  <div className="mb-5 flex items-center gap-2 text-cyan-300">
                    <Eye className="h-5 w-5" />
                    <span className="font-semibold">Live Product Preview</span>
                  </div>
                  <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#111827]">
                    <div className="relative">
                      {previewImage ? (
                        <img src={previewImage} alt="preview" className="h-64 w-full object-cover" />
                      ) : (
                        <div className="flex h-64 items-center justify-center bg-[#1f2937] text-gray-500">No Image Selected</div>
                      )}
                      {form.discount && (
                        <div className="absolute right-4 top-4 rounded-full bg-cyan-500 px-4 py-2 text-xs font-bold text-white">
                          {form.discount}% OFF
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <div className="mb-2 text-xs uppercase tracking-[0.2em] text-cyan-300">{form.category}</div>
                      <h2 className="text-2xl font-black text-white">{form.name || "Product Name"}</h2>
                      <p className="mt-3 text-sm text-gray-400">{form.description || "Your product description preview will appear here."}</p>
                      <div className="mt-5 flex items-center justify-between">
                        <div>
                          <div className="text-3xl font-black text-cyan-400">₹{form.price || "0"}</div>
                          <div className="text-sm text-gray-500 line-through">₹{form.original_price || "0"}</div>
                        </div>
                        <button type="button" className="rounded-2xl bg-cyan-500 px-5 py-3 font-semibold text-white">Add to Cart</button>
                      </div>
                    </div>
                  </div>

                  {/* SUBMIT BUTTON */}
                  <button
                    type="button"
                    onClick={() => {
                      if (uploading) return toast.error("Wait for image upload");
                      if (!form.name.trim()) return toast.error("Enter name");
                      if (!form.price) return toast.error("Enter price");
                      mutation.mutate();
                    }}
                    disabled={mutation.isPending || uploading}
                    className="mt-6 w-full rounded-2xl bg-gradient-to-r from-yellow-400 via-orange-300 to-cyan-400 px-8 py-4 font-bold text-black transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {uploading ? "Uploading Image..." : mutation.isPending ? "Updating..." : "Update Product"}
                  </button>
                </div>
              </div>
              </fieldset>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

type InputFieldProps = {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  type?: string;
};

function InputField({ label, value, onChange, placeholder, className, type = "text" }: InputFieldProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-300">{label}</label>
      <input type={type} value={value} placeholder={placeholder} className={className} onChange={(e) => onChange(sanitizeInput(e.target.value))} />
    </div>
  );
}
