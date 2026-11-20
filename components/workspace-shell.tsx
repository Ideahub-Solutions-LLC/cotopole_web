"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/actions/auth";
import { Icon } from "@/components/icon";

const navItems = [
  { label: "Overview", href: "/", icon: "grid" as const },
  { label: "Contacts", href: "/contacts", icon: "users" as const, count: 128 },
  { label: "Events", href: "/events", icon: "calendar" as const },
  { label: "Insights", href: "/#insights", icon: "chart" as const },
];

export function WorkspaceShell({ userEmail, userName, isAdmin, title, children }: { userEmail: string; userName: string; isAdmin: boolean; title: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const initials = userName.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "U";

  return <main className="app-shell">
    <aside className="sidebar">
      <div className="brand"><img className="brand-logo" src="/cotople-logo.webp" alt="Cotople" /><img className="brand-favicon" src="/icon.png" alt="Cotople" /></div>
      <nav className="primary-nav" aria-label="Primary navigation"><span className="nav-heading">Workspace</span>{navItems.map((item) => {
        const active = item.href === "/" ? pathname === "/" : item.href !== "/#insights" && pathname.startsWith(item.href);
        return <Link key={item.label} href={item.href} className={`nav-item ${active ? "active" : ""}`}><Icon name={item.icon} size={18} /><span>{item.label}</span>{item.count && <em>{item.count}</em>}</Link>;
      })}</nav>
      <div className="sidebar-bottom">{isAdmin && <Link className="nav-item" href="/admin/users"><Icon name="settings" size={18} /><span>Settings</span></Link>}<Link className="nav-item" href="/#help"><Icon name="help" size={18} /><span>Help center</span></Link><div className="profile-card"><span className="avatar" style={{ background: "#d9c8ff" }}>{initials}</span><span><strong>{userName || userEmail}</strong><small>{isAdmin ? "Admin" : "User"}</small></span><form action={signOut} className="profile-signout-form"><button className="profile-signout" type="submit" aria-label="Sign out"><Icon name="logout" size={17} /></button></form></div></div>
    </aside>
    <section className="content-area"><header className="topbar"><div className="breadcrumb"><span>Workspace</span><Icon name="chevron" size={14} /><strong>{title}</strong></div><div className="topbar-actions"><label className="search-box"><Icon name="search" size={18} /><input placeholder={`Search ${title.toLowerCase()}`} aria-label={`Search ${title.toLowerCase()}`} /></label><button className="icon-button" aria-label="Notifications"><Icon name="bell" size={19} /><span className="notification-dot" /></button><Link className="help-button" href="/#help"><Icon name="help" size={18} />Help</Link></div></header><div className="page-content">{children}</div></section>
  </main>;
}
