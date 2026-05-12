import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Star,
  ShoppingCart,
  ShieldCheck,
  Truck,
  ChevronLeft,
  Minus,
  Plus,
} from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { Shell } from "@/components/layout/Shell";
import { getProducts, getReviews, addReview } from "@/services/api";
import { inr } from "@/lib/format";
import { useCart } from "@/context/cart-store";
import { toast } from "sonner";

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

  const [qty, setQty] = useState(1);

  const [customerName, setCustomerName] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(5);

  /* PRODUCT */

  const { data: product, isLoading } = useQuery<Product | null>({
    queryKey: ["product", id],
    queryFn: async () => {
      const products = await getProducts();

      const found = products.find(
        (p: Product) => String(p.id) === String(id)
      );

      return found || null;
    },
  });

  /* REVIEWS */

  const {
    data: reviews = [],
    refetch: refetchReviews,
  } = useQuery<Review[]>({
    queryKey: ["reviews", id],
    queryFn: () => getReviews(Number(id)),
  });

  /* ADD REVIEW */

  async function handleSubmitReview() {
    if (!customerName || !reviewText) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      const res = await addReview({
        product_id: Number(id),
        customer_name: customerName,
        rating,
        review: reviewText,
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
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative aspect-square overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-md"
          >
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-cover"
            />

            {Number(product.discount) > 0 && (
              <div className="absolute left-4 top-4 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-2 text-sm font-bold text-white shadow-xl">
                {product.discount}% OFF
              </div>
            )}
          </motion.div>

          {/* DETAILS */}

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
              {product.category?.replace("-", " ")}
            </div>

            <h1 className="font-display text-3xl font-black md:text-5xl">
              {product.name}
            </h1>

            {/* RATING */}

            <div className="mt-4 flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />

                <span className="font-semibold">
                  {Number(product.average_rating || 0).toFixed(1)}
                </span>
              </div>

              <span className="text-muted-foreground">
                ({reviews.length} reviews)
              </span>

              <span className="text-muted-foreground">·</span>

              <span className="text-green-400">
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

            <div className="mt-8 flex items-center gap-4">
              <div className="flex items-center rounded-2xl border border-white/10 bg-white/5">
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

              {/* ADD TO CART */}

              <button
                onClick={() => {
                  add(product.id.toString(), qty);

                  toast.success("Added to cart 🛒", {
                    description: product.name,
                  });
                }}
                className="flex-1 rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-yellow-300 py-4 font-bold text-black shadow-[0_10px_40px_rgba(0,255,255,0.25)] transition hover:scale-[1.02]"
              >
                <div className="flex items-center justify-center gap-2">
                  <ShoppingCart className="h-5 w-5" />

                  Add to Cart
                </div>
              </button>
            </div>

            {/* FEATURES */}

            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-3">
                  <Truck className="h-5 w-5 text-cyan-400" />

                  <div>
                    <div className="text-sm font-semibold">
                      Free Shipping
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Pan India
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-green-400" />

                  <div>
                    <div className="text-sm font-semibold">
                      Verified Vendor
                    </div>

                    <div className="text-xs text-muted-foreground">
                      100% Authentic
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SPECIFICATIONS */}

            <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
              <h3 className="mb-4 text-xl font-bold">
                Specifications
              </h3>

              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                {product.specifications ? (
                  Object.entries(product.specifications).map(
                    ([k, v]) => (
                      <div key={k} className="contents">
                        <dt className="text-muted-foreground">
                          {k}
                        </dt>

                        <dd className="font-medium">
                          {v}
                        </dd>
                      </div>
                    )
                  )
                ) : (
                  <>
                    <dt className="text-muted-foreground">
                      Category
                    </dt>

                    <dd>{product.category}</dd>

                    <dt className="text-muted-foreground">
                      Product ID
                    </dt>

                    <dd>#{product.id}</dd>
                  </>
                )}
              </dl>
            </div>
          </motion.div>
        </div>

        {/* REVIEWS SECTION */}

        <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">
                Ratings & Reviews
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                Verified customer feedback
              </p>
            </div>

            <div className="text-right">
              <div className="flex items-center justify-end gap-1">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />

                <span className="text-2xl font-black">
                  {Number(product.average_rating || 0).toFixed(1)}
                </span>
              </div>

              <div className="text-sm text-muted-foreground">
                {reviews.length} reviews
              </div>
            </div>
          </div>

          {/* ADD REVIEW FORM */}

          {/* WRITE REVIEW */}
<div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
  <h4 className="mb-4 text-xl font-bold">
    Write a Review
  </h4>

  <form
    onSubmit={async (e) => {
      e.preventDefault();

      if (!customerName || !reviewText) {
        toast.error("Please fill all fields");
        return;
      }

      try {
        const res = await addReview({
          product_id: product.id,
          customer_name: customerName,
          rating,
          review: reviewText,
        });

        if (res.success) {
          toast.success("Review submitted successfully");

          setCustomerName("");
          setReviewText("");
          setRating(5);

          window.location.reload();
        } else {
          toast.error(res.error || "Failed to submit review");
        }
      } catch (err) {
        console.error(err);
        toast.error("Something went wrong");
      }
    }}
    className="space-y-4"
  >
    {/* CUSTOMER NAME */}
    <input
      type="text"
      placeholder="Your name"
      value={customerName}
      onChange={(e) => setCustomerName(e.target.value)}
      className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none"
      required
    />

    {/* RATING */}
    <select
      value={rating}
      onChange={(e) => setRating(Number(e.target.value))}
      className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none"
    >
      <option value={5}>5 Stars</option>
      <option value={4}>4 Stars</option>
      <option value={3}>3 Stars</option>
      <option value={2}>2 Stars</option>
      <option value={1}>1 Star</option>
    </select>

    {/* REVIEW TEXT */}
    <textarea
      placeholder="Write your review..."
      value={reviewText}
      onChange={(e) => setReviewText(e.target.value)}
      rows={4}
      className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none"
      required
    />

    {/* SUBMIT BUTTON */}
    <button
      type="submit"
      className="w-full rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 py-3 font-bold text-black transition hover:scale-[1.01]"
    >
      Submit Review
    </button>
  </form>
</div>
          {/* REVIEWS LIST */}

          <div className="space-y-4">
            {reviews.length === 0 ? (
              <div className="text-muted-foreground">
                No reviews yet
              </div>
            ) : (
              reviews.map((review, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <div className="font-semibold">
                        {review.customer_name}
                      </div>

                      <div className="mt-1 flex items-center gap-1">
                        {Array.from({
                          length: review.rating,
                        }).map((_, i) => (
                          <Star
                            key={i}
                            className="h-4 w-4 fill-yellow-400 text-yellow-400"
                          />
                        ))}
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      {new Date(
                        review.created_at
                      ).toLocaleDateString()}
                    </div>
                  </div>

                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {review.review}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
}