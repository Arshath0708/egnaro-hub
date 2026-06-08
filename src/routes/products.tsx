/**
 * products.tsx — Egnaro Mart Products Page
 */

import { memo, useMemo, useRef, useState, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";

import {
  Search,
  SlidersHorizontal,
  X,
  Store,
} from "lucide-react";

import { Shell } from "@/components/layout/Shell";

import {
  ProductCard,
  ProductCardSkeleton,
} from "@/components/ProductCard";

import { EmptyState } from "@/components/Section";

import { CompanySelect } from "@/components/CompanySelect";

import {
  getProducts,
  getCategories,
  getLocations,
  getCompanies,
} from "@/services/api";
import { sanitizeInput } from "@/lib/validation";
import { queryKeys } from "@/lib/query-keys";

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
  const currentQ = params.get("q")?.toLowerCase() ?? "";
  const currentCats = useMemo(() => params.get("categories")?.split(",").filter(Boolean) ?? [], [location.search]);
  const currentState = params.get("state") ?? "";
  const currentCity = params.get("city") ?? "";
  const currentCo = params.get("company") ?? "";

  const searchRef = useRef<HTMLInputElement>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  /* PRODUCTS */
  const { data: products = [], isLoading } = useQuery({
    queryKey: queryKeys.products(),
    queryFn: getProducts,
    staleTime: 1000 * 60 * 5,
  });

  /* CATEGORIES */
  const { data: categories = [] } = useQuery({
    queryKey: queryKeys.categories(),
    queryFn: getCategories,
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60, // 60 minutes
  });

  /* CENTRAL LOCATIONS TREE INDEX */
  const { data: apiLocations = [] } = useQuery({
    queryKey: queryKeys.locations(),
    queryFn: getLocations,
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60, // 60 minutes
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

  /* NORMALIZED STATES LIST */
  const availableStates = useMemo(() => {
    const fromLocs = locations.map((l: any) => toTitleCase(l.state));
    const fromProducts = normalizedProducts.map((p: any) => toTitleCase(p.vendor_state));
    return Array.from(new Set([...fromLocs, ...fromProducts])).filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [locations, normalizedProducts]);

  /* NORMALIZED CITIES LIST BASED ON STATE */
  const availableCities = useMemo(() => {
    if (!currentState) return [];
    const fromLocs = locations
      .filter((l: any) => l.state?.toLowerCase() === currentState.toLowerCase())
      .map((l: any) => toTitleCase(l.city));
    const fromProducts = normalizedProducts
      .filter((p: any) => p.vendor_state?.toLowerCase() === currentState.toLowerCase())
      .map((p: any) => toTitleCase(p.vendor_city));
    return Array.from(new Set([...fromLocs, ...fromProducts])).filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [locations, normalizedProducts, currentState]);

  /* NORMALIZED COMPANIES LIST BASED ON STATE/CITY */
  const availableCompanies = useMemo((): string[] => {
    if (!currentState) return [];
    let filtered = normalizedProducts.filter(
      (p: any) => p.vendor_state?.toLowerCase() === currentState.toLowerCase()
    );
    if (currentCity) {
      filtered = filtered.filter(
        (p: any) => p.vendor_city?.toLowerCase() === currentCity.toLowerCase()
      );
    }
    const cos = filtered.map((p: any) => p.vendor_company as string).filter(Boolean);
    return (Array.from(new Set(cos)) as string[]).sort((a, b) => a.localeCompare(b));
  }, [normalizedProducts, currentState, currentCity]);

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

    /* CATEGORIES FILTER */
    if (currentCats.length > 0) {
      arr = arr.filter((p: any) => {
        return currentCats.some((catName) => {
          const catObj = categories.find((c: any) => c.name.toLowerCase() === catName.toLowerCase());
          const catID = catObj?.id;
          return p.category === catName || String(p.category) === String(catID);
        });
      });
    }

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

    /* COMPANIES FILTER */
    if (currentCo) {
      arr = arr.filter(
        (p: any) =>
          p.vendor_company &&
          p.vendor_company.toLowerCase() === currentCo.toLowerCase()
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
    currentCats,
    currentState,
    currentCity,
    currentCo,
    currentQ,
    currentSort,
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

  function handleToggleFilter(type: "categories" | "locations" | "companies", value: string) {
    const list = params.get(type)?.split(",").filter(Boolean) ?? [];
    const index = list.indexOf(value);
    if (index > -1) {
      list.splice(index, 1);
    } else {
      list.push(value);
    }
    
    if (list.length > 0) {
      params.set(type, list.join(","));
    } else {
      params.delete(type);
    }
    navigate(`/products?${params.toString()}`);
  }

  function handleCategoryChange(value: string) {
    if (value === "all" || !value) {
      params.delete("categories");
    } else {
      params.set("categories", value);
    }
    navigate(`/products?${params.toString()}`);
  }

  function handleStateChange(value: string) {
    if (value === "all" || !value) {
      params.delete("state");
      params.delete("city");
      params.delete("company");
    } else {
      params.set("state", value);
      params.delete("city");
      params.delete("company");
    }
    navigate(`/products?${params.toString()}`);
  }

  function handleCityChange(value: string) {
    if (value === "all" || !value) {
      params.delete("city");
      params.delete("company");
    } else {
      params.set("city", value);
      params.delete("company");
    }
    navigate(`/products?${params.toString()}`);
  }

  function handleCompanyChange(value: string) {
    if (value === "all" || !value) {
      params.delete("company");
    } else {
      params.set("company", value);
    }
    navigate(`/products?${params.toString()}`);
  }

  function handleClearAllFilters() {
    params.delete("categories");
    params.delete("state");
    params.delete("city");
    params.delete("company");
    navigate(`/products?${params.toString()}`);
  }

  const categoryHeader = currentCats.length === 1 
    ? currentCats[0] 
    : currentCats.length > 1 
      ? "Filtered Categories" 
      : "All Products";

  return (
    <Shell>
      <div className="mx-auto max-w-7xl px-4 py-5 sm:py-10 sm:px-6 lg:px-8">

        {/* HEADER */}

        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">

          <div className="shrink-0">
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Shop
            </div>

            <h1 className="font-display text-4xl font-bold text-white">
              {categoryHeader}
            </h1>

            <p className="mt-1 text-muted-foreground">
              {isLoading
                ? "Loading..."
                : `${displayProducts.length} products available`}
            </p>
          </div>

          {/* SEARCH & CATEGORY SELECTOR */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:max-w-2xl xl:max-w-3xl">
            {/* CATEGORIES SELECT */}
            <div className="w-full sm:w-48 shrink-0">
              <Select value={currentCats[0] || "all"} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-full h-[46px] rounded-xl border border-glass-border bg-[#0b1220]/50 px-3.5 text-sm outline-none text-white focus:ring-1 focus:ring-primary backdrop-blur-md">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {[...categories]
                    .sort((a: any, b: any) => a.name.localeCompare(b.name))
                    .map((c: any) => (
                      <SelectItem key={c.id} value={c.name}>
                        {c.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* SEARCH INPUT */}
            <form
              onSubmit={handleSearchSubmit}
              className="glass flex-1 flex items-center gap-2 rounded-xl p-1.5 min-w-0"
            >
              <Search className="ml-2.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />

              <input
                ref={searchRef}
                defaultValue={
                  params.get("q") ?? ""
                }
                placeholder="Search products..."
                className="flex-1 bg-transparent px-1 py-2 text-sm outline-none placeholder:text-muted-foreground min-w-0"
              />

              <button
                type="submit"
                className="gradient-primary rounded-lg px-5 py-2.5 text-xs font-semibold text-primary-foreground shrink-0 cursor-pointer"
              >
                Search
              </button>
            </form>
          </div>
        </div>

        {/* SELECTED VENDOR DISPLAY */}
        {currentCo && (
          <div className="mb-6 flex items-center animate-fadeIn">
            <div className="inline-flex items-center gap-2.5 text-emerald-400">
              <span className="font-display text-lg sm:text-2xl font-semibold sm:font-bold tracking-tight text-emerald-400 truncate max-w-[280px] sm:max-w-2xl">
                {currentCo}
              </span>
              <button
                type="button"
                onClick={() => handleCompanyChange("")}
                className="rounded-full p-1 hover:bg-emerald-500/10 text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer shrink-0"
                title="Remove Vendor Filter"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>
          </div>
        )}

        {/* LAYOUT */}

        <div className="grid gap-4 sm:gap-8 lg:grid-cols-[240px_1fr]">

          <div className="hidden lg:block lg:sticky lg:top-24 lg:self-start">
            <Sidebar
              availableStates={availableStates}
              availableCities={availableCities}
              availableCompanies={availableCompanies}
              currentState={currentState}
              currentCity={currentCity}
              currentCo={currentCo}
              currentSort={currentSort}
              onSortChange={handleSortChange}
              onStateChange={handleStateChange}
              onCityChange={handleCityChange}
              onCompanyChange={handleCompanyChange}
              onClearAll={handleClearAllFilters}
              hasActiveFilters={currentCats.length > 0 || !!currentState || !!currentCity || !!currentCo}
            />
          </div>

          {/* MAIN */}

          <div>
            {/* ACTIVE FILTER CHIPS */}
            {(currentCats.length > 0 || currentState || currentCity || currentCo) && (
              <div className="mb-4 sm:mb-6 flex flex-wrap items-center gap-1.5 sm:gap-2 bg-[#090d1a]/40 border border-white/5 rounded-2xl p-2.5 sm:p-4 backdrop-blur-md">
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500 mr-1.5 sm:mr-2">
                  Active Filters:
                </span>
                {currentCats.map((cat) => (
                  <span
                    key={`cat-${cat}`}
                    className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 text-slate-300 text-[10px] sm:text-xs font-medium rounded-full px-2.5 py-0.5 sm:px-3 sm:py-1 animate-fadeIn shadow-sm"
                  >
                    {cat}
                    <button
                      type="button"
                      onClick={() => handleToggleFilter("categories", cat)}
                      className="hover:bg-white/10 rounded-full p-0.5 transition-colors cursor-pointer text-slate-400 hover:text-white"
                    >
                      <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    </button>
                  </span>
                ))}
                {currentState && (
                  <span
                    key={`state-${currentState}`}
                    className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 text-slate-300 text-[10px] sm:text-xs font-medium rounded-full px-2.5 py-0.5 sm:px-3 sm:py-1 animate-fadeIn shadow-sm"
                  >
                    State: {currentState}
                    <button
                      type="button"
                      onClick={() => handleStateChange("")}
                      className="hover:bg-white/10 rounded-full p-0.5 transition-colors cursor-pointer text-slate-400 hover:text-white"
                    >
                      <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    </button>
                  </span>
                )}
                {currentCity && (
                  <span
                    key={`city-${currentCity}`}
                    className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 text-slate-300 text-[10px] sm:text-xs font-medium rounded-full px-2.5 py-0.5 sm:px-3 sm:py-1 animate-fadeIn shadow-sm"
                  >
                    City: {currentCity}
                    <button
                      type="button"
                      onClick={() => handleCityChange("")}
                      className="hover:bg-white/10 rounded-full p-0.5 transition-colors cursor-pointer text-slate-400 hover:text-white"
                    >
                      <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    </button>
                  </span>
                )}
                {currentCo && (
                  <span
                    key={`co-${currentCo}`}
                    className="inline-flex items-center gap-1.5 bg-emerald-500/15 border-2 border-emerald-500/50 text-emerald-400 text-[11px] sm:text-sm font-bold rounded-full px-3 py-1 sm:px-4 sm:py-1.5 animate-fadeIn shadow-md shadow-emerald-500/10"
                    title={currentCo}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    <span className="max-w-[150px] truncate sm:max-w-xs md:max-w-md inline-block align-bottom">
                      Company: {currentCo}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCompanyChange("")}
                      className="hover:bg-emerald-500/20 rounded-full p-0.5 transition-colors cursor-pointer text-emerald-400"
                    >
                      <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    </button>
                  </span>
                )}
              </div>
            )}
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
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className="flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 font-bold text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary-hover active:scale-95 transition-[transform,border-color,background-color,color] cursor-pointer"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Filter {currentCats.length + (currentState ? 1 : 0) + (currentCity ? 1 : 0) + (currentCo ? 1 : 0) > 0 ? `(${currentCats.length + (currentState ? 1 : 0) + (currentCity ? 1 : 0) + (currentCo ? 1 : 0)})` : ""}</span>
          </button>
        </div>

        {/* Mobile Filter Drawer Overlay */}
        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-50 flex justify-end lg:hidden animate-fadeIn">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300"
              onClick={() => setMobileFiltersOpen(false)}
            />

            {/* Drawer */}
            <div className="relative w-80 max-w-[85vw] h-full bg-[#0d0d0d] border-l border-white/10 p-6 flex flex-col justify-between backdrop-blur-2xl shadow-2xl animate-fadeUp">
              <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-primary" />
                    <span className="font-display text-base font-black text-white uppercase tracking-wider">
                      Filter & Sort
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileFiltersOpen(false)}
                    className="rounded-lg p-1.5 hover:bg-white/5 text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Sidebar filters rendered inside the mobile drawer */}
                <Sidebar
                  availableStates={availableStates}
                  availableCities={availableCities}
                  availableCompanies={availableCompanies}
                  currentState={currentState}
                  currentCity={currentCity}
                  currentCo={currentCo}
                  currentSort={currentSort}
                  onSortChange={handleSortChange}
                  onStateChange={handleStateChange}
                  onCityChange={handleCityChange}
                  onCompanyChange={handleCompanyChange}
                  onClearAll={handleClearAllFilters}
                  hasActiveFilters={currentCats.length > 0 || !!currentState || !!currentCity || !!currentCo}
                />
              </div>

              {/* Drawer Footer */}
              <div className="mt-4 pt-4 border-t border-white/5 space-y-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="w-full rounded-xl bg-primary py-3 text-center text-xs font-bold text-primary-foreground hover:bg-primary-hover transition-colors cursor-pointer"
                >
                  Apply Filters
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleClearAllFilters();
                    setMobileFiltersOpen(false);
                  }}
                  className="w-full rounded-xl bg-white/5 border border-white/10 py-3 text-center text-xs font-bold text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Clear All Filters
                </button>
              </div>
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
    availableStates,
    availableCities,
    availableCompanies,
    currentState,
    currentCity,
    currentCo,
    currentSort,
    onSortChange,
    onStateChange,
    onCityChange,
    onCompanyChange,
    onClearAll,
    hasActiveFilters,
  }: {
    availableStates: string[];
    availableCities: string[];
    availableCompanies: string[];
    currentState: string;
    currentCity: string;
    currentCo: string;
    currentSort: string;
    onSortChange: (value: string) => void;
    onStateChange: (value: string) => void;
    onCityChange: (value: string) => void;
    onCompanyChange: (value: string) => void;
    onClearAll: () => void;
    hasActiveFilters: boolean;
  }) {
    return (
      <aside className="space-y-6 animate-fadeUp">
        {/* SORT */}
        <div className="glass rounded-2xl p-5">
          <div className="mb-3 text-sm font-semibold text-white">Sort by</div>
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

        {/* LOCATION & BRAND CARD */}
        <div className="glass rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white border-b border-white/5 pb-2">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            Location & Brand
          </div>

          {/* STATE */}
          <div className="space-y-1.5">
            <label className="text-xs text-gray-400 font-medium">State</label>
            <Select value={currentState || "all"} onValueChange={onStateChange}>
              <SelectTrigger className={`w-full h-9 rounded-lg border px-3 text-sm outline-none transition-colors ${
                currentState && currentState !== "all"
                  ? "border-white/20 bg-white/5 text-slate-200 focus:ring-1 focus:ring-primary"
                  : "border-glass-border bg-[#0b1220]/50 text-white focus:ring-1 focus:ring-primary"
              }`}>
                <div className="flex items-center gap-1.5 truncate">
                  {currentState && currentState !== "all" && (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                  )}
                  <SelectValue placeholder="All States" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {availableStates.map((st) => (
                  <SelectItem key={st} value={st}>
                    {st}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* CITY */}
          <div className="space-y-1.5">
            <label className="text-xs text-gray-400 font-medium">City</label>
            <Select 
              value={currentCity || "all"} 
              onValueChange={onCityChange}
              disabled={!currentState}
            >
              <SelectTrigger className={`w-full h-9 rounded-lg border px-3 text-sm outline-none transition-colors disabled:opacity-50 ${
                currentCity && currentCity !== "all"
                  ? "border-white/20 bg-white/5 text-slate-200 focus:ring-1 focus:ring-primary"
                  : "border-glass-border bg-[#0b1220]/50 text-white focus:ring-1 focus:ring-primary"
              }`}>
                <div className="flex items-center gap-1.5 truncate">
                  {currentCity && currentCity !== "all" && (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                  )}
                  <SelectValue placeholder={currentState ? "All Cities" : "Select a State first"} />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {availableCities.map((ct) => (
                  <SelectItem key={ct} value={ct}>
                    {ct}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* BRAND / COMPANY */}
          <div className="space-y-1.5">
            <CompanySelect
              value={currentCo || undefined}
              onValueChange={(val) => onCompanyChange(val || "all")}
              options={availableCompanies}
              placeholder={currentState ? "All Brands" : "Select a State first"}
              loading={false}
            />
          </div>
        </div>

        {/* CLEAR ALL BUTTON (DESKTOP ONLY) */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearAll}
            className="hidden lg:block w-full rounded-xl bg-white/5 border border-white/10 py-2.5 text-center text-xs font-bold text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer select-none"
          >
            Clear All Filters
          </button>
        )}
      </aside>
    );
  }
);