"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Copy, Check, RefreshCw, Calendar, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToolEvents } from "@/lib/analytics";

// ─── Types ────────────────────────────────────────────────────────────────────

type Frequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
type Weekday = "SU" | "MO" | "TU" | "WE" | "TH" | "FR" | "SA";
type EndType = "forever" | "count" | "until";

interface RRuleOptions {
  freq: Frequency;
  interval: number;
  byDays: Weekday[];
  byMonthDay: number;
  byMonth: number;
  endType: EndType;
  count: number;
  until: string;
  startDate: string;
  wkst: Weekday;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const WEEKDAY_LABELS: Record<Weekday, string> = {
  SU: "Sun", MO: "Mon", TU: "Tue", WE: "Wed", TH: "Thu", FR: "Fri", SA: "Sat",
};

const WEEKDAY_FULL: Record<Weekday, string> = {
  SU: "Sunday", MO: "Monday", TU: "Tuesday", WE: "Wednesday",
  TH: "Thursday", FR: "Friday", SA: "Saturday",
};

const WEEKDAY_ORDER: Weekday[] = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// JS getDay() returns 0=Sun, 1=Mon, ..., 6=Sat
const JS_DAY_TO_WEEKDAY: Weekday[] = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
const WEEKDAY_TO_JS_DAY: Record<Weekday, number> = {
  SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6,
};

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function addMonths(date: Date, n: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}

function addYears(date: Date, n: number): Date {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + n);
  return d;
}

