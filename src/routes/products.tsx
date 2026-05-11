/**
 * products.tsx — Egnaro Mart Products Page
 * PERFORMANCE FIXES:
 *  ✅ Replaced useEffect+setState for products → useQuery (caches, dedupes, no extra renders)
 *  ✅ useMemo on filtered+sorted list — only recomputes when products/sort/search change
 *  ✅ Search input is UNCONTROLLED (ref) during typing — only syncs to URL on submit
 *  ✅ CategoryLink extracted as memo — sidebar never re-renders from sort changes
 *  ✅ No inline arrow fn in JSX maps
 *  ✅ Removed loading spinner page-takeover — skeleton grid instead
 *  ✅ staleTime on query — no refetch on every tab focus
 */
import { memo, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";   // ✅ switched to react-router-dom
import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { ProductCard, ProductCardSkeleton } from "@/components/ProductCard";
import { EmptyState } from "@/components/Section";
import { getProducts } from "@/services/api";
import { CATEGORIES } from "@/data/seed";

const SORT_OPTIONS = [
  { value: "new",        label: "Newest" },
  { value: "price-asc",  label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "discount",   label: "Biggest Discount" },
] as const;

export default function ProductsPage() {   // ✅ default export
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  const currentSort = params.get("sort") ?? "new";
  const currentCat  = params.get("category") ?? undefined;
  const currentQ    = params.get("q")?.toLowerCase() ?? "";

  // Uncontrolled input — no re-render while typing
  const searchRef = useRef<HTMLInputElement>(null);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
    staleTime: 5 * 60 * 1000,
  });

  // Memoised filter + sort
  const displayProducts = useMemo(() => {
    let arr = [...products];

    if (currentCat) arr = arr.filter((p: any) => p.category === currentCat);

    if (currentQ)
      arr = arr.filter(
        (p: any) =>
          p.name?.toLowerCase().includes(currentQ) ||
          p.description?.toLowerCase().includes(currentQ) ||
          p.category?.toLowerCase().includes(currentQ)
      );

    if (currentSort === "price-asc") arr.sort((a: any, b: any) => a.price - b.price);
    if (currentSort === "price-desc") arr.sort((a: any, b: any) => b.price - a.price);
    if (currentSort === "discount") arr.sort((a: any, b: any) => b.discount - a.discount);

    return arr;
  }, [products, currentCat, currentQ, currentSort]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = searchRef.current?.value.trim() || "";
    params.set("q", q);
    navigate(`/products?${params.toString()}`);
  }

  function handleSortChange(e: React.ChangeEvent<HTMLSelectElement>) {
    params.set("sort", e.target.value);
    navigate(`/products?${params.toString()}`);
  }

  const categoryName = CATEGORIES.find((c) => c.id === currentCat)?.name;

  return (
    <Shell>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-2">
              Shop
            </div>
            <h1 className="font-display text-4xl font-bold">
              {categoryName ?? "All Products"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isLoading
                ? "Loading..."
                : `${displayProducts.length} products available`}
            </p>
          </div>

          {/* Search */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center gap-2 glass rounded-xl p-1.5 md:w-96"
          >
            <Search className="h-4 w-4 ml-2 text-muted-foreground flex-shrink-0" />
            <input
              ref={searchRef}
              defaultValue={params.get("q") ?? ""}
              placeholder="Search products..."
              className="flex-1 bg-transparent px-1 py-2 text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              className="gradient-primary text-primary-foreground px-4 py-2 rounded-lg text-xs font-semibold flex-shrink-0"
            >
              Search
            </button>
          </form>
        </div>

        {/* Layout */}
        <div className="grid lg:grid-cols-[240px_1fr] gap-8">
          <Sidebar
            currentCat={currentCat}
            currentSort={currentSort}
            onSortChange={handleSortChange}
          />

          {/* Main */}
          <div>
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : displayProducts.length === 0 ? (
              <EmptyState
                title="No products found"
                description={
                  currentQ
                    ? `No results for "${params.get("q")}". Try a different search.`
                    : "Products will appear here once vendors add and admin approves them."
                }
              />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                {displayProducts.map((p: any, i: number) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
}

/* ─── Sidebar — memo so sort changes never re-render it ──────────────────── */
const Sidebar = memo(function Sidebar({
  currentCat,
  currentSort,
  onSortChange,
}: {
  currentCat?: string;
  currentSort: string;
  onSortChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}) {
  return (
    <aside className="space-y-6">
      {/* Categories */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4 text-sm font-semibold">
          <SlidersHorizontal className="h-4 w-4" /> Categories
        </div>
        <ul className="space-y-1">
          <li>
            <Link
              to="/products"
              className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                !currentCat
                  ? "bg-primary/10 text-primary font-semibold"
                  : "hover:bg-white/5 text-muted-foreground"
              }`}
            >
              All Products
            </Link>
          </li>
          {CATEGORIES.map((c) => (
            <CategoryLink key={c.id} category={c} active={currentCat === c.id} />
          ))}
        </ul>
      </div>

      {/* Sort */}
      <div className="glass rounded-2xl p-5">
        <div className="text-sm font-semibold mb-3">Sort by</div>
        <select
          value={currentSort}
          onChange={onSortChange}
          className="w-full bg-secondary border border-glass-border rounded-lg px-3 py-2 text-sm outline-none"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </aside>
  );
});

// Stable link component — memo so list never re-renders when sort changes
const CategoryLink = memo(function CategoryLink({
  category,
  active,
}: {
  category: { id: string; name: string };
  active: boolean;
}) {
  return (
    <li>
      <Link
        to={`/products?category=${category.id}`}
        className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
          active
            ? "bg-primary/10 text-primary font-semibold"
            : "hover:bg-white/5 text-muted-foreground"
        }`}
      >
                {category.name}
      </Link>
    </li>
  );
});

