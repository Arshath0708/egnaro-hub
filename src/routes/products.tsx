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
  getCompanies,
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
  const currentQ = params.get("q")?.toLowerCase() ?? "";
  const currentCats = useMemo(() => params.get("categories")?.split(",").filter(Boolean) ?? [], [location.search]);
  const currentLocs = useMemo(() => params.get("locations")?.split(",").filter(Boolean) ?? [], [location.search]);
  const currentCos = useMemo(() => params.get("companies")?.split(",").filter(Boolean) ?? [], [location.search]);

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

  /* COMPANIES */
  const { data: companies = [], isLoading: isLoadingCompanies } = useQuery({
    queryKey: ["companies"],
    queryFn: getCompanies,
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

  /* NORMALIZED CITIES LIST */
  const availableCities = useMemo(() => {
    const cities = locations.map((l: any) => toTitleCase(l.city));
    return Array.from(new Set(cities)).sort((a, b) => a.localeCompare(b));
  }, [locations]);

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

    /* LOCATIONS FILTER */
    if (currentLocs.length > 0) {
      arr = arr.filter(
        (p: any) =>
          p.vendor_city &&
          currentLocs.some((loc) => loc.toLowerCase() === p.vendor_city.toLowerCase())
      );
    }

    /* COMPANIES FILTER */
    if (currentCos.length > 0) {
      arr = arr.filter(
        (p: any) =>
          p.vendor_company &&
          currentCos.some((co) => co.toLowerCase() === p.vendor_company.toLowerCase())
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
    currentLocs,
    currentCos,
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

  function handleClearAllFilters() {
    params.delete("categories");
    params.delete("locations");
    params.delete("companies");
    navigate(`/products?${params.toString()}`);
  }

  const categoryHeader = currentCats.length === 1 
    ? currentCats[0] 
    : currentCats.length > 1 
      ? "Filtered Categories" 
      : "All Products";

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
              {categoryHeader}
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
              availableCities={availableCities}
              companies={companies}
              currentCats={currentCats}
              currentLocs={currentLocs}
              currentCos={currentCos}
              currentSort={currentSort}
              isLoadingCompanies={isLoadingCompanies}
              onSortChange={handleSortChange}
              onToggleFilter={handleToggleFilter}
            />
          </div>

          {/* MAIN */}

          <div>
            {/* ACTIVE FILTER CHIPS */}
            {(currentCats.length > 0 || currentLocs.length > 0 || currentCos.length > 0) && (
              <div className="mb-6 flex flex-wrap items-center gap-2 bg-[#090d1a]/40 border border-white/5 rounded-2xl p-4 backdrop-blur-md">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 mr-2">
                  Active Filters:
                </span>
                {currentCats.map((cat) => (
                  <span
                    key={`cat-${cat}`}
                    className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary text-xs font-semibold rounded-full px-3 py-1 animate-fadeIn"
                  >
                    {cat}
                    <button
                      type="button"
                      onClick={() => handleToggleFilter("categories", cat)}
                      className="hover:bg-primary/20 rounded-full p-0.5 transition-colors cursor-pointer text-primary"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {currentLocs.map((loc) => (
                  <span
                    key={`loc-${loc}`}
                    className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary text-xs font-semibold rounded-full px-3 py-1 animate-fadeIn"
                  >
                    {loc}
                    <button
                      type="button"
                      onClick={() => handleToggleFilter("locations", loc)}
                      className="hover:bg-primary/20 rounded-full p-0.5 transition-colors cursor-pointer text-primary"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {currentCos.map((co) => (
                  <span
                    key={`co-${co}`}
                    className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary text-xs font-semibold rounded-full px-3 py-1 animate-fadeIn"
                  >
                    {co}
                    <button
                      type="button"
                      onClick={() => handleToggleFilter("companies", co)}
                      className="hover:bg-primary/20 rounded-full p-0.5 transition-colors cursor-pointer text-primary"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <button
                  type="button"
                  onClick={handleClearAllFilters}
                  className="text-xs font-bold text-gray-400 hover:text-white hover:underline transition-all cursor-pointer ml-auto"
                >
                  Clear All
                </button>
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
            <span>Filter {currentCats.length + currentLocs.length + currentCos.length > 0 ? `(${currentCats.length + currentLocs.length + currentCos.length})` : ""}</span>
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
                  availableCities={availableCities}
                  companies={companies}
                  currentCats={currentCats}
                  currentLocs={currentLocs}
                  currentCos={currentCos}
                  currentSort={currentSort}
                  isLoadingCompanies={isLoadingCompanies}
                  onSortChange={handleSortChange}
                  onToggleFilter={handleToggleFilter}
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
    availableCities,
    companies,
    currentCats,
    currentLocs,
    currentCos,
    currentSort,
    isLoadingCompanies,
    onSortChange,
    onToggleFilter,
  }: {
    categories: any[];
    availableCities: string[];
    companies: string[];
    currentCats: string[];
    currentLocs: string[];
    currentCos: string[];
    currentSort: string;
    isLoadingCompanies?: boolean;
    onSortChange: (value: string) => void;
    onToggleFilter: (type: "categories" | "locations" | "companies", value: string) => void;
  }) {
    const [locationQuery, setLocationQuery] = useState("");
    const [debouncedLocationQuery, setDebouncedLocationQuery] = useState("");
    useEffect(() => {
      const timer = setTimeout(() => setDebouncedLocationQuery(locationQuery), 150);
      return () => clearTimeout(timer);
    }, [locationQuery]);

    const [companyQuery, setCompanyQuery] = useState("");
    const [debouncedCompanyQuery, setDebouncedCompanyQuery] = useState("");
    useEffect(() => {
      const timer = setTimeout(() => setDebouncedCompanyQuery(companyQuery), 150);
      return () => clearTimeout(timer);
    }, [companyQuery]);

    const filteredCitiesList = useMemo(() => {
      const q = debouncedLocationQuery.trim().toLowerCase();
      if (!q) return availableCities;
      return availableCities.filter((city) => city.toLowerCase().includes(q));
    }, [availableCities, debouncedLocationQuery]);

    const filteredCompaniesList = useMemo(() => {
      const q = debouncedCompanyQuery.trim().toLowerCase();
      if (!q) return companies;
      return companies.filter((co) => co.toLowerCase().includes(q));
    }, [companies, debouncedCompanyQuery]);

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

        {/* CATEGORIES CARD */}
        <div className="glass rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            Categories
          </div>
          <div className="max-h-48 overflow-y-auto pr-1 scrollbar-thin space-y-2">
            {[...categories]
              .sort((a: any, b: any) => a.name.localeCompare(b.name))
              .map((c: any) => {
                const name = c.name;
                const isChecked = currentCats.includes(name);
                const id = `cat-chk-${c.id}`;
                return (
                  <div key={c.id} className="flex items-center space-x-2 py-0.5">
                    <Checkbox
                      id={id}
                      checked={isChecked}
                      onCheckedChange={() => onToggleFilter("categories", name)}
                    />
                    <label
                      htmlFor={id}
                      className="text-sm text-gray-300 hover:text-white cursor-pointer select-none truncate flex-1"
                    >
                      {name}
                    </label>
                  </div>
                );
              })}
          </div>
        </div>

        {/* LOCATIONS CARD */}
        <div className="glass rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            Locations
          </div>
          {/* Search Input */}
          <div className="flex items-center gap-2 border border-white/10 bg-white/5 rounded-lg px-2.5 py-1">
            <Search className="h-3.5 w-3.5 text-gray-500 shrink-0" />
            <input
              type="text"
              placeholder="Search locations..."
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              className="w-full bg-transparent border-0 text-xs text-white outline-none placeholder:text-gray-600"
            />
            {locationQuery && (
              <button
                type="button"
                onClick={() => setLocationQuery("")}
                className="text-gray-500 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <div className="max-h-48 overflow-y-auto pr-1 scrollbar-thin space-y-2">
            {filteredCitiesList.length === 0 ? (
              <div className="text-xs text-gray-500 py-2">No locations found</div>
            ) : (
              filteredCitiesList.map((city) => {
                const isChecked = currentLocs.includes(city);
                const id = `loc-chk-${city.replace(/\s+/g, "-")}`;
                return (
                  <div key={city} className="flex items-center space-x-2 py-0.5">
                    <Checkbox
                      id={id}
                      checked={isChecked}
                      onCheckedChange={() => onToggleFilter("locations", city)}
                    />
                    <label
                      htmlFor={id}
                      className="text-sm text-gray-300 hover:text-white cursor-pointer select-none truncate flex-1"
                    >
                      {city}
                    </label>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* COMPANIES CARD */}
        <div className="glass rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            Brand / Company
          </div>
          {/* Search Input */}
          <div className="flex items-center gap-2 border border-white/10 bg-white/5 rounded-lg px-2.5 py-1">
            <Search className="h-3.5 w-3.5 text-gray-500 shrink-0" />
            <input
              type="text"
              placeholder="Search companies..."
              value={companyQuery}
              onChange={(e) => setCompanyQuery(e.target.value)}
              className="w-full bg-transparent border-0 text-xs text-white outline-none placeholder:text-gray-600"
            />
            {companyQuery && (
              <button
                type="button"
                onClick={() => setCompanyQuery("")}
                className="text-gray-500 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <div className="max-h-48 overflow-y-auto pr-1 scrollbar-thin space-y-2">
            {isLoadingCompanies ? (
              <div className="text-xs text-gray-500 py-2">Loading companies...</div>
            ) : filteredCompaniesList.length === 0 ? (
              <div className="text-xs text-gray-500 py-2">No companies found</div>
            ) : (
              filteredCompaniesList.map((co) => {
                const isChecked = currentCos.includes(co);
                const id = `co-chk-${co.replace(/\s+/g, "-")}`;
                return (
                  <div key={co} className="flex items-center space-x-2 py-0.5">
                    <Checkbox
                      id={id}
                      checked={isChecked}
                      onCheckedChange={() => onToggleFilter("companies", co)}
                    />
                    <label
                      htmlFor={id}
                      className="text-sm text-gray-300 hover:text-white cursor-pointer select-none truncate flex-1"
                    >
                      {co}
                    </label>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </aside>
    );
  }
);