import { X } from "lucide-react";
import type { RegionId } from "@/data/regions";
import { REGION_LABEL } from "@/data/regions";

interface RegionChipProps {
  region: RegionId | "all";
  onClear: () => void;
}

export default function RegionChip({ region, onClear }: RegionChipProps) {
  if (region === "all") {
    return (
      <span className="liquid-glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-body text-white/80">
        Showing all regions · click the globe to filter
      </span>
    );
  }
  return (
    <span className="liquid-glass inline-flex items-center gap-2 rounded-full pl-4 pr-1.5 py-1.5 text-xs font-body text-white">
      Region: <strong className="font-medium">{REGION_LABEL[region]}</strong>
      <button
        onClick={onClear}
        aria-label="Clear region filter"
        className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 transition-colors"
      >
        <X className="h-3.5 w-3.5" strokeWidth={2} />
      </button>
    </span>
  );
}
