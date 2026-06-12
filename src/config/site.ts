export const siteConfig = {
  name: "RRULE Generator",
  title: "RRULE Generator — Build & Parse Recurring Calendar Event Rules",
  description:
    "Free online RRULE generator and parser for RFC 5545 iCalendar recurrence rules. Build recurring event schedules visually, preview next occurrences, and decode any RRULE string instantly.",
  url: "https://rrule-generator.tools.jagodana.com",
  ogImage: "/opengraph-image",

  headerIcon: "CalendarDays",
  brandAccentColor: "#6366f1",

  keywords: [
    "rrule generator",
    "ical recurrence rule",
    "rfc 5545 rrule",
    "recurring calendar events",
    "icalendar rrule builder",
    "rrule parser",
    "cron to rrule",
    "google calendar recurrence",
    "rrule string generator",
    "recurring event scheduler",
  ],
  applicationCategory: "DeveloperApplication",

  themeColor: "#3b82f6",

  creator: "Jagodana",
  creatorUrl: "https://jagodana.com",
  twitterHandle: "@jagodana",

  socialProfiles: [
    "https://twitter.com/jagodana",
  ],

  links: {
    github: "https://github.com/Jagodana-Studio-Private-Limited/rrule-generator",
    website: "https://jagodana.com",
  },

  footer: {
    about:
      "RRULE Generator helps developers build and decode RFC 5545 iCalendar recurrence rules — the standard used by Google Calendar, Outlook, and every major calendar API.",
    featuresTitle: "Features",
    features: [
      "Visual RRULE builder",
      "Human-readable summary",
      "Next occurrences preview",
      "Parse & decode RRULE strings",
    ],
  },

  hero: {
    badge: "RFC 5545 iCalendar Recurrence Rules",
    titleLine1: "Build Recurring Events",
    titleGradient: "Without Guessing RRULE Syntax",
    subtitle:
      "Set frequency, interval, days, and end conditions visually — get a copy-ready RRULE string plus a plain-English summary and a preview of upcoming dates.",
  },

  featureCards: [
    {
      icon: "🗓️",
      title: "Visual Rule Builder",
      description:
        "Pick frequency, interval, days of the week, and end conditions — the RRULE string updates live as you type.",
    },
    {
      icon: "🔍",
      title: "Parse & Decode",
      description:
        "Paste any RRULE string and instantly see its meaning in plain English plus a field-by-field breakdown.",
    },
    {
      icon: "📅",
      title: "Occurrence Preview",
      description:
        "See the next 10 matching dates so you can verify the rule behaves exactly as expected before shipping.",
    },
  ],

  relatedTools: [
    {
      name: "Cron Expression Builder",
      url: "https://cron-expression-builder.tools.jagodana.com",
      icon: "⏰",
      description: "Build and test cron schedule expressions interactively.",
    },
    {
      name: "Timestamp Converter",
      url: "https://timestamp-converter.tools.jagodana.com",
      icon: "🕰️",
      description: "Convert between Unix timestamps and human-readable dates.",
    },
    {
      name: "Timezone Overlap Finder",
      url: "https://timezone-overlap-finder.tools.jagodana.com",
      icon: "🌍",
      description: "Find overlapping working hours across multiple timezones.",
    },
    {
      name: "UUID Generator",
      url: "https://uuid-generator.tools.jagodana.com",
      icon: "🆔",
      description: "Generate UUID v1, v4, v5, and ULID identifiers instantly.",
    },
    {
      name: "JSON Formatter",
      url: "https://json-formatter.tools.jagodana.com",
      icon: "{}",
      description: "Format, validate, and minify JSON in your browser.",
    },
    {
      name: "Regex Playground",
      url: "https://regex-playground.tools.jagodana.com",
      icon: "🧪",
      description: "Build, test & debug regular expressions in real-time.",
    },
  ],

  howToSteps: [
    {
      name: "Choose a frequency",
      text: "Select Daily, Weekly, Monthly, or Yearly and set the interval (e.g. every 2 weeks).",
      url: "",
    },
    {
      name: "Configure the details",
      text: "For weekly rules pick days of the week; for monthly pick a day number; set an optional end date or occurrence count.",
      url: "",
    },
    {
      name: "Copy the RRULE",
      text: "Click Copy to grab the RFC 5545 RRULE string and paste it into your calendar API, ical library, or database.",
      url: "",
    },
  ],
  howToTotalTime: "PT1M",

  faq: [
    {
      question: "What is an RRULE?",
      answer:
        "An RRULE (Recurrence Rule) is a string defined by RFC 5545 (iCalendar) that describes a repeating schedule. It's used by Google Calendar, Outlook, Apple Calendar, and most calendar libraries to represent events like 'every Monday at 9 AM' or 'the last Friday of each month'. Example: RRULE:FREQ=WEEKLY;BYDAY=MO,WE;COUNT=10",
    },
    {
      question: "What does FREQ, INTERVAL, BYDAY, COUNT, and UNTIL mean?",
      answer:
        "FREQ sets the recurrence type (DAILY, WEEKLY, MONTHLY, YEARLY). INTERVAL is how many units between recurrences (default 1). BYDAY lists days of the week (MO, TU, WE, TH, FR, SA, SU). COUNT limits total occurrences. UNTIL sets an end date in YYYYMMDDTHHMMSSZ format. You can combine these: RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,FR;COUNT=20",
    },
    {
      question: "How do I use an RRULE string in code?",
      answer:
        "In JavaScript/TypeScript, use the 'rrule' npm package: const rule = RRule.fromString('RRULE:FREQ=DAILY;COUNT=10'). In Python, use the 'python-dateutil' library: rrulestr('RRULE:FREQ=DAILY;COUNT=10', dtstart=datetime.now()). In PHP, use 'simshaun/recurr'. The RRULE string generated here is compatible with all these libraries and with Google Calendar API, CalDAV, and RFC 5545-compliant servers.",
    },
    {
      question: "What is the difference between COUNT and UNTIL?",
      answer:
        "COUNT limits the rule to a specific number of total occurrences (e.g. COUNT=10 means exactly 10 events). UNTIL sets an absolute end date — the rule generates events up to and including that date. You can only use one of them at a time; using both in the same RRULE is invalid per RFC 5545.",
    },
    {
      question: "Does this tool run in the browser or send data to a server?",
      answer:
        "Everything runs 100% client-side in your browser. No RRULE data, dates, or inputs are ever sent to any server. You can use this tool safely with internal scheduling data or sensitive calendar configurations.",
    },
  ],

  pages: {
    "/": {
      title:
        "RRULE Generator — Build & Parse Recurring Calendar Event Rules",
      description:
        "Free online RRULE generator and parser for RFC 5545 iCalendar recurrence rules. Build recurring event schedules visually, preview next occurrences, and decode any RRULE string instantly.",
      changeFrequency: "weekly" as const,
      priority: 1,
    },
  },
} as const;

export type SiteConfig = typeof siteConfig;
