import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Plus, AlertCircle } from "lucide-react";

interface LocationSelectProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  showOther?: boolean;
  customValue?: string;
  onCustomValueChange?: (val: string) => void;
  customPlaceholder?: string;
  helperText?: string;
  allOptionLabel?: string;
}

export function LocationSelect({
  label,
  value,
  onValueChange,
  options,
  placeholder = "Select option",
  disabled = false,
  loading = false,
  showOther = true,
  customValue = "",
  onCustomValueChange,
  customPlaceholder = "Type here...",
  helperText = "Enter your location if it is not available.",
  allOptionLabel,
}: LocationSelectProps) {
  // Deduplicate and filter out "other" or "all" values that might be in options
  const cleanOptions = React.useMemo(() => {
    const unique = Array.from(
      new Set(
        options.filter(
          (o) => o && o.toLowerCase() !== "other" && o.toLowerCase() !== "all"
        )
      )
    );
    return unique.sort();
  }, [options]);

  return (
    <div className="space-y-1.5 w-full">
      <div className="flex items-center justify-between">
        {label && (
          <label className="block text-xs font-semibold text-gray-400 tracking-wide uppercase">
            {label}
          </label>
        )}
        {loading && (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
        )}
      </div>

      <Select
        value={value || undefined}
        onValueChange={onValueChange}
        disabled={disabled || loading}
      >
        <SelectTrigger className="w-full h-11 rounded-xl border border-white/10 bg-[#090d1a]/60 backdrop-blur-md px-4 text-sm text-white placeholder:text-gray-500 shadow-lg shadow-black/20 focus:ring-1 focus:ring-primary focus:border-primary transition-all duration-200 hover:border-white/20 disabled:opacity-40 disabled:cursor-not-allowed">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="max-h-[300px] border border-white/10 bg-[#090d1a] backdrop-blur-xl shadow-2xl p-1.5">
          {allOptionLabel && (
            <>
              <SelectItem value="all" className="font-semibold text-gray-400 focus:text-white">
                {allOptionLabel}
              </SelectItem>
              <div className="my-1 h-px bg-white/5" />
            </>
          )}
          {cleanOptions.length === 0 && !loading && (
            <div className="px-3 py-4 text-center text-xs text-gray-500">
              No options available
            </div>
          )}
          {cleanOptions.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
          {showOther && (
            <>
              <div className="my-1 h-px bg-white/5" />
              <SelectItem
                value="other"
                className="font-semibold text-primary focus:bg-primary focus:text-white"
              >
                <div className="flex items-center gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  <span>Other (Enter Custom)</span>
                </div>
              </SelectItem>
            </>
          )}
        </SelectContent>
      </Select>

      <AnimatePresence initial={false}>
        {value === "other" && onCustomValueChange && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
            className="overflow-hidden"
          >
            <div className="mt-2 space-y-1">
              <input
                required
                type="text"
                placeholder={customPlaceholder}
                value={customValue}
                onChange={(e) => onCustomValueChange(e.target.value)}
                className="w-full h-11 rounded-xl border border-primary/30 bg-[#0c1224]/80 px-4 py-3 text-sm text-white placeholder:text-gray-600 shadow-inner outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200"
              />
              <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-1 pl-1">
                <AlertCircle className="h-3 w-3 text-primary" />
                <span>{helperText}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
