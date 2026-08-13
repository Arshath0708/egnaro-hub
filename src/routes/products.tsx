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
  ChevronRight,
  ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  const currentSubcats = useMemo(() => params.get("subcategories")?.split(",").filter(Boolean) ?? [], [location.search]);
  const currentSubSubcats = useMemo(() => params.get("sub_subcategories")?.split(",").filter(Boolean) ?? [], [location.search]);
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

    /* CATEGORIES & SUBCATEGORIES FILTER */
    if (currentCats.length > 0 || currentSubcats.length > 0 || currentSubSubcats.length > 0) {
      arr = arr.filter((p: any) => {
        const matchCat = currentCats.some((catName) => {
          const catObj = categories.find((c: any) => c.name.toLowerCase() === catName.toLowerCase());
          const catID = catObj?.id;
          return p.category === catName || String(p.category) === String(catID);
        });

        const matchSub = currentSubcats.some((subId) => {
          return String(p.subcategory_id) === String(subId);
        });

        const matchSubSub = currentSubSubcats.some((subSubId) => {
          return String(p.sub_subcategory_id) === String(subSubId);
        });

        return matchCat || matchSub || matchSubSub;
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
    currentSubcats,
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

  function handleToggleSubcategory(value: string) {
    const list = params.get("subcategories")?.split(",").filter(Boolean) ?? [];
    const index = list.indexOf(value);
    if (index > -1) {
      list.splice(index, 1);
    } else {
      list.push(value);
    }
    
    if (list.length > 0) {
      params.set("subcategories", list.join(","));
    } else {
      params.delete("subcategories");
    }
    navigate(`/products?${params.toString()}`);
  }

  function handleToggleSubSubcategory(value: string) {
    const list = params.get("sub_subcategories")?.split(",").filter(Boolean) ?? [];
    const index = list.indexOf(value);
    if (index > -1) {
      list.splice(index, 1);
    } else {
      list.push(value);
    }
    
    if (list.length > 0) {
      params.set("sub_subcategories", list.join(","));
    } else {
      params.delete("sub_subcategories");
    }
    navigate(`/products?${params.toString()}`);
  }

  function handleClearAllFilters() {
    params.delete("categories");
    params.delete("subcategories");
    params.delete("sub_subcategories");
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

        <div className="grid gap-4 sm:gap-8 lg:grid-cols-[340px_1fr]">

          <div className="hidden lg:block lg:sticky lg:top-24 lg:self-start">
            <Sidebar
              products={normalizedProducts}
              categories={categories}
              currentCats={currentCats}
              currentSubcats={currentSubcats}
              currentSubSubcats={currentSubSubcats}
              onToggleCategory={handleToggleFilter}
              onToggleSubcategory={handleToggleSubcategory}
              onToggleSubSubcategory={handleToggleSubSubcategory}
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
              hasActiveFilters={currentCats.length > 0 || currentSubcats.length > 0 || currentSubSubcats.length > 0 || !!currentState || !!currentCity || !!currentCo}
            />
          </div>

          {/* MAIN */}

          <div>
            {isLoading ? (
              <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 xl:grid-cols-4">
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
                <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 xl:grid-cols-4">
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
            <span>Filter {currentCats.length + currentSubcats.length + (currentState ? 1 : 0) + (currentCity ? 1 : 0) + (currentCo ? 1 : 0) > 0 ? `(${currentCats.length + currentSubcats.length + (currentState ? 1 : 0) + (currentCity ? 1 : 0) + (currentCo ? 1 : 0)})` : ""}</span>
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
                  products={normalizedProducts}
                  categories={categories}
                  currentCats={currentCats}
                  currentSubcats={currentSubcats}
                  currentSubSubcats={currentSubSubcats}
                  onToggleCategory={handleToggleFilter}
                  onToggleSubcategory={handleToggleSubcategory}
                  onToggleSubSubcategory={handleToggleSubSubcategory}
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
                  hasActiveFilters={currentCats.length > 0 || currentSubcats.length > 0 || currentSubSubcats.length > 0 || !!currentState || !!currentCity || !!currentCo}
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
    products = [],
    categories,
    currentCats,
    currentSubcats,
    currentSubSubcats,
    onToggleCategory,
    onToggleSubcategory,
    onToggleSubSubcategory,
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
    products?: any[];
    categories: any[];
    currentCats: string[];
    currentSubcats: string[];
    currentSubSubcats: string[];
    onToggleCategory: (type: "categories" | "locations" | "companies", value: string) => void;
    onToggleSubcategory: (value: string) => void;
    onToggleSubSubcategory: (value: string) => void;
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
    const [catSearch, setCatSearch] = useState("");
    const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});
    const [expandedSubcats, setExpandedSubcats] = useState<Record<string, boolean>>({});

    const toggleExpandSubcat = (subId: string) => {
      setExpandedSubcats(prev => ({ ...prev, [subId]: !prev[subId] }));
    };

    const categoryCounts = useMemo(() => {
      const counts: Record<string, number> = {};
      categories.forEach((cat: any) => {
        let count = 0;
        products.forEach((p: any) => {
          if (
            p.category === cat.name ||
            String(p.category) === String(cat.id)
          ) {
            count++;
          }
        });
        counts[cat.name] = count;
      });
      return counts;
    }, [products, categories]);

    const subcategoryCounts = useMemo(() => {
      const counts: Record<string, number> = {};
      categories.forEach((cat: any) => {
        const subcats = cat.subcategories || [];
        subcats.forEach((sub: any) => {
          let count = 0;
          products.forEach((p: any) => {
            if (String(p.subcategory_id) === String(sub.id)) {
              count++;
            }
          });
          counts[String(sub.id)] = count;
        });
      });
      return counts;
    }, [products, categories]);

    const subSubcategoryCounts = useMemo(() => {
      const counts: Record<string, number> = {};
      categories.forEach((cat: any) => {
        const subcats = cat.subcategories || [];
        subcats.forEach((sub: any) => {
          const subsubs = sub.sub_subcategories || [];
          subsubs.forEach((subsub: any) => {
            let count = 0;
            products.forEach((p: any) => {
              if (String(p.sub_subcategory_id) === String(subsub.id)) {
                count++;
              }
            });
            counts[String(subsub.id)] = count;
          });
        });
      });
      return counts;
    }, [products, categories]);

    useEffect(() => {
      const nextCats = { ...expandedCats };
      const nextSubs = { ...expandedSubcats };
      let catsChanged = false;
      let subsChanged = false;

      categories.forEach((cat: any) => {
        const isCatChecked = currentCats.includes(cat.name);
        const subcats = cat.subcategories || [];
        const hasActiveSubcat = subcats.some((sub: any) => currentSubcats.includes(String(sub.id)));
        const hasActiveSubSubcat = subcats.some((sub: any) => {
          const subsubs = sub.sub_subcategories || [];
          return subsubs.some((subsub: any) => currentSubSubcats.includes(String(subsub.id)));
        });
        
        if ((isCatChecked || hasActiveSubcat || hasActiveSubSubcat) && !nextCats[cat.name]) {
          nextCats[cat.name] = true;
          catsChanged = true;
        }

        subcats.forEach((sub: any) => {
          const isSubChecked = currentSubcats.includes(String(sub.id));
          const subsubs = sub.sub_subcategories || [];
          const hasActiveSubSub = subsubs.some((subsub: any) => currentSubSubcats.includes(String(subsub.id)));
          
          if ((isSubChecked || hasActiveSubSub) && !nextSubs[String(sub.id)]) {
            nextSubs[String(sub.id)] = true;
            subsChanged = true;
          }
        });
      });

      if (catsChanged) {
        setExpandedCats(nextCats);
      }
      if (subsChanged) {
        setExpandedSubcats(nextSubs);
      }
    }, [currentCats, currentSubcats, currentSubSubcats, categories]);

    const expandAll = () => {
      const nextCats: Record<string, boolean> = {};
      const nextSubs: Record<string, boolean> = {};
      categories.forEach((cat: any) => {
        nextCats[cat.name] = true;
        const subcats = cat.subcategories || [];
        subcats.forEach((sub: any) => {
          nextSubs[String(sub.id)] = true;
        });
      });
      setExpandedCats(nextCats);
      setExpandedSubcats(nextSubs);
    };

    const collapseAll = () => {
      setExpandedCats({});
      setExpandedSubcats({});
    };

    const toggleExpand = (catName: string) => {
      setExpandedCats(prev => ({ ...prev, [catName]: !prev[catName] }));
    };


    const filteredCats = categories
      .filter((cat: any) => {
        const matchesCat = cat.name.toLowerCase().includes(catSearch.toLowerCase());
        const matchesSub = (cat.subcategories || []).some((sub: any) => sub.name.toLowerCase().includes(catSearch.toLowerCase()));
        return matchesCat || matchesSub;
      })
      .sort((a: any, b: any) => a.name.localeCompare(b.name));

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

        {/* CATEGORIES & SUBCATEGORIES ACCORDION PANEL */}
        <div className="glass rounded-2xl p-5 space-y-4">
          <div className="flex flex-col gap-2">
            <div className="text-sm font-semibold text-white">Categories</div>
            
            {/* Search Input */}
            <div className="relative group">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Search categories..."
                value={catSearch}
                onChange={(e) => setCatSearch(e.target.value)}
                className="w-full h-8 pl-8 pr-7 text-xs text-white bg-slate-950/40 border border-white/10 rounded-lg outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 placeholder:text-gray-600 transition-all"
              />
              {catSearch && (
                <button 
                  type="button" 
                  onClick={() => setCatSearch("")} 
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Expand / Collapse Controls */}
            {categories.length > 0 && (
              <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-1 px-0.5">
                <button type="button" onClick={expandAll} className="hover:text-primary transition-colors cursor-pointer">Expand All</button>
                <span>•</span>
                <button type="button" onClick={collapseAll} className="hover:text-primary transition-colors cursor-pointer">Collapse All</button>
              </div>
            )}
          </div>

          <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1.5 custom-scrollbar">
            {filteredCats.length === 0 ? (
              <div className="text-xs text-muted-foreground py-2 text-center">No categories match search</div>
            ) : (
              filteredCats.map((cat: any) => {
                const isCatChecked = currentCats.includes(cat.name);
                const subcats = cat.subcategories || [];
                const isExpanded = !!expandedCats[cat.name];
                const count = categoryCounts[cat.name] || 0;

                return (
                  <div 
                    key={cat.id} 
                    className={`rounded-xl border transition-all duration-300 overflow-hidden ${
                      isCatChecked 
                        ? "border-primary bg-slate-950/80 shadow-[0_0_15px_rgba(255,107,0,0.15)]" 
                        : "border-white/5 bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/10"
                    }`}
                  >
                    {/* Header trigger */}
                    <div className="flex items-center justify-between group">
                      {/* Left: Category name & count */}
                      <div 
                        onClick={() => onToggleCategory("categories", cat.name)}
                        className="flex items-center gap-2 flex-1 cursor-pointer select-none py-3.5 pl-3.5 min-w-0"
                      >
                         <span className={`text-xs uppercase tracking-wider font-display font-black transition-colors ${
                           isCatChecked ? "text-primary" : "text-green-400 group-hover:text-green-300"
                         }`}>
                           {cat.name}
                         </span>

                        <span className="text-[10px] text-gray-500 font-mono font-semibold">
                          ({count})
                        </span>
                      </div>

                      {/* Right: expansion chevron */}
                      <div 
                        onClick={() => toggleExpand(cat.name)}
                        className="flex items-center justify-center p-3.5 cursor-pointer hover:bg-white/5 transition-colors shrink-0"
                      >
                        <ChevronDown className={`h-3.5 w-3.5 text-gray-500 transition-transform duration-300 ${
                          isExpanded ? "rotate-180 text-gray-300" : ""
                        }`} />
                      </div>
                    </div>

                    {/* Animated subcategories panel */}
                    <AnimatePresence initial={false}>
                      {isExpanded && subcats.length > 0 && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-white/5 bg-slate-950/20 px-3.5 py-2 space-y-2">
                            {subcats.map((sub: any) => {
                              const isSubChecked = currentSubcats.includes(String(sub.id));
                              const subCount = subcategoryCounts[String(sub.id)] || 0;
                              const subsubs = sub.sub_subcategories || [];

                              return (
                                <div key={sub.id} className="space-y-1">
                                  {/* Subcategory Row */}
                                  <div className="flex items-center justify-between border-l border-white/10 hover:border-primary/50 group transition-all duration-150 rounded hover:bg-white/[0.02]">
                                    <div 
                                      onClick={() => onToggleSubcategory(String(sub.id))}
                                      className="flex items-center gap-2 flex-1 cursor-pointer select-none py-1.5 pl-3 min-w-0"
                                    >
                                      {isSubChecked && (
                                        <svg className="h-3 w-3 text-primary shrink-0 animate-fadeIn" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4.5">
                                          <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                      )}

                                       <span className={`text-[11px] transition-colors truncate ${
                                         isSubChecked ? "text-white font-bold" : "text-green-400 group-hover:text-green-300"
                                       }`}>
                                         {sub.name}
                                       </span>

                                      <span className="text-[10px] text-gray-500 font-mono font-semibold">
                                        ({subCount})
                                      </span>
                                    </div>

                                    {subsubs.length > 0 && (
                                      <div 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleExpandSubcat(String(sub.id));
                                        }}
                                        className="flex items-center justify-center p-1.5 cursor-pointer hover:bg-white/5 transition-colors shrink-0 rounded"
                                      >
                                        <ChevronDown className={`h-3.5 w-3.5 text-gray-500 transition-transform duration-300 ${
                                          expandedSubcats[String(sub.id)] ? "rotate-180 text-gray-300" : ""
                                        }`} />
                                      </div>
                                    )}
                                  </div>

                                  {/* Sub-subcategories List */}
                                  {subsubs.length > 0 && expandedSubcats[String(sub.id)] && (
                                    <div className="pl-5 space-y-1 mt-0.5">
                                      {subsubs.map((subsub: any) => {
                                        const isSubSubChecked = currentSubSubcats.includes(String(subsub.id));
                                        const subSubCount = subSubcategoryCounts[String(subsub.id)] || 0;

                                        return (
                                          <div 
                                            key={subsub.id}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onToggleSubSubcategory(String(subsub.id));
                                            }}
                                            className="flex items-center justify-between pl-3.5 border-l border-white/5 hover:border-amber-500/50 py-1.5 cursor-pointer select-none group transition-all duration-150"
                                          >
                                            <div className="flex items-center gap-2 min-w-0">
                                              {isSubSubChecked && (
                                                <svg className="h-2.5 w-2.5 text-amber-500 shrink-0 animate-fadeIn" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4.5">
                                                  <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                              )}
                                              <span className={`text-[10px] transition-colors ${
                                                isSubSubChecked ? "text-amber-500 font-bold" : "text-green-400 group-hover:text-green-300"
                                              }`}>
                                                {subsub.name}
                                              </span>
                                            </div>
                                            <span className="text-[9px] text-gray-650 font-mono font-semibold pr-1">
                                              ({subSubCount})
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
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