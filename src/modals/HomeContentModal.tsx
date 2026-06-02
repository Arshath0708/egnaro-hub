// HomeContentModal.tsx
import { useEffect, useRef, useState } from "react";
import { X, LayoutTemplate, ImagePlus, Loader2, Save, Monitor, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { getHomeContent, updateHomeContent, uploadImage } from "@/services/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const SLIDES = [
  { number: 1, label: "Slide 1 — Products" },
  { number: 2, label: "Slide 2 — Sourcing" },
  { number: 3, label: "Slide 3 — Logistics" },
];

type SlideData = {
  slide_number: number;
  left_title: string;
  left_subtext: string;
  left_image: string;
  right_title: string;
  right_subtext: string;
};

const defaultSlide = (n: number): SlideData => ({
  slide_number: n,
  left_title: "",
  left_subtext: "",
  left_image: "",
  right_title: "",
  right_subtext: "",
});

const inputClass =
  "w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none transition-all focus:border-primary";

export function HomeContentModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [activeSlide, setActiveSlide] = useState(1);
  const [slides, setSlides] = useState<SlideData[]>([
    defaultSlide(1),
    defaultSlide(2),
    defaultSlide(3),
  ]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Fetch current content using useQuery
  const { data: homeContentRes, isLoading: loading } = useQuery({
    queryKey: ["home-content"],
    queryFn: getHomeContent,
  });

  // Keep local slide drafts in sync when query completes/refetches
  useEffect(() => {
    if (homeContentRes?.success && Array.isArray(homeContentRes.slides)) {
      const merged = SLIDES.map((s) => {
        const found = homeContentRes.slides.find((r: any) => Number(r.slide_number) === s.number);
        return found ? { ...defaultSlide(s.number), ...found } : defaultSlide(s.number);
      });
      setSlides(merged);
    }
  }, [homeContentRes]);

  const current = slides.find((s) => s.slide_number === activeSlide)!;

  const saveMutation = useMutation({
    mutationFn: (slide: SlideData) => updateHomeContent(slide),
    onSuccess: (res) => {
      if (res.success) {
        toast.success(`Slide ${activeSlide} saved successfully`);
        queryClient.invalidateQueries({ queryKey: ["home-content"] });
      } else {
        toast.error(res.message || "Save failed");
      }
    },
    onError: () => {
      toast.error("Failed to save slide content");
    },
  });

  function update(field: keyof SlideData, value: string) {
    setSlides((prev) =>
      prev.map((s) => (s.slide_number === activeSlide ? { ...s, [field]: value } : s))
    );
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      update("left_image", url);
      toast.success("Image uploaded");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function handleSave() {
    saveMutation.mutate(current);
  }

  const saving = saveMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 p-4 backdrop-blur-md">
      <div className="flex min-h-full items-start justify-center py-8">
        <div className="relative w-full max-w-5xl rounded-[36px] border border-white/10 bg-[#050816] shadow-2xl">
          <div className="p-8 lg:p-10">
            {/* HEADER */}
            <div className="mb-8 flex items-start justify-between">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
                  <LayoutTemplate className="h-4 w-4" />
                  Content Management
                </div>
                <h2 className="text-3xl font-black text-white md:text-4xl">Hero Section</h2>
                <p className="mt-2 text-sm text-gray-400">
                  Edit each slide's content — changes save per slide.
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-full bg-white/5 p-3 text-gray-400 transition-all hover:bg-white/10 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {loading ? (
              <div className="flex h-64 flex-col items-center justify-center gap-4 text-gray-400">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span>Loading slide content...</span>
              </div>
            ) : (
              <>
                {/* SLIDE TABS */}
                <div className="mb-8 flex gap-2 rounded-2xl bg-white/5 p-1">
                  {SLIDES.map((s) => (
                    <button
                      key={s.number}
                      onClick={() => setActiveSlide(s.number)}
                      className={`flex-1 rounded-xl py-3 text-sm font-bold transition-all ${
                        activeSlide === s.number
                          ? "bg-primary text-white shadow-lg"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                {/* EDITOR GRID */}
                <div className="grid gap-8 lg:grid-cols-2">
                  {/* LEFT PANEL — Controls API's right_* text */}
                  <div className="space-y-5">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500">
                      <Smartphone className="h-3.5 w-3.5" />
                      Left Side
                    </div>

                    {/* Left title (API: right_title) */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-300">Left Title</label>
                      <input
                        type="text"
                        value={current.right_title}
                        onChange={(e) => update("right_title", e.target.value)}
                        placeholder="e.g. Trusted by businesses across India"
                        className={inputClass}
                      />
                    </div>

                    {/* Left subtext (API: right_subtext) */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-300">Left Subtext</label>
                      <textarea
                        rows={5}
                        value={current.right_subtext}
                        onChange={(e) => update("right_subtext", e.target.value)}
                        placeholder="Descriptive text shown on the left panel..."
                        className={`${inputClass} resize-none`}
                      />
                    </div>
                  </div>

                  {/* RIGHT PANEL — Controls API's left_* text & image */}
                  <div className="space-y-5">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500">
                      <Monitor className="h-3.5 w-3.5" />
                      Right Side
                    </div>

                    {/* Right Image (API: left_image) */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-300">
                        Right Image
                      </label>
                      <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-5 transition hover:bg-primary/10">
                        {current.left_image ? (
                          <img
                            src={current.left_image}
                            alt="slide"
                            className="h-32 w-full rounded-xl object-cover"
                          />
                        ) : (
                          <ImagePlus className="h-8 w-8 text-primary" />
                        )}
                        <span className="text-sm font-semibold text-primary">
                          {uploading ? "Uploading..." : current.left_image ? "Change Image" : "Upload Image"}
                        </span>
                        <input
                          ref={fileRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                          disabled={uploading}
                        />
                      </label>
                      {current.left_image && (
                        <input
                          type="text"
                          value={current.left_image}
                          onChange={(e) => update("left_image", e.target.value)}
                          placeholder="Or paste image URL"
                          className={`${inputClass} mt-2`}
                        />
                      )}
                    </div>

                    {/* Right title (API: left_title) */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-300">Right Title</label>
                      <input
                        type="text"
                        value={current.left_title}
                        onChange={(e) => update("left_title", e.target.value)}
                        placeholder="e.g. Premium products"
                        className={inputClass}
                      />
                    </div>

                    {/* Right subtext (API: left_subtext) */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-300">Right Subtext</label>
                      <textarea
                        rows={3}
                        value={current.left_subtext}
                        onChange={(e) => update("left_subtext", e.target.value)}
                        placeholder="Supporting text for the right panel..."
                        className={`${inputClass} resize-none`}
                      />
                    </div>
                  </div>
                </div>

                {/* SAVE BUTTON */}
                <div className="mt-8 flex justify-end gap-4">
                  <button
                    onClick={onClose}
                    className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 font-semibold text-gray-300 transition hover:bg-white/10"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || uploading}
                    className="flex items-center gap-2 rounded-2xl bg-primary px-8 py-3 font-bold text-white transition hover:bg-primary-hover disabled:opacity-60"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {saving ? "Saving..." : `Save Slide ${activeSlide}`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
