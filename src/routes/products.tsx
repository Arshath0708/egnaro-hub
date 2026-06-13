/**
 * products.tsx — Egnaro Mart Products Page
 */

import { memo, useMemo, useRef, useState, useEffect } from "react";
import {
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useDocumentMetadata } from "@/hooks/useDocumentMetadata";

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

  const pageTitle = currentCo
    ? `${toTitleCase(currentCo)} Products`
    : currentCats.length === 1
    ? `${toTitleCase(currentCats[0])} Category`
    : "Shop Products";
  useDocumentMetadata(pageTitle, "Browse our catalog of electronics, electrical, hardware, motor pumps, and industrial products on Egnaro Mart.");

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

  /* NORMALIZED CITIES LIST BASED ON STATE & COMPANY */
  const availableCities = useMemo(() => {
    if (!currentState) return [];
    
    // Base list of products matching selected state
    let filteredProducts = normalizedProducts.filter(
      (p: any) => p.vendor_state?.toLowerCase() === currentState.toLowerCase()
    );

    // If a brand is selected, narrow the cities list down to where that brand has products
    if (currentCo) {
      filteredProducts = filteredProducts.filter(
        (p: any) => p.vendor_company?.toLowerCase() === currentCo.toLowerCase()
      );
      const fromProducts = filteredProducts.map((p: any) => toTitleCase(p.vendor_city));
      return Array.from(new Set(fromProducts)).filter(Boolean).sort((a: any, b: any) => a.localeCompare(b));
    }

    const fromLocs = locations
      .filter((l: any) => l.state?.toLowerCase() === currentState.toLowerCase())
      .map((l: any) => toTitleCase(l.city));
    const fromProducts = filteredProducts.map((p: any) => toTitleCase(p.vendor_city));
    return Array.from(new Set([...fromLocs, ...fromProducts])).filter(Boolean).sort((a: any, b: any) => a.localeCompare(b));
  }, [locations, normalizedProducts, currentState, currentCo]);

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
        p.status !== "halted" &&
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
    } else {
      params.set("city", value);
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

          {/* SEARCH INPUT ONLY */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:max-w-2xl xl:max-w-3xl">
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
                className="flex-grow bg-transparent px-1 py-2 text-sm outline-none placeholder:text-muted-foreground min-w-0"
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
          <div className="mb-8 animate-fadeIn">
            <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent p-5 sm:p-6 backdrop-blur-md shadow-lg shadow-emerald-500/5 flex items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-inner">
                  <Store className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">
                      Verified Vendor
                    </span>
                  </div>
                  <h2 className="mt-1 font-display text-xl sm:text-3xl font-black text-white tracking-wide uppercase">
                    {currentCo}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 font-medium">
                    Showing products from this company
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleCompanyChange("")}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/20 hover:border-emerald-500 text-emerald-400 hover:text-emerald-300 transition-all duration-200 cursor-pointer active:scale-90"
                title="Remove Vendor Filter"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* LAYOUT */}

        <div className="grid gap-4 sm:gap-8 lg:grid-cols-[240px_1fr]">

          <div className="hidden lg:block lg:sticky lg:top-24 lg:self-start">
            <Sidebar
              categories={categories}
              currentCats={currentCats}
              onToggleCategory={handleToggleFilter}
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
                  categories={categories}
                  currentCats={currentCats}
                  onToggleCategory={handleToggleFilter}
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
    categories,
    currentCats,
    onToggleCategory,
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
    categories: any[];
    currentCats: string[];
    onToggleCategory: (type: "categories" | "locations" | "companies", value: string) => void;
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

        {/* CATEGORIES */}
        <div className="glass rounded-2xl p-5">
          <div className="mb-3 text-sm font-semibold text-white">Categories</div>
          <div className="space-y-2.5 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            {categories.length === 0 ? (
              <div className="text-xs text-muted-foreground py-2">No categories found</div>
            ) : (
              [...categories]
                .sort((a: any, b: any) => a.name.localeCompare(b.name))
                .map((cat: any) => {
                  const isChecked = currentCats.includes(cat.name);
                  return (
                    <label
                      key={cat.id}
                      className="flex items-center gap-2.5 text-xs text-slate-300 hover:text-white cursor-pointer select-none py-0.5 group"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => onToggleCategory("categories", cat.name)}
                        className="h-4 w-4 rounded border border-white/10 bg-[#090d1a]/60 text-primary accent-primary cursor-pointer transition-all duration-200"
                      />
                      <span className={`transition-colors duration-200 ${isChecked ? "text-emerald-400 font-semibold" : "group-hover:text-slate-100"}`}>
                        {cat.name}
                      </span>
                    </label>
                  );
                })
            )}
          </div>
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
              disabled={!currentState}
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