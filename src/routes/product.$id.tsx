import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Star,
  ShoppingCart,
  ShieldCheck,
  Truck,
  ChevronLeft,
  Minus,
  Plus,
  ChevronRight,
  MessageSquare,
  User,
  Calendar,
} from "lucide-react";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shell } from "@/components/layout/Shell";
import { getProducts, getReviews, addReview } from "@/services/api";
import { inr } from "@/lib/format";
import { useCart } from "@/context/cart-store";
import { toast } from "sonner";
import { sanitizeInput, validateName } from "@/lib/validation";

type Product = {
  total_reviews: number;
  average_rating: number;
  id: number;
  name: string;
  category: string;
  image: string;
  price: number;
  original_price: number;
  discount: number;
  description: string;
  stock?: number;
  specifications?: Record<string, string>;
  status?: string;
  approved?: boolean | number;
};

type Review = {
  customer_name: string;
  rating: number;
  review: string;
  created_at: string;
};

export default function ProductDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const add = useCart((s) => s.add);
  const queryClient = useQueryClient();

  const [qty, setQty] = useState(1);
  const [showReviews, setShowReviews] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(5);

  /* PRODUCT */

  const { data: product, isLoading } = useQuery<Product | null>({
    queryKey: ["product", id],
    queryFn: async () => {
      // First try to look up in existing cached storefront products catalog
      const cachedProducts = queryClient.getQueryData<any[]>(["products"]);
      if (cachedProducts) {
        const found = cachedProducts.find(
          (p: any) => String(p.id) === String(id)
        );
        if (found) return found;
      }

      // Fallback: fetch products list if not in cache
      const products = await getProducts();

      const found = products.find(
        (p: Product) =>
          String(p.id) === String(id) &&
          p.status !== "rejected" &&
          p.status !== "deleted" &&
          (p.approved === true || Number(p.approved) === 1 || p.status === "approved")
      );

      return found || null;
    },
  });

  /* REVIEWS */

  const {
    data: reviews = [],
    isLoading: isLoadingReviews,
    refetch: refetchReviews,
  } = useQuery<Review[]>({
    queryKey: ["reviews", id],
    queryFn: () => getReviews(Number(id)),
  });

  const calculatedAverage = useMemo(() => {
    if (reviews.length === 0) return Number(product?.average_rating || 0);
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return sum / reviews.length;
  }, [reviews, product?.average_rating]);

  const ratingStats = useMemo(() => {
    const stats = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };
    reviews.forEach((r) => {
      if (stats[r.rating as keyof typeof stats] !== undefined) {
        stats[r.rating as keyof typeof stats]++;
      }
    });
    return stats;
  }, [reviews]);

  /* ADD REVIEW */

  async function handleSubmitReview() {
    const cleanName = sanitizeInput(customerName);
    const cleanReview = sanitizeInput(reviewText);

    if (!cleanName || !cleanReview) {
      toast.error("Please fill all fields");
      return;
    }

    if (!validateName(cleanName)) {
      toast.error("Please enter a valid name");
      return;
    }

    try {
      const res = await addReview({
        product_id: Number(id),
        customer_name: cleanName,
        rating,
        review: cleanReview,
      });

      if (res.success) {
        toast.success("Review added successfully");

        setCustomerName("");
        setReviewText("");
        setRating(5);

        refetchReviews();
      } else {
        toast.error(res.error || "Failed to add review");
      }
    } catch (err) {
      toast.error("Something went wrong");
    }
  }

  /* LOADING */

  if (isLoading) {
    return (
      <Shell>
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-3xl bg-muted" />

          <div className="space-y-4">
            <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />

            <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />

            <div className="h-32 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </Shell>
    );
  }

  /* PRODUCT NOT FOUND */

  if (!product) {
    return (
      <Shell>
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="font-display text-3xl font-bold">
            Product not found
          </h1>

          <Link
            to="/products"
            className="mt-6 inline-block text-primary"
          >
            ← Back to shop
          </Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* BACK BUTTON */}

        <button
          onClick={() => nav("/products")}
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>

        <div className="grid gap-10 md:grid-cols-2">

          {/* IMAGE */}

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative aspect-square overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-md transform-gpu"
          >
            <img
              src={product.image}
              alt={product.name}
              decoding="async"
              className="h-full w-full object-cover transform-gpu transition-transform duration-500 will-change-transform hover:scale-102"
            />

            {Number(product.discount) > 0 && (
              <div className="absolute left-4 top-4 rounded-xl bg-primary/10 border border-primary/30 px-3.5 py-1.5 font-mono text-xs font-black uppercase tracking-[0.1em] text-primary shadow-xl backdrop-blur-md">
                {product.discount}% OFF
              </div>
            )}
          </motion.div>

          {/* DETAILS */}

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="transform-gpu"
          >
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              {product.category?.replace("-", " ")}
            </div>

            <h1 className="font-display text-3xl font-black md:text-5xl">
              {product.name}
            </h1>

            {/* RATING */}

            <div className="mt-4 flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 px-2.5 py-0.5">
                <svg className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500 drop-shadow-[0_2px_4px_rgba(234,179,8,0.2)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>

                <span className="font-mono font-bold text-yellow-500 text-xs">
                  {calculatedAverage.toFixed(1)}
                </span>
              </div>

              <span className="text-muted-foreground">
                ({reviews.length} reviews)
              </span>

              <span className="text-muted-foreground">·</span>

              <span className="text-green-400 font-bold">
                In Stock
              </span>
            </div>

            {/* PRICE */}

            <div className="mt-6 flex items-end gap-4">
              <div className="text-5xl font-black text-primary">
                {inr(Number(product.price))}
              </div>

              {Number(product.original_price) >
                Number(product.price) && (
                  <>
                    <div className="pb-1 text-lg text-muted-foreground line-through">
                      {inr(Number(product.original_price))}
                    </div>

                    <div className="pb-1 text-sm font-semibold text-green-400">
                      Save{" "}
                      {inr(
                        Number(product.original_price) -
                        Number(product.price)
                      )}
                    </div>
                  </>
                )}
            </div>

            {/* DESCRIPTION */}

            <p className="mt-6 leading-relaxed text-muted-foreground">
              {product.description}
            </p>

            {/* QUANTITY */}

            <div className="mt-8 flex flex-col gap-4 xl:flex-row xl:items-center">
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 sm:w-auto">
                <button
                  onClick={() =>
                    setQty((q) => Math.max(1, q - 1))
                  }
                  className="p-4 transition hover:text-primary"
                >
                  <Minus className="h-4 w-4" />
                </button>

                <div className="w-12 text-center font-bold">
                  {qty}
                </div>

                <button
                  onClick={() => setQty((q) => q + 1)}
                  className="p-4 transition hover:text-primary"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <div className="flex flex-1 gap-3">
                {/* ADD TO CART */}
                <button
                  onClick={() => {
                    add(product.id.toString(), qty);

                    toast.success("Added to cart 🛒", {
                      description: product.name,
                    });
                  }}
                  className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-4 font-bold text-foreground transition hover:bg-white/10 hover:scale-[1.02]"
                >
                  <div className="flex items-center justify-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Add to Cart
                  </div>
                </button>

                {/* BUY NOW */}
                <button
                  onClick={() => {
                    add(product.id.toString(), qty);
                    nav("/checkout");
                  }}
                  className="flex-1 rounded-2xl gradient-primary py-4 font-bold text-primary-foreground shadow-glow transition hover:scale-[1.02] shimmer"
                >
                  Buy Now
                </button>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 transform-gpu transition-[transform,border-color,background-color,color] hover:scale-[1.02] hover:border-cyan-500/25 duration-300">
                <div className="flex items-center gap-3.5">
                  <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 pointer-events-none">
                    <svg className="h-5 w-5 text-cyan-400 drop-shadow-[0_2px_6px_rgba(34,211,238,0.3)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="3" width="15" height="13" rx="2" ry="2" fill="rgba(34,211,238,0.05)" />
                      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                      <circle cx="5.5" cy="18.5" r="2.5" />
                      <circle cx="18.5" cy="18.5" r="2.5" />
                    </svg>
                  </div>

                  <div>
                    <div className="text-xs sm:text-sm font-black text-slate-100">
                      Free Shipping
                    </div>

                    <div className="text-[10px] sm:text-xs text-slate-400 font-medium">
                      Pan India Tracked
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 transform-gpu transition-[transform,border-color,background-color,color] hover:scale-[1.02] hover:border-emerald-500/25 duration-300">
                <div className="flex items-center gap-3.5">
                  <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 pointer-events-none">
                    <svg className="h-5 w-5 text-emerald-400 drop-shadow-[0_2px_6px_rgba(52,211,153,0.3)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="rgba(52,211,153,0.1)" />
                      <path d="m9 11 2 2 4-4" />
                    </svg>
                  </div>

                  <div>
                    <div className="text-xs sm:text-sm font-black text-slate-100">
                      Verified Vendor
                    </div>

                    <div className="text-[10px] sm:text-xs text-slate-400 font-medium">
                      100% Authentic
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SPECIFICATIONS */}

            <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
              <h3 className="mb-4 text-xl font-bold">Specifications</h3>

              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                {product.specifications ? (
                  Object.entries(product.specifications).map(([k, v]) => (
                    <div key={k} className="contents">
                      <dt className="text-muted-foreground">{k}</dt>
                      <dd className="font-medium">{v}</dd>
                    </div>
                  ))
                ) : (
                  <>
                    <dt className="text-muted-foreground">Category</dt>
                    <dd>{product.category}</dd>
                    <dt className="text-muted-foreground">Product ID</dt>
                    <dd>#{product.id}</dd>
                  </>
                )}
              </dl>
            </div>

            {/* SEE REVIEWS BUTTON */}
            <div className="mt-8 flex justify-center md:justify-start">
              <button
                onClick={() => setShowReviews(!showReviews)}
                className="group flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold transition-[transform,border-color,background-color,color] hover:bg-white/10 hover:text-primary"
              >
                {showReviews ? "Hide Reviews" : "See Reviews"}
                <ChevronRight
                  className={`h-4 w-4 transition-transform duration-300 ${showReviews ? "rotate-90" : "group-hover:translate-x-1"
                    }`}
                />
              </button>
            </div>
          </motion.div>
        </div>

        {/* REVIEWS SECTION */}
        <AnimatePresence>
          {showReviews && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-16 rounded-[2.5rem] border border-white/10 bg-white/[0.02] p-8 backdrop-blur-sm md:p-12">
                <div className="grid gap-12 lg:grid-cols-12">
                  {/* LEFT: SUMMARY */}
                  <div className="lg:col-span-4">
                    <h3 className="mb-6 text-3xl font-black">Customer Reviews</h3>

                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-center justify-center rounded-3xl bg-gradient-to-br from-white/10 to-transparent p-6 text-center">
                        <span className="text-5xl font-black text-primary">
                          {calculatedAverage.toFixed(1)}
                        </span>
                        <div className="mt-2 flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${i < Math.round(calculatedAverage)
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-white/20"
                                }`}
                            />
                          ))}
                        </div>
                        <span className="mt-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          {reviews.length} total reviews
                        </span>
                      </div>
                    </div>

                    <div className="mt-8 space-y-3">
                      {[5, 4, 3, 2, 1].map((star) => {
                        const count = ratingStats[star as keyof typeof ratingStats];
                        const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                        return (
                          <div key={star} className="flex items-center gap-3">
                            <span className="w-12 text-sm font-medium text-muted-foreground">{star} star</span>
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                transition={{ duration: 1, delay: 0.2 }}
                                className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 shadow-[0_0_8px_rgba(250,204,21,0.4)]"
                              />
                            </div>
                            <span className="w-10 text-right text-xs font-bold text-muted-foreground">{Math.round(percentage)}%</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* WRITE A REVIEW FORM */}
                    <div className="mt-12 rounded-3xl border border-white/5 bg-white/[0.03] p-6">
                      <h4 className="mb-4 flex items-center gap-2 text-lg font-bold">
                        <MessageSquare className="h-5 w-5 text-primary" />
                        Write a Review
                      </h4>
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          await handleSubmitReview();
                        }}
                        className="space-y-4"
                      >
                        <fieldset disabled={false} className="space-y-4 border-none p-0 m-0 min-w-0">
                          <div className="relative">
                            <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                              type="text"
                              placeholder="Full Name"
                              value={customerName}
                              onChange={(e) => setCustomerName(e.target.value)}
                              className="w-full rounded-2xl border border-white/10 bg-black/40 py-3 pl-12 pr-4 text-sm outline-none focus:border-primary/50"
                              required
                            />
                          </div>

                          <div className="flex items-center gap-2 px-2">
                            <span className="text-xs font-semibold text-muted-foreground">Rating:</span>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => setRating(s)}
                                  className="transition-transform hover:scale-125"
                                >
                                  <Star
                                    className={`h-5 w-5 ${s <= rating ? "fill-yellow-400 text-yellow-400" : "text-white/20"
                                      }`}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>

                          <textarea
                            placeholder="What did you like or dislike?"
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                            rows={4}
                            className="w-full rounded-2xl border border-white/10 bg-black/40 p-4 text-sm outline-none focus:border-primary/50"
                            required
                          />

                          <button
                            type="submit"
                            className="w-full rounded-2xl gradient-primary py-4 text-sm font-black text-primary-foreground transition hover:scale-[1.02] hover:shadow-glow shimmer"
                          >
                            Submit Review
                          </button>
                        </fieldset>
                      </form>
                    </div>
                  </div>

                  {/* RIGHT: REVIEWS LIST */}
                  <div className="lg:col-span-8">
                    <div className="mb-6 flex items-center justify-between">
                      <h4 className="text-xl font-bold">Top Reviews</h4>
                      <div className="text-sm text-muted-foreground">Sort by: Recent</div>
                    </div>

                    <div className="space-y-6">
                      {isLoadingReviews ? (
                        <div className="space-y-4">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="h-32 animate-pulse rounded-3xl bg-white/5" />
                          ))}
                        </div>
                      ) : reviews.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <div className="mb-4 rounded-full bg-white/5 p-6">
                            <MessageSquare className="h-10 w-10 text-muted-foreground" />
                          </div>
                          <p className="text-lg font-medium text-muted-foreground">No reviews yet</p>
                          <p className="text-sm text-muted-foreground/60">Be the first to share your thoughts!</p>
                        </div>
                      ) : (
                        reviews.map((review, index) => (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            key={index}
                            className="glass group rounded-[2rem] p-6 transition-[transform,border-color,background-color,color] hover:bg-white/[0.04]"
                          >
                            <div className="mb-4 flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 border border-primary/30 font-bold text-primary">
                                  {review.customer_name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-bold">{review.customer_name}</div>
                                  <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`h-3 w-3 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-white/20"
                                          }`}
                                      />
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {new Date(review.created_at).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </div>
                            </div>

                            <p className="leading-relaxed text-muted-foreground/90">{review.review}</p>

                            <div className="mt-4 flex items-center gap-4 text-xs font-medium text-muted-foreground">
                              <button className="transition hover:text-primary">Helpful</button>
                              <button className="transition hover:text-primary">Report</button>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Shell>
  );
}