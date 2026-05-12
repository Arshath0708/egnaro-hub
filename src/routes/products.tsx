/**
 * products.tsx — Egnaro Mart Products Page
 */

import { memo, useMemo, useRef } from "react";
import {
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";

import { useQuery } from "@tanstack/react-query";

import {
  Search,
  SlidersHorizontal,
} from "lucide-react";

import { Shell } from "@/components/layout/Shell";

import {
  ProductCard,
  ProductCardSkeleton,
} from "@/components/ProductCard";

import { EmptyState } from "@/components/Section";

import {
  getProducts,
  getCategories,
} from "@/services/api";

const SORT_OPTIONS = [
  {
    value: "new",
    label: "Newest",
  },

  {
    value: "price-asc",
    label: "Price: Low to High",
  },

  {
    value: "price-desc",
    label: "Price: High to Low",
  },

  {
    value: "discount",
    label: "Biggest Discount",
  },
] as const;

export default function ProductsPage() {
  const navigate = useNavigate();

  const location = useLocation();

  const params = new URLSearchParams(
    location.search
  );

  const currentSort =
    params.get("sort") ?? "new";

  const currentCat =
    params.get("category") ?? undefined;

  const currentQ =
    params.get("q")?.toLowerCase() ?? "";

  const searchRef =
    useRef<HTMLInputElement>(null);

  /* PRODUCTS */

  const {
    data: products = [],
    isLoading,
  } = useQuery({
    queryKey: ["products"],

    queryFn: getProducts,

    staleTime: 1000 * 60 * 5,
  });

  /* CATEGORIES */

  const {
    data: categories = [],
  } = useQuery({
    queryKey: ["categories"],

    queryFn: getCategories,

    staleTime: 1000 * 60 * 10,
  });

  /* FILTER + SORT */

  const displayProducts = useMemo(() => {
    let arr = Array.isArray(products)
      ? [...products]
      : [];

    /* ONLY APPROVED */

    arr = arr.filter(
      (p: any) =>
        p &&
        (
          p.approved === true ||
          Number(p.approved) === 1 ||
          p.status === "approved"
        )
    );

    /* CATEGORY */

    if (currentCat) {
      const catObj = categories.find((c: any) => c.name.toLowerCase() === currentCat.toLowerCase());
      const catID = catObj?.id;

      arr = arr.filter(
        (p: any) =>
          p.category === currentCat || String(p.category) === String(catID)
      );
    }

    /* SEARCH */

    if (currentQ) {
      arr = arr.filter(
        (p: any) =>
          p.name
            ?.toLowerCase()
            .includes(currentQ) ||

          p.description
            ?.toLowerCase()
            .includes(currentQ) ||

          p.category
            ?.toLowerCase()
            .includes(currentQ)
      );
    }

    /* SORT */

    switch (currentSort) {
      case "price-asc":
        arr.sort(
          (a: any, b: any) =>
            Number(a.price) -
            Number(b.price)
        );
        break;

      case "price-desc":
        arr.sort(
          (a: any, b: any) =>
            Number(b.price) -
            Number(a.price)
        );
        break;

      case "discount":
        arr.sort(
          (a: any, b: any) =>
            Number(b.discount || 0) -
            Number(a.discount || 0)
        );
        break;

      default:
        break;
    }

    return arr;
  }, [
    products,
    categories,
    currentCat,
    currentQ,
    currentSort,
  ]);

  function handleSearchSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    const q =
      searchRef.current?.value.trim() ||
      "";

    if (q) {
      params.set("q", q);
    } else {
      params.delete("q");
    }

    navigate(
      `/products?${params.toString()}`
    );
  }

  function handleSortChange(
    e: React.ChangeEvent<HTMLSelectElement>
  ) {
    params.set("sort", e.target.value);

    navigate(
      `/products?${params.toString()}`
    );
  }

  const categoryName =
    categories.find(
      (c: any) => c.name === currentCat
    )?.name;

  return (
    <Shell>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

        {/* HEADER */}

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">

          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Shop
            </div>

            <h1 className="font-display text-4xl font-bold text-white">
              {categoryName ??
                "All Products"}
            </h1>

            <p className="mt-1 text-muted-foreground">
              {isLoading
                ? "Loading..."
                : `${displayProducts.length} products available`}
            </p>
          </div>

          {/* SEARCH */}

          <form
            onSubmit={handleSearchSubmit}
            className="glass flex items-center gap-2 rounded-xl p-1.5 md:w-96"
          >
            <Search className="ml-2 h-4 w-4 flex-shrink-0 text-muted-foreground" />

            <input
              ref={searchRef}
              defaultValue={
                params.get("q") ?? ""
              }
              placeholder="Search products..."
              className="flex-1 bg-transparent px-1 py-2 text-sm outline-none placeholder:text-muted-foreground"
            />

            <button
              type="submit"
              className="gradient-primary rounded-lg px-4 py-2 text-xs font-semibold text-primary-foreground"
            >
              Search
            </button>
          </form>
        </div>

        {/* LAYOUT */}

        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">

          <Sidebar
            categories={categories}
            currentCat={currentCat}
            currentSort={currentSort}
            onSortChange={
              handleSortChange
            }
          />

          {/* MAIN */}

          <div>
            {isLoading ? (
              <div className="grid grid-cols-2 gap-5 md:grid-cols-3">
                {Array.from({
                  length: 6,
                }).map((_, i) => (
                  <ProductCardSkeleton
                    key={i}
                  />
                ))}
              </div>
            ) : displayProducts.length ===
              0 ? (
              <EmptyState
                title="No products found"
                description={
                  currentQ
                    ? `No results for "${params.get(
                        "q"
                      )}". Try another search.`
                    : "Products will appear here once admin approves them."
                }
              />
            ) : (
              <div className="grid grid-cols-2 gap-5 md:grid-cols-3">
                {displayProducts.map(
                  (
                    p: any,
                    i: number
                  ) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      index={i}
                    />
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
}

/* SIDEBAR */

const Sidebar = memo(
  function Sidebar({
    categories,
    currentCat,
    currentSort,
    onSortChange,
  }: {
    categories: any[];
    currentCat?: string;
    currentSort: string;
    onSortChange: (
      e: React.ChangeEvent<HTMLSelectElement>
    ) => void;
  }) {
    return (
      <aside className="space-y-6">

        {/* CATEGORIES */}

        <div className="glass rounded-2xl p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <SlidersHorizontal className="h-4 w-4" />
            Categories
          </div>

          <ul className="space-y-1">

            <li>
              <Link
                to="/products"
                className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                  !currentCat
                    ? "bg-primary/10 font-semibold text-primary"
                    : "text-muted-foreground hover:bg-white/5"
                }`}
              >
                All Products
              </Link>
            </li>

            {categories.map(
              (c: any) => (
                <CategoryLink
                  key={c.id}
                  category={c}
                  active={
                    currentCat ===
                    c.name
                  }
                />
              )
            )}
          </ul>
        </div>

        {/* SORT */}

        <div className="glass rounded-2xl p-5">
          <div className="mb-3 text-sm font-semibold">
            Sort by
          </div>

          <select
            value={currentSort}
            onChange={onSortChange}
            className="w-full rounded-lg border border-glass-border bg-secondary px-3 py-2 text-sm outline-none"
          >
            {SORT_OPTIONS.map((o) => (
              <option
                key={o.value}
                value={o.value}
              >
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </aside>
    );
  }
);

const CategoryLink = memo(
  function CategoryLink({
    category,
    active,
  }: {
    category: {
      id: string;
      name: string;
    };

    active: boolean;
  }) {
    return (
      <li>
        <Link
          to={`/products?category=${category.name}`}
          className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
            active
              ? "bg-primary/10 font-semibold text-primary"
              : "text-muted-foreground hover:bg-white/5"
          }`}
        >
          {category.name}
        </Link>
      </li>
    );
  }
);