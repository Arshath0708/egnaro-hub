import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { ProductCard, ProductCardSkeleton } from "@/components/ProductCard";
import { EmptyState } from "@/components/Section";
import { getProducts } from "@/services/api";
import { CATEGORIES } from "@/data/seed";

type Search = { category?: string; q?: string };

export const Route = createFileRoute("/products")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    category: typeof s.category === "string" ? s.category : undefined,
    q: typeof s.q === "string" ? s.q : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Shop All — Egnaro Mart" },
      {
        name: "description",
        content: "Browse premium products across all categories.",
      },
    ],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [q, setQ] = useState(search.q ?? "");
  const [sort, setSort] = useState<"new" | "price-asc" | "price-desc" | "discount">("new");

  // ✅ Live products from backend
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      try {
        const data = await getProducts();
        setProducts(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  const sorted = useMemo(() => {
    const arr = [...products];
    if (sort === "price-asc") arr.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") arr.sort((a, b) => b.price - a.price);
    if (sort === "discount") arr.sort((a, b) => b.discount - a.discount);
    return arr;
  }, [products, sort]);

  if (loading) {
    return (
      <Shell>
        <div className="text-center py-20 text-white">Loading products...</div>
      </Shell>
    );
  }

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
              {search.category
                ? CATEGORIES.find((c) => c.id === search.category)?.name
                : "All Products"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {`${products.length} products available`}
            </p>
          </div>

          {/* Search bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              navigate({ search: { ...search, q: q || undefined } });
            }}
            className="flex items-center gap-2 glass rounded-xl p-1.5 md:w-96"
          >
            <Search className="h-4 w-4 ml-2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search products..."
              className="flex-1 bg-transparent px-1 py-2 text-sm outline-none placeholder:text-muted-foreground"
            />
            <button className="gradient-primary text-primary-foreground px-4 py-2 rounded-lg text-xs font-semibold">
              Search
            </button>
          </form>
        </div>

        {/* Layout */}
        <div className="grid lg:grid-cols-[240px_1fr] gap-8">
          {/* Sidebar */}
          <aside className="space-y-6">
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4 text-sm font-semibold">
                <SlidersHorizontal className="h-4 w-4" /> Categories
              </div>
              <ul className="space-y-1">
                <li>
                  <Link
                    to="/products"
                    search={{}}
                    className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                      !search.category
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-white/5 text-muted-foreground"
                    }`}
                  >
                    All
                  </Link>
                </li>
                {CATEGORIES.map((c) => (
                  <li key={c.id}>
                    <Link
                      to="/products"
                      search={{ category: c.id }}
                      className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                        search.category === c.id
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-white/5 text-muted-foreground"
                      }`}
                    >
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Sort */}
            <div className="glass rounded-2xl p-5">
              <div className="text-sm font-semibold mb-3">Sort by</div>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as any)}
                className="w-full bg-secondary border border-glass-border rounded-lg px-3 py-2 text-sm"
              >
                <option value="new">Newest</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="discount">Biggest Discount</option>
              </select>
            </div>
          </aside>

          {/* Main content */}
          <div>
            {sorted.length === 0 ? (
              <EmptyState
                title="No products available yet"
                description="Products will appear here once vendors add and admin approves them."
              />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                {sorted.map((p, i) => (
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
