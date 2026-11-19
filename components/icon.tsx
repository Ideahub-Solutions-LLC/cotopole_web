type IconName = "grid" | "users" | "calendar" | "chart" | "settings" | "help" | "search" | "bell" | "arrow" | "chevron" | "filter" | "download" | "more" | "plus" | "spark" | "check" | "close";

const paths: Record<IconName, React.ReactNode> = {
  grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
  calendar: <><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>,
  chart: <><path d="M3 3v18h18"/><path d="m7 16 3-4 3 2 5-7"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.5 1.5-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V20h-2.12v-.4A1.7 1.7 0 0 0 12.18 18a1.7 1.7 0 0 0-1.88.34l-.06.06-1.5-1.5.06-.06A1.7 1.7 0 0 0 9.14 15a1.7 1.7 0 0 0-1.56-1.03H7v-2.12h.4A1.7 1.7 0 0 0 9 10.82a1.7 1.7 0 0 0-.34-1.88L8.6 8.88l1.5-1.5.06.06A1.7 1.7 0 0 0 12 7.78 1.7 1.7 0 0 0 13.03 6.2V6h2.12v.4A1.7 1.7 0 0 0 16.18 8a1.7 1.7 0 0 0 1.88-.34l.06-.06 1.5 1.5-.06.06A1.7 1.7 0 0 0 19.22 11c.2.63.78 1.03 1.44 1.03H21v2.12h-.4A1.7 1.7 0 0 0 19.4 15Z"/></>,
  help: <><circle cx="12" cy="12" r="9"/><path d="M9.6 9a2.5 2.5 0 1 1 4.63 1.32c-.7.91-2.23 1.18-2.23 2.68M12 16h.01"/></>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></>,
  arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
  chevron: <path d="m6 9 6 6 6-6"/>,
  filter: <path d="M4 5h16M7 12h10M10 19h4"/>,
  download: <><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></>,
  more: <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
  plus: <><path d="M12 5v14M5 12h14"/></>,
  spark: <><path d="m12 3-1.5 5.5L5 10l5.5 1.5L12 17l1.5-5.5L19 10l-5.5-1.5L12 3ZM19 17l-.6 2.4L16 20l2.4.6L19 23l.6-2.4L22 20l-2.4-.6L19 17Z"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  close: <><path d="M6 6l12 12M18 6 6 18"/></>
};

export function Icon({ name, size = 20, strokeWidth = 1.8 }: { name: IconName; size?: number; strokeWidth?: number }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}
