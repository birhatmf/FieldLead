import { cn } from "@/lib/utils";
import { LEAD_STATUS_LABELS, SEARCH_STATUS_LABELS } from "@/lib/constants";
import type { LeadStatus, SearchStatus } from "@/lib/types";

const LEAD_STATUS_STYLES: Record<LeadStatus, string> = {
  NEW: "bg-secondary text-secondary-foreground",
  CONTACTED: "bg-highlight/15 text-[#1d4ed8]",
  INTERESTED: "bg-cta/15 text-[#046c4e]",
  QUOTE_SENT: "bg-amber-100 text-amber-900",
  CUSTOMER: "bg-cta text-cta-foreground",
  NOT_INTERESTED: "bg-muted text-muted-foreground",
};

const SEARCH_STATUS_STYLES: Record<SearchStatus, string> = {
  PENDING: "bg-muted text-muted-foreground",
  RUNNING: "bg-highlight/15 text-[#1d4ed8]",
  COMPLETED: "bg-cta/15 text-[#046c4e]",
  FAILED: "bg-destructive/15 text-destructive",
};

const base =
  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap";

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span className={cn(base, LEAD_STATUS_STYLES[status])}>
      {LEAD_STATUS_LABELS[status]}
    </span>
  );
}

export function SearchStatusBadge({ status }: { status: SearchStatus }) {
  return (
    <span className={cn(base, SEARCH_STATUS_STYLES[status])}>
      {SEARCH_STATUS_LABELS[status]}
    </span>
  );
}