function toDateStr(d: Date): string {
  return d.toLocaleDateString("en-US", {
    weekday: "short", year: "numeric", month: "short", day: "numeric",
  });
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ─── RRULE builder ─────────────────────────────────────────────────────────────

function buildRRule(opts: RRuleOptions): string {
  const parts: string[] = [`FREQ=${opts.freq}`];

  if (opts.interval > 1) parts.push(`INTERVAL=${opts.interval}`);

  if (opts.freq === "WEEKLY" && opts.byDays.length > 0) {
    const sorted = [...opts.byDays].sort(
      (a, b) => WEEKDAY_TO_JS_DAY[a] - WEEKDAY_TO_JS_DAY[b]
    );
    parts.push(`BYDAY=${sorted.join(",")}`);
  }

  if (opts.freq === "MONTHLY") {
    parts.push(`BYMONTHDAY=${opts.byMonthDay}`);
  }

  if (opts.freq === "YEARLY") {
    parts.push(`BYMONTH=${opts.byMonth}`);
    parts.push(`BYMONTHDAY=${opts.byMonthDay}`);
  }

  if (opts.wkst !== "MO") parts.push(`WKST=${opts.wkst}`);

  if (opts.endType === "count" && opts.count > 0) {
    parts.push(`COUNT=${opts.count}`);
  } else if (opts.endType === "until" && opts.until) {
    parts.push(`UNTIL=${opts.until.replace(/-/g, "")}T000000Z`);
  }

  return "RRULE:" + parts.join(";");
}

// ─── Human-readable summary ────────────────────────────────────────────────────

function humanReadable(opts: RRuleOptions): string {
  const interval = opts.interval;
  let str = "Every ";

  switch (opts.freq) {
    case "DAILY":
      str += interval === 1 ? "day" : `${interval} days`;
      break;
    case "WEEKLY": {
      str += interval === 1 ? "week" : `${interval} weeks`;
      if (opts.byDays.length > 0) {
        const sorted = [...opts.byDays].sort(
          (a, b) => WEEKDAY_TO_JS_DAY[a] - WEEKDAY_TO_JS_DAY[b]
        );
        const names = sorted.map((d) => WEEKDAY_FULL[d]);
        if (names.length === 1) str += ` on ${names[0]}`;
        else str += ` on ${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
      }
      break;
    }
    case "MONTHLY":
      str += interval === 1 ? "month" : `${interval} months`;
      str += ` on the ${ordinal(opts.byMonthDay)}`;
      break;
    case "YEARLY":
      str += interval === 1 ? "year" : `${interval} years`;
      str += ` in ${MONTH_NAMES[opts.byMonth - 1]} on the ${ordinal(opts.byMonthDay)}`;
      break;
  }

  if (opts.endType === "count" && opts.count > 0) {
    str += `, ${opts.count} time${opts.count !== 1 ? "s" : ""}`;
  } else if (opts.endType === "until" && opts.until) {
    const d = new Date(opts.until + "T00:00:00");
    str += `, until ${d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`;
  }

  return str;
}

// ─── Occurrence generator ──────────────────────────────────────────────────────

function generateOccurrences(opts: RRuleOptions, previewCount: number = 10): Date[] {
  if (!opts.startDate) return [];
  const start = new Date(opts.startDate + "T00:00:00");
  if (isNaN(start.getTime())) return [];

  const until = opts.endType === "until" && opts.until
    ? new Date(opts.until + "T23:59:59")
    : null;
  const maxCount =
    opts.endType === "count" && opts.count > 0
      ? Math.min(opts.count, previewCount)
      : previewCount;

  const result: Date[] = [];
  const MAX_ITER = 5000;
  let iter = 0;

  switch (opts.freq) {
    case "DAILY": {
      let n = 0;
      while (result.length < maxCount && iter < MAX_ITER) {
        const d = addDays(start, n * opts.interval);
        if (until && d > until) break;
        result.push(d);
        n++;
        iter++;
      }
      break;
    }

    case "WEEKLY": {
      const days =
        opts.byDays.length > 0
          ? [...opts.byDays].sort((a, b) => WEEKDAY_TO_JS_DAY[a] - WEEKDAY_TO_JS_DAY[b])
          : [JS_DAY_TO_WEEKDAY[start.getDay()]];

      // Find the Monday (or WKST day) of start's week
      const wkstIdx = WEEKDAY_TO_JS_DAY[opts.wkst];
      const startDayIdx = start.getDay();
      const daysSinceWkst = (startDayIdx - wkstIdx + 7) % 7;
      let weekBoundary = addDays(start, -daysSinceWkst);

      let weekN = 0;
      while (result.length < maxCount && iter < MAX_ITER) {
        for (const day of days) {
          const jsDay = WEEKDAY_TO_JS_DAY[day];
          const offset = (jsDay - wkstIdx + 7) % 7;
          const d = addDays(weekBoundary, offset);
          if (d >= start) {
            if (until && d > until) break;
            if (result.length < maxCount) result.push(d);
          }
          iter++;
        }
        weekN++;
        weekBoundary = addDays(weekBoundary, opts.interval * 7);
      }
      break;
    }

    case "MONTHLY": {
      let n = 0;
      while (result.length < maxCount && iter < MAX_ITER) {
        const d = addMonths(start, n * opts.interval);
        d.setDate(opts.byMonthDay);
        // If setDate overflowed to next month, skip
        if (d.getDate() !== opts.byMonthDay) { n++; iter++; continue; }
        if (d >= start) {
          if (until && d > until) break;
          result.push(d);
        }
        n++;
        iter++;
      }
      break;
    }

    case "YEARLY": {
      const month = opts.byMonth;
      const day = opts.byMonthDay;
      let n = 0;
      while (result.length < maxCount && iter < MAX_ITER) {
        const d = addYears(start, n * opts.interval);
        d.setMonth(month - 1);
        d.setDate(day);
        if (d.getMonth() !== month - 1 || d.getDate() !== day) { n++; iter++; continue; }
        if (d >= start) {
          if (until && d > until) break;
          result.push(d);
        }
        n++;
        iter++;
      }
      break;
    }
  }

  return result;
}

// ─── RRULE parser ──────────────────────────────────────────────────────────────

interface ParsedRRule {
  freq?: Frequency;
  interval?: number;
  byDays?: Weekday[];
  byMonthDay?: number;
  byMonth?: number;
  count?: number;
  until?: string;
  wkst?: Weekday;
  error?: string;
}

function parseRRule(input: string): ParsedRRule {
  try {
    const str = input.trim().replace(/^RRULE:/i, "");
    const parts = str.split(";");
    const result: ParsedRRule = {};

    for (const part of parts) {
      const [key, value] = part.split("=");
      if (!key || !value) continue;
      const K = key.trim().toUpperCase();
      const V = value.trim().toUpperCase();

      switch (K) {
        case "FREQ":
          if (["DAILY", "WEEKLY", "MONTHLY", "YEARLY"].includes(V)) {
            result.freq = V as Frequency;
          }
          break;
        case "INTERVAL": {
          const n = parseInt(V, 10);
          if (!isNaN(n) && n > 0) result.interval = n;
          break;
        }
        case "COUNT": {
          const n = parseInt(V, 10);
          if (!isNaN(n) && n > 0) result.count = n;
          break;
        }
        case "UNTIL": {
          // YYYYMMDD or YYYYMMDDTHHMMSSz
          const raw = V.replace(/T.*$/, "").replace(/Z$/, "");
          if (raw.length >= 8) {
            result.until = `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
          }
          break;
        }
        case "BYDAY": {
          const days = value.split(",").map((d) => d.trim().toUpperCase());
          const valid = days.filter((d): d is Weekday =>
            ["SU", "MO", "TU", "WE", "TH", "FR", "SA"].includes(d.replace(/^[+-]?\d+/, ""))
          );
          if (valid.length > 0) result.byDays = valid as Weekday[];
          break;
        }
        case "BYMONTHDAY": {
          const n = parseInt(V, 10);
          if (!isNaN(n) && n >= 1 && n <= 31) result.byMonthDay = n;
          break;
        }
        case "BYMONTH": {
          const n = parseInt(V, 10);
          if (!isNaN(n) && n >= 1 && n <= 12) result.byMonth = n;
          break;
        }
        case "WKST": {
          const days: Weekday[] = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
          if (days.includes(V as Weekday)) result.wkst = V as Weekday;
          break;
        }
      }
    }

    if (!result.freq) return { error: "Missing FREQ — required for every RRULE." };
    return result;
  } catch {
    return { error: "Invalid RRULE string." };
  }
}

