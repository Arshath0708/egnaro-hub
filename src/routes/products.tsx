/**
 * products.tsx — Egnaro Mart Products Page
 */

import { memo, useMemo, useRef, useState } from "react";
import {
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";

import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LocationSelect } from "@/components/LocationSelect";

import {
  Search,
  SlidersHorizontal,
  X,
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
  getLocations,
} from "@/services/api";
import { sanitizeInput } from "@/lib/validation";

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

function toTitleCase(str: string): string {
  if (!str) return "";
  return str
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function ProductsPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const params = new URLSearchParams(location.search);

  const currentSort = params.get("sort") ?? "new";
  const currentCat = params.get("category") ?? undefined;
  const currentQ = params.get("q")?.toLowerCase() ?? "";

  // Normalize URL search parameters to clean Title Case
  const currentState = params.get("state") ? toTitleCase(params.get("state")!) : undefined;
  const currentCity = params.get("city") ? toTitleCase(params.get("city")!) : undefined;
  const currentTown = params.get("town") ? toTitleCase(params.get("town")!) : undefined;

  const searchRef = useRef<HTMLInputElement>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  /* PRODUCTS */
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
    staleTime: 1000 * 60 * 5,
  });

  /* CATEGORIES */
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
    staleTime: 1000 * 60 * 10,
  });

  /* CENTRAL LOCATIONS TREE INDEX */
  const { data: apiLocations = [] } = useQuery({
    queryKey: ["locations"],
    queryFn: getLocations,
    staleTime: 1000 * 60 * 10,
  });

  const locations = Array.isArray(apiLocations) ? apiLocations : [];

  /* REGIONAL NORMALIZATION */
  const normalizedProducts = useMemo(() => {
    return products.map((p: any) => {
      const isAdmin = p.created_by_type === "admin" || !p.created_by_type;
      return {
        ...p,
        vendor_state: toTitleCase(isAdmin ? "Tamil Nadu" : (p.vendor_state || "Tamil Nadu")),
        vendor_city: toTitleCase(isAdmin ? "Erode" : (p.vendor_city || "Coimbatore")),
        vendor_town: toTitleCase(isAdmin ? "Perundurai" : (p.vendor_town || "Gandhipuram")),
      };
    });
  }, [products]);

  /* 3-TIER NORMALIZED FILTER INDEX LISTS */
  const availableStates = useMemo(() => {
    const states = locations.map((l) => toTitleCase(l.state));
    return Array.from(new Set(states)).sort();
  }, [locations]);

  const availableCities = useMemo(() => {
    if (!currentState) return [];
    const cities = locations
      .filter((l) => l.state.toLowerCase() === currentState.toLowerCase())
      .map((l) => toTitleCase(l.city));
    return Array.from(new Set(cities)).sort();
  }, [locations, currentState]);

  const availableTowns = useMemo(() => {
    if (!currentState || !currentCity) return [];
    const towns = locations
      .filter(
        (l) =>
          l.state.toLowerCase() === currentState.toLowerCase() &&
          l.city.toLowerCase() === currentCity.toLowerCase()
      )
      .map((l) => toTitleCase(l.town));
    return Array.from(new Set(towns)).sort();
  }, [locations, currentState, currentCity]);

  const filteredCategories = useMemo(() => {
    return categories.filter((c: any) => {
      // Global categories (no state defined) are always visible across all locations
      if (!c.state || c.state.trim() === "") {
        return true;
      }
      // If state is selected, filter out non-matching regional categories
      if (currentState && toTitleCase(c.state).toLowerCase() !== currentState.toLowerCase()) {
        return false;
      }
      // If city is selected, filter out non-matching regional categories
      if (currentCity && c.city && toTitleCase(c.city).toLowerCase() !== currentCity.toLowerCase()) {
        return false;
      }
      return true;
    });
  }, [categories, currentState, currentCity]);

  /* PRODUCT FILTER ENGINE */
  const displayProducts = useMemo(() => {
    let arr = Array.isArray(normalizedProducts) ? [...normalizedProducts] : [];

    /* APPROVED ONLY */
    arr = arr.filter(
      (p: any) =>
        p &&
        p.status !== "rejected" &&
        p.status !== "deleted" &&
        (p.approved === true ||
          Number(p.approved) === 1 ||
          p.status === "approved")
    );

    /* STATE FILTER */
    if (currentState) {
      arr = arr.filter(
        (p: any) =>
          p.vendor_state &&
          p.vendor_state.toLowerCase() === currentState.toLowerCase()
      );
    }

    /* CITY FILTER */
    if (currentCity) {
      arr = arr.filter(
        (p: any) =>
          p.vendor_city &&
          p.vendor_city.toLowerCase() === currentCity.toLowerCase()
      );
    }

    /* TOWN FILTER */
    if (currentTown) {
      arr = arr.filter(
        (p: any) =>
          p.vendor_town &&
          p.vendor_town.toLowerCase() === currentTown.toLowerCase()
      );
    }

    /* CATEGORY FILTER */
    if (currentCat) {
      const catObj = categories.find((c: any) => c.name.toLowerCase() === currentCat.toLowerCase());
      const catID = catObj?.id;
      arr = arr.filter(
        (p: any) =>
          p.category === currentCat || String(p.category) === String(catID)
      );
    }

    /* SEARCH FILTER */
    if (currentQ) {
      const cleanQ = currentQ.replace(/\s+/g, "");
      arr = arr.filter((p: any) => {
        const nameMatch = (p.name || "").toLowerCase().replace(/\s+/g, "").includes(cleanQ);
        const descMatch = (p.description || "").toLowerCase().replace(/\s+/g, "").includes(cleanQ);
        const catMatch = (p.category || "").toLowerCase().replace(/\s+/g, "").includes(cleanQ);
        const cityMatch = (p.vendor_city || "").toLowerCase().replace(/\s+/g, "").includes(cleanQ);
        const stateMatch = (p.vendor_state || "").toLowerCase().replace(/\s+/g, "").includes(cleanQ);
        const townMatch = (p.vendor_town || "").toLowerCase().replace(/\s+/g, "").includes(cleanQ);
        return nameMatch || descMatch || catMatch || cityMatch || stateMatch || townMatch;
      });
    }

    /* SORT FILTER */
    switch (currentSort) {
      case "price-asc":
        arr.sort((a: any, b: any) => Number(a.price) - Number(b.price));
        break;
      case "price-desc":
        arr.sort((a: any, b: any) => Number(b.price) - Number(a.price));
        break;
      case "discount":
        arr.sort((a: any, b: any) => Number(b.discount || 0) - Number(a.discount || 0));
        break;
      default:
        break;
    }

    return arr;
  }, [
    normalizedProducts,
    categories,
    currentCat,
    currentQ,
    currentSort,
    currentState,
    currentCity,
    currentTown,
  ]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    let q = searchRef.current?.value.trim() || "";
    q = sanitizeInput(q);
    
    if (q) {
      params.set("q", q);
    } else {
      params.delete("q");
    }
    navigate(`/products?${params.toString()}`);
  }

  function handleSortChange(value: string) {
    params.set("sort", value);
    navigate(`/products?${params.toString()}`);
  }

  function handleStateChange(state: string) {
    if (state === "all") {
      params.delete("state");
      params.delete("city");
      params.delete("town");
      params.delete("category");
    } else {
      params.set("state", state);
      params.delete("city");
      params.delete("town");
      params.delete("category");
    }
    navigate(`/products?${params.toString()}`);
  }

  function handleCityChange(city: string) {
    if (city === "all") {
      params.delete("city");
      params.delete("town");
      params.delete("category");
    } else {
      params.set("city", city);
      params.delete("town");
      params.delete("category");
    }
    navigate(`/products?${params.toString()}`);
  }

  function handleTownChange(town: string) {
    if (town === "all") {
      params.delete("town");
      params.delete("category");
    } else {
      params.set("town", town);
      params.delete("category");
    }
    navigate(`/products?${params.toString()}`);
  }

  const categoryName = categories.find((c: any) => c.name === currentCat)?.name;

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

          <div className="hidden lg:block lg:sticky lg:top-24 lg:self-start">
            <Sidebar
              categories={categories}
              filteredCategories={filteredCategories}
              availableStates={availableStates}
              availableCities={availableCities}
              availableTowns={availableTowns}
              currentState={currentState}
              currentCity={currentCity}
              currentTown={currentTown}
              currentCat={currentCat}
              currentSort={currentSort}
              onSortChange={handleSortChange}
              onStateChange={handleStateChange}
              onCityChange={handleCityChange}
              onTownChange={handleTownChange}
            />
          </div>

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

        {/* Floating Mobile Filter Bar */}
        <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 lg:hidden">
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 font-bold text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary-hover active:scale-95 transition-[transform,border-color,background-color,color] cursor-pointer"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Filters & Sort</span>
            {(currentCat || currentState || currentCity || currentTown) && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-primary">
                {[currentCat, currentState, currentCity, currentTown].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>

        {/* Mobile Filter Drawer Overlay */}
        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-50 flex justify-end lg:hidden">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300"
              onClick={() => setMobileFiltersOpen(false)}
            />

            {/* Drawer */}
            <div className="relative w-80 max-w-[85vw] h-full bg-[#0d0d0d] border-l border-white/10 p-6 flex flex-col justify-between backdrop-blur-2xl shadow-2xl animate-fadeUp">
              <div className="space-y-6 overflow-y-auto max-h-[85vh] pr-1 scrollbar-thin">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-primary" />
                    <span className="font-display text-base font-black text-white uppercase tracking-wider animate-pulse">
                      Filter & Sort
                    </span>
                  </div>
                  <button
                    onClick={() => setMobileFiltersOpen(false)}
                    className="rounded-lg p-1.5 hover:bg-white/5 text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Location Filter on Mobile */}
                <div className="space-y-4">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    Location Filter
                  </div>
                  <div className="space-y-3">
                    <LocationSelect
                      label="State"
                      value={currentState || "all"}
                      onValueChange={(val) => handleStateChange(val === "all" ? "all" : val)}
                      options={availableStates}
                      placeholder="All States"
                      showOther={false}
                      allOptionLabel="All States"
                    />

                    <LocationSelect
                      label="City"
                      value={currentCity || "all"}
                      onValueChange={(val) => handleCityChange(val === "all" ? "all" : val)}
                      options={availableCities}
                      placeholder="All Cities"
                      disabled={!currentState}
                      showOther={false}
                      allOptionLabel="All Cities"
                    />

                    <LocationSelect
                      label="Town / Area"
                      value={currentTown || "all"}
                      onValueChange={(val) => handleTownChange(val === "all" ? "all" : val)}
                      options={availableTowns}
                      placeholder="All Towns"
                      disabled={!currentCity}
                      showOther={false}
                      allOptionLabel="All Towns"
                    />
                  </div>
                </div>

                {/* Categories filter */}
                <div className="space-y-3">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    Categories
                  </div>
                  <ul className="space-y-1">
                    <li>
                      <Link
                        to={`/products${
                          currentState || currentCity || currentTown
                            ? "?" +
                              [
                                currentState ? `state=${encodeURIComponent(currentState)}` : "",
                                currentCity ? `city=${encodeURIComponent(currentCity)}` : "",
                                currentTown ? `town=${encodeURIComponent(currentTown)}` : "",
                              ]
                                .filter(Boolean)
                                .join("&")
                            : ""
                        }`}
                        onClick={() => setMobileFiltersOpen(false)}
                        className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                          !currentCat
                            ? "bg-primary/10 font-semibold text-primary"
                            : "text-muted-foreground hover:bg-white/5"
                        }`}
                      >
                        All Categories
                      </Link>
                    </li>
                    {filteredCategories.map((c: any) => {
                      const active = currentCat === c.name;
                      const linkParams = new URLSearchParams();
                      if (currentState) linkParams.set("state", currentState);
                      if (currentCity) linkParams.set("city", currentCity);
                      if (currentTown) linkParams.set("town", currentTown);
                      linkParams.set("category", c.name);

                      return (
                        <li key={c.id}>
                          <Link
                            to={`/products?${linkParams.toString()}`}
                            onClick={() => setMobileFiltersOpen(false)}
                            className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                              active
                                ? "bg-primary/10 font-semibold text-primary"
                                : "text-muted-foreground hover:bg-white/5"
                            }`}
                          >
                            {c.name}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* Sorting */}
                <div className="space-y-3">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    Sort by
                  </div>
                  <div className="space-y-1">
                    {SORT_OPTIONS.map((o) => {
                      const active = currentSort === o.value;
                      return (
                        <button
                          key={o.value}
                          onClick={() => {
                            handleSortChange(o.value);
                            setMobileFiltersOpen(false);
                          }}
                          className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-[transform,border-color,background-color,color] cursor-pointer ${
                            active
                              ? "bg-primary/10 font-semibold text-primary"
                              : "text-muted-foreground hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          {o.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <button
                onClick={() => {
                  navigate("/products");
                  setMobileFiltersOpen(false);
                }}
                className="w-full rounded-xl bg-white/5 border border-white/10 py-3 text-center text-xs font-bold text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}

/* SIDEBAR */

const Sidebar = memo(
  function Sidebar({
    categories,
    filteredCategories,
    availableStates,
    availableCities,
    availableTowns,
    currentState,
    currentCity,
    currentTown,
    currentCat,
    currentSort,
    onSortChange,
    onStateChange,
    onCityChange,
    onTownChange,
  }: {
    categories: any[];
    filteredCategories: any[];
    availableStates: string[];
    availableCities: string[];
    availableTowns: string[];
    currentState?: string;
    currentCity?: string;
    currentTown?: string;
    currentCat?: string;
    currentSort: string;
    onSortChange: (value: string) => void;
    onStateChange: (state: string) => void;
    onCityChange: (city: string) => void;
    onTownChange: (town: string) => void;
  }) {
    const allProductsParams = new URLSearchParams();
    if (currentState) allProductsParams.set("state", currentState);
    if (currentCity) allProductsParams.set("city", currentCity);
    if (currentTown) allProductsParams.set("town", currentTown);

    return (
      <aside className="space-y-6 animate-fadeUp">

        {/* REGIONAL FILTER */}

        <div className="glass rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            Location Filter
          </div>

          {/* State Select */}
          <LocationSelect
            label="State"
            value={currentState || "all"}
            onValueChange={onStateChange}
            options={availableStates}
            placeholder="All States"
            showOther={false}
            allOptionLabel="All States"
          />

          {/* City Select */}
          <LocationSelect
            label="City"
            value={currentCity || "all"}
            onValueChange={onCityChange}
            options={availableCities}
            placeholder="All Cities"
            disabled={!currentState}
            showOther={false}
            allOptionLabel="All Cities"
          />

          {/* Town Select */}
          <LocationSelect
            label="Town / Area"
            value={currentTown || "all"}
            onValueChange={onTownChange}
            options={availableTowns}
            placeholder="All Towns"
            disabled={!currentCity}
            showOther={false}
            allOptionLabel="All Towns"
          />
        </div>

        {/* CATEGORIES */}

        <div className="glass rounded-2xl p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            Categories
          </div>

          <ul className="space-y-1 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">

            <li>
              <Link
                to={`/products${allProductsParams.toString() ? `?${allProductsParams.toString()}` : ""}`}
                className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                  !currentCat
                    ? "bg-primary/10 font-semibold text-primary"
                    : "text-muted-foreground hover:bg-white/5"
                }`}
              >
                All Categories
              </Link>
            </li>

            {filteredCategories.map(
              (c: any) => (
                <CategoryLink
                  key={c.id}
                  category={c}
                  currentState={currentState}
                  currentCity={currentCity}
                  currentTown={currentTown}
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

          <Select value={currentSort} onValueChange={onSortChange}>
            <SelectTrigger className="w-full h-9 rounded-lg border border-glass-border bg-[#0b1220]/50 px-3 text-sm outline-none text-white focus:ring-1 focus:ring-primary">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </aside>
    );
  }
);

const CategoryLink = memo(
  function CategoryLink({
    category,
    active,
    currentState,
    currentCity,
    currentTown,
  }: {
    category: {
      id: string;
      name: string;
    };
    active: boolean;
    currentState?: string;
    currentCity?: string;
    currentTown?: string;
  }) {
    const linkParams = new URLSearchParams();
    if (currentState) linkParams.set("state", currentState);
    if (currentCity) linkParams.set("city", currentCity);
    if (currentTown) linkParams.set("town", currentTown);
    linkParams.set("category", category.name);

    return (
      <li>
        <Link
          to={`/products?${linkParams.toString()}`}
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