import * as React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, Check, ChevronsUpDown, X, Loader2, Building2 } from "lucide-react";
import { sanitizeInput } from "@/lib/validation";

interface CompanySelectProps {
  value?: string;
  onValueChange: (value: string | undefined) => void;
  options: string[];
  placeholder?: string;
  loading?: boolean;
}

export function CompanySelect({
  value,
  onValueChange,
  options,
  placeholder = "Brand / Company...",
  loading = false,
}: CompanySelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Filter and sort options alphabetically
  const filteredOptions = React.useMemo(() => {
    const cleanQuery = searchQuery.trim().toLowerCase();
    const sorted = [...options].sort((a, b) => a.localeCompare(b));
    if (!cleanQuery) return sorted;
    return sorted.filter((opt) => opt.toLowerCase().includes(cleanQuery));
  }, [options, searchQuery]);

  // Reset search query when popover opens/closes
  React.useEffect(() => {
    if (!open) {
      setSearchQuery("");
    }
  }, [open]);

  return (
    <div className="space-y-1.5 w-full">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-gray-400 tracking-wide uppercase">
          Brand / Company
        </label>
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={loading}
            className={`flex items-center justify-between w-full h-11 rounded-xl border px-4 text-sm placeholder:text-gray-500 shadow-lg shadow-black/20 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed text-left cursor-pointer ${
              value 
                ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-400 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500" 
                : "border-white/10 bg-[#090d1a]/60 backdrop-blur-md text-white focus:ring-1 focus:ring-primary focus:border-primary hover:border-white/20"
            }`}
          >
            <span className={value ? "text-emerald-400 font-medium truncate" : "text-gray-400 truncate"}>
              {value || placeholder}
            </span>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {value && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onValueChange(undefined);
                  }}
                  className="rounded-full p-0.5 hover:bg-white/10 text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              <ChevronsUpDown className="h-4 w-4 text-gray-400 shrink-0" />
            </div>
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          className="w-[var(--radix-popover-trigger-width)] min-w-[220px] border border-white/10 bg-[#090d1a] backdrop-blur-xl shadow-2xl p-2 rounded-xl"
        >
          {/* Search Box */}
          <div className="flex items-center gap-2 border border-white/10 bg-white/5 rounded-lg px-2.5 mb-2 focus-within:border-primary/50 transition-colors">
            <Search className="h-4 w-4 text-gray-500 shrink-0" />
            <input
              type="text"
              placeholder="Search companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(sanitizeInput(e.target.value))}
              className="w-full bg-transparent border-0 py-1.5 text-sm text-white outline-none placeholder:text-gray-600"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-gray-500 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Options List */}
          <div className="max-h-[220px] overflow-y-auto pr-1 scrollbar-thin space-y-0.5">
            {/* All Option */}
            {!searchQuery && (
              <button
                type="button"
                onClick={() => {
                  onValueChange(undefined);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors cursor-pointer ${
                  !value
                    ? "bg-emerald-500/10 font-semibold text-emerald-400"
                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                }`}
              >
                <span>All Companies</span>
                {!value && <Check className="h-4 w-4 text-emerald-400" />}
              </button>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-6 text-xs text-gray-500 gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span>Loading companies...</span>
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center text-xs text-gray-500 gap-1">
                <Building2 className="h-5 w-5 text-gray-600 mb-1" />
                <span>No companies found</span>
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const active = value?.toLowerCase() === opt.toLowerCase();
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      onValueChange(opt);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors cursor-pointer ${
                      active
                        ? "bg-emerald-500/10 font-semibold text-emerald-400"
                        : "text-muted-foreground hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span className="truncate">{opt}</span>
                    {active && <Check className="h-4 w-4 text-emerald-400" />}
                  </button>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