function parsedToHuman(p: ParsedRRule): string {
  if (p.error || !p.freq) return "Could not parse.";
  const opts: RRuleOptions = {
    freq: p.freq,
    interval: p.interval ?? 1,
    byDays: p.byDays ?? [],
    byMonthDay: p.byMonthDay ?? 1,
    byMonth: p.byMonth ?? 1,
    endType: p.count ? "count" : p.until ? "until" : "forever",
    count: p.count ?? 1,
    until: p.until ?? "",
    startDate: todayStr(),
    wkst: p.wkst ?? "MO",
  };
  return humanReadable(opts);
}

// ─── Components ────────────────────────────────────────────────────────────────

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to clipboard!");
      ToolEvents.resultCopied();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copy failed — please select and copy manually.");
    }
  }, [text]);

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={copy}
      className="gap-1.5 shrink-0"
      aria-label={`Copy ${label}`}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied!" : label}
    </Button>
  );
}

function OccurrenceList({ dates }: { dates: Date[] }) {
  if (dates.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        No occurrences to show — check start date and end condition.
      </p>
    );
  }
  return (
    <ol className="space-y-1.5">
      {dates.map((d, i) => (
        <li key={i} className="flex items-center gap-2 text-sm">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand/10 text-brand text-xs font-semibold shrink-0">
            {i + 1}
          </span>
          <span className="font-mono text-foreground">{toDateStr(d)}</span>
        </li>
      ))}
    </ol>
  );
}

// ─── Build Tab ─────────────────────────────────────────────────────────────────

const DEFAULT_OPTS: RRuleOptions = {
  freq: "WEEKLY",
  interval: 1,
  byDays: ["MO"],
  byMonthDay: 1,
  byMonth: 1,
  endType: "forever",
  count: 10,
  until: "",
  startDate: todayStr(),
  wkst: "MO",
};

function BuildTab() {
  const [opts, setOpts] = useState<RRuleOptions>(DEFAULT_OPTS);

  const set = useCallback(<K extends keyof RRuleOptions>(key: K, value: RRuleOptions[K]) => {
    setOpts((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleDay = useCallback((day: Weekday) => {
    setOpts((prev) => {
      const already = prev.byDays.includes(day);
      const next = already
        ? prev.byDays.filter((d) => d !== day)
        : [...prev.byDays, day];
      return { ...prev, byDays: next };
    });
  }, []);

  const rrule = useMemo(() => buildRRule(opts), [opts]);
  const summary = useMemo(() => humanReadable(opts), [opts]);
  const occurrences = useMemo(() => generateOccurrences(opts, 10), [opts]);

  const reset = useCallback(() => setOpts(DEFAULT_OPTS), []);

  return (
    <div className="space-y-6">
      {/* Form */}
      <Card className="p-6">
        <div className="space-y-5">
          {/* Frequency */}
          <div>
            <label className="block text-sm font-medium mb-2">Frequency</label>
            <div className="flex flex-wrap gap-2">
              {(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"] as Frequency[]).map((f) => (
                <button
                  key={f}
                  onClick={() => set("freq", f)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    opts.freq === f
                      ? "bg-brand text-white border-brand"
                      : "bg-background border-border hover:border-brand/50"
                  }`}
                >
                  {f.charAt(0) + f.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Interval */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Interval{" "}
              <span className="text-muted-foreground font-normal">
                — every{" "}
                <span className="text-foreground font-semibold">{opts.interval}</span>{" "}
                {opts.freq.toLowerCase()}{opts.interval !== 1 ? "s" : ""}
              </span>
            </label>
            <input
              type="range"
              min={1}
              max={30}
              value={opts.interval}
              onChange={(e) => set("interval", Number(e.target.value))}
              className="w-full accent-brand"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>1</span><span>15</span><span>30</span>
            </div>
          </div>

          {/* Days of week (weekly only) */}
          {opts.freq === "WEEKLY" && (
            <div>
              <label className="block text-sm font-medium mb-2">Days of the week</label>
              <div className="flex flex-wrap gap-2">
                {WEEKDAY_ORDER.map((day) => (
                  <button
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={`w-12 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                      opts.byDays.includes(day)
                        ? "bg-brand text-white border-brand"
                        : "bg-background border-border hover:border-brand/50"
                    }`}
                  >
                    {WEEKDAY_LABELS[day]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Day of month (monthly) */}
          {opts.freq === "MONTHLY" && (
            <div>
              <label className="block text-sm font-medium mb-2">Day of month</label>
              <select
                value={opts.byMonthDay}
                onChange={(e) => set("byMonthDay", Number(e.target.value))}
                className="w-full max-w-[180px] border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-brand/50"
              >
                {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>{ordinal(d)}</option>
                ))}
              </select>
            </div>
          )}

          {/* Month + day (yearly) */}
          {opts.freq === "YEARLY" && (
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Month</label>
                <select
                  value={opts.byMonth}
                  onChange={(e) => set("byMonth", Number(e.target.value))}
                  className="border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-brand/50"
                >
                  {MONTH_NAMES.map((m, i) => (
                    <option key={i} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Day</label>
                <select
                  value={opts.byMonthDay}
                  onChange={(e) => set("byMonthDay", Number(e.target.value))}
                  className="border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-brand/50"
                >
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>{ordinal(d)}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Start date */}
          <div>
            <label className="block text-sm font-medium mb-2">Start date</label>
            <input
              type="date"
              value={opts.startDate}
              onChange={(e) => set("startDate", e.target.value)}
              className="border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-brand/50"
            />
          </div>

          {/* End condition */}
          <div>
            <label className="block text-sm font-medium mb-2">End condition</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {(["forever", "count", "until"] as EndType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => set("endType", t)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    opts.endType === t
                      ? "bg-brand text-white border-brand"
                      : "bg-background border-border hover:border-brand/50"
                  }`}
                >
                  {t === "forever" ? "No end" : t === "count" ? "After N occurrences" : "On date"}
                </button>
              ))}
            </div>

            {opts.endType === "count" && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">After</span>
                <input
                  type="number"
                  min={1}
                  max={9999}
                  value={opts.count}
                  onChange={(e) => set("count", Math.max(1, Number(e.target.value)))}
                  className="w-24 border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-brand/50"
                />
                <span className="text-sm text-muted-foreground">occurrences</span>
              </div>
            )}

            {opts.endType === "until" && (
              <input
                type="date"
                value={opts.until}
                min={opts.startDate}
                onChange={(e) => set("until", e.target.value)}
                className="border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-brand/50"
              />
            )}
          </div>
        </div>
      </Card>

      {/* Output */}
      <div className="space-y-4">
        {/* RRULE string */}
        <Card className="p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">RRULE String</p>
              <code className="text-sm font-mono text-brand break-all">{rrule}</code>
            </div>
            <CopyButton text={rrule} label="Copy RRULE" />
          </div>
          <div className="border-t border-border/50 pt-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Summary</p>
            <p className="text-sm font-medium text-foreground">{summary}</p>
          </div>
        </Card>

        {/* Occurrences */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-brand" />
              <p className="text-sm font-medium">Next occurrences</p>
            </div>
            <Badge variant="secondary" className="text-xs">{occurrences.length} shown</Badge>
          </div>
          <OccurrenceList dates={occurrences} />
        </Card>

        {/* Reset */}
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={reset} className="gap-1.5 text-muted-foreground">
            <RefreshCw className="h-3.5 w-3.5" />
            Reset to defaults
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Parse Tab ─────────────────────────────────────────────────────────────────

const EXAMPLE_RRULES = [
  "RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR",
  "RRULE:FREQ=MONTHLY;BYMONTHDAY=15;COUNT=12",
  "RRULE:FREQ=DAILY;INTERVAL=2;UNTIL=20261231T000000Z",
  "RRULE:FREQ=YEARLY;BYMONTH=1;BYMONTHDAY=1",
  "RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=TU,TH;COUNT=20",
];

function ParseTab() {
  const [input, setInput] = useState("");
  const [submitted, setSubmitted] = useState("");

  const parsed = useMemo(() => (submitted ? parseRRule(submitted) : null), [submitted]);

  const occurrences = useMemo(() => {
    if (!parsed || parsed.error || !parsed.freq) return [];
    const opts: RRuleOptions = {
      freq: parsed.freq,
      interval: parsed.interval ?? 1,
      byDays: parsed.byDays ?? [],
      byMonthDay: parsed.byMonthDay ?? 1,
      byMonth: parsed.byMonth ?? 1,
      endType: parsed.count ? "count" : parsed.until ? "until" : "forever",
      count: parsed.count ?? 10,
      until: parsed.until ?? "",
      startDate: todayStr(),
      wkst: parsed.wkst ?? "MO",
    };
    return generateOccurrences(opts, 10);
  }, [parsed]);

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <p className="text-sm font-medium mb-3">Paste an RRULE string</p>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR"
          rows={3}
          className="w-full border border-border rounded-lg px-3 py-2 text-sm font-mono bg-background resize-none focus:outline-none focus:ring-2 focus:ring-brand/50"
        />
        <div className="flex items-center justify-between mt-3">
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLE_RRULES.map((r) => (
              <button
                key={r}
                onClick={() => { setInput(r); setSubmitted(r); }}
                className="text-xs text-brand/80 hover:text-brand border border-brand/20 hover:border-brand/50 rounded px-2 py-0.5 transition-colors"
              >
                Example {EXAMPLE_RRULES.indexOf(r) + 1}
              </button>
            ))}
          </div>
          <Button
            size="sm"
            onClick={() => setSubmitted(input)}
            disabled={!input.trim()}
            className="bg-gradient-to-r from-brand to-brand-accent text-white gap-1.5"
          >
            <ChevronRight className="h-3.5 w-3.5" />
            Parse
          </Button>
        </div>
      </Card>

      {parsed && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {parsed.error ? (
            <Card className="p-5 border-destructive/40 bg-destructive/5">
              <p className="text-sm text-destructive font-medium">{parsed.error}</p>
            </Card>
          ) : (
            <>
              {/* Summary */}
              <Card className="p-5">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-2">Meaning</p>
                <p className="text-base font-semibold text-foreground">{parsedToHuman(parsed)}</p>
              </Card>

              {/* Field breakdown */}
              <Card className="p-5">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-3">Field breakdown</p>
                <div className="space-y-2">
                  {(
                    [
                      ["FREQ", parsed.freq],
                      parsed.interval ? ["INTERVAL", String(parsed.interval)] : null,
                      parsed.byDays?.length ? ["BYDAY", parsed.byDays.join(", ")] : null,
                      parsed.byMonthDay ? ["BYMONTHDAY", String(parsed.byMonthDay)] : null,
                      parsed.byMonth ? ["BYMONTH", MONTH_NAMES[parsed.byMonth - 1]] : null,
                      parsed.count ? ["COUNT", String(parsed.count)] : null,
                      parsed.until ? ["UNTIL", parsed.until] : null,
                      parsed.wkst ? ["WKST", parsed.wkst] : null,
                    ] as ([string, string | undefined] | null)[]
                  )
                    .filter((x): x is [string, string | undefined] => x !== null)
                    .map(([k, v]) => (
                      <div key={k} className="flex items-center gap-3 text-sm">
                        <code className="w-28 shrink-0 text-xs font-mono font-semibold text-brand bg-brand/5 px-2 py-0.5 rounded">
                          {k}
                        </code>
                        <span className="text-foreground">{v}</span>
                      </div>
                    ))}
                </div>
              </Card>

              {/* Occurrences */}
              <Card className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-brand" />
                    <p className="text-sm font-medium">Next occurrences from today</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">{occurrences.length} shown</Badge>
                </div>
                <OccurrenceList dates={occurrences} />
              </Card>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}

// ─── Main export ───────────────────────────────────────────────────────────────

export function RRuleGeneratorTool() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">RRULE Generator</h2>
        <p className="text-muted-foreground text-sm">
          Build or decode RFC 5545 iCalendar recurrence rules — 100% client-side, nothing sent to any server.
        </p>
      </div>

      <Tabs defaultValue="build">
        <TabsList className="w-full mb-6">
          <TabsTrigger value="build" className="flex-1">Build RRULE</TabsTrigger>
          <TabsTrigger value="parse" className="flex-1">Parse RRULE</TabsTrigger>
        </TabsList>

        <TabsContent value="build">
          <BuildTab />
        </TabsContent>

        <TabsContent value="parse">
          <ParseTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
