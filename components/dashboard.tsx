"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/icon";
import { leads as seedLeads, type Lead, type Temperature } from "@/lib/data";

const navItems = [
  { label: "Overview", icon: "grid" as const },
  { label: "Contacts", icon: "users" as const, count: 128 },
  { label: "Events", icon: "calendar" as const },
  { label: "Insights", icon: "chart" as const },
];

const team = [
  { name: "Maya Chen", initials: "MC", color: "#5a4cf5" },
  { name: "Daniel Wu", initials: "DW", color: "#159f8a" },
  { name: "Alex Rivera", initials: "AR", color: "#f28c48" },
];

const metricCards = [
  { label: "Total contacts", value: "128", delta: "+18.4%", detail: "vs. last event", tone: "purple", icon: "users" as const },
  { label: "Captured today", value: "24", delta: "+6", detail: "since yesterday", tone: "orange", icon: "spark" as const },
  { label: "Ready to follow up", value: "18", delta: "14.1%", detail: "of all contacts", tone: "green", icon: "arrow" as const },
  { label: "Active events", value: "3", delta: "2 live", detail: "this month", tone: "blue", icon: "calendar" as const },
];

const chartPoints = [18, 26, 22, 34, 29, 43, 38, 48, 43, 60, 55, 70, 65, 84, 78, 96, 91, 109, 101, 121, 115, 134, 128, 142];

function Avatar({ initials, color, large = false }: { initials: string; color?: string; large?: boolean }) {
  return <span className={`avatar ${large ? "avatar-large" : ""}`} style={{ background: color ?? "#e8e8f4" }}>{initials}</span>;
}

function StatusPill({ status }: { status: Lead["status"] }) {
  const style = status === "Ready to follow up" ? "status-ready" : status === "Needs review" ? "status-review" : "status-synced";
  return <span className={`status-pill ${style}`}><span className="status-dot" />{status}</span>;
}

function TemperaturePill({ temperature }: { temperature: Temperature }) {
  return <span className={`temperature temperature-${temperature.toLowerCase()}`}><span className="temperature-dot" />{temperature}</span>;
}

function Sparkline() {
  const width = 520;
  const height = 148;
  const points = chartPoints.map((value, index) => `${(index / (chartPoints.length - 1)) * width},${height - (value / 150) * 112 - 8}`).join(" ");
  return (
    <svg className="sparkline" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label="Contact captures trending upward">
      <defs><linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#7569ff" stopOpacity=".28" /><stop offset="100%" stopColor="#7569ff" stopOpacity="0" /></linearGradient></defs>
      {[28, 66, 104, 142].map((y) => <line key={y} x1="0" y1={y} x2={width} y2={y} stroke="#ececf5" strokeWidth="1" />)}
      <polygon points={`0,148 ${points} ${width},148`} fill="url(#chartFill)" />
      <polyline points={points} fill="none" stroke="#6558f5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={width} cy={height - (chartPoints.at(-1)! / 150) * 112 - 8} r="5" fill="#fff" stroke="#6558f5" strokeWidth="3" />
    </svg>
  );
}

export default function Dashboard() {
  const [activeNav, setActiveNav] = useState("Overview");
  const [range, setRange] = useState("Last 30 days");
  const [search, setSearch] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [toast, setToast] = useState("");

  const filteredLeads = useMemo(() => seedLeads.filter((lead) => {
    const query = search.trim().toLowerCase();
    return !query || [lead.name, lead.company, lead.role, lead.email].some((value) => value.toLowerCase().includes(query));
  }), [search]);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  };

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">C</span><span className="brand-word">cotople</span></div>
        <div className="workspace-switcher"><span className="workspace-avatar">IS</span><span><strong>Ideahub Solutions</strong><small>Team workspace</small></span><Icon name="chevron" size={15} /></div>
        <nav className="primary-nav" aria-label="Primary navigation">
          <span className="nav-heading">Workspace</span>
          {navItems.map((item) => <button key={item.label} className={`nav-item ${activeNav === item.label ? "active" : ""}`} onClick={() => { setActiveNav(item.label); showToast(`${item.label} view selected`); }}><Icon name={item.icon} size={18} /><span>{item.label}</span>{item.count && <em>{item.count}</em>}</button>)}
        </nav>
        <div className="sidebar-bottom">
          <button className="nav-item" onClick={() => showToast("Settings are coming soon")}><Icon name="settings" size={18} /><span>Settings</span></button>
          <button className="nav-item" onClick={() => showToast("Help center opened")}><Icon name="help" size={18} /><span>Help center</span></button>
          <div className="profile-card"><Avatar initials="JS" color="#d9c8ff" /><span><strong>Jordan Smith</strong><small>Admin</small></span><Icon name="more" size={18} /></div>
        </div>
      </aside>

      <section className="content-area">
        <header className="topbar"><div className="breadcrumb"><span>Workspace</span><Icon name="chevron" size={14} /><strong>{activeNav}</strong></div><div className="topbar-actions"><label className="search-box"><Icon name="search" size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search contacts" aria-label="Search contacts" /></label><button className="icon-button" aria-label="Notifications" onClick={() => showToast("You are all caught up")}><Icon name="bell" size={19} /><span className="notification-dot" /></button><button className="help-button" onClick={() => showToast("Help center opened")}><Icon name="help" size={18} />Help</button></div></header>

        <div className="page-content">
          <div className="page-heading"><div><p className="eyebrow">Thursday, November 19, 2026</p><h1>Good morning, Jordan <span>✦</span></h1><p className="subheading">Here&apos;s what&apos;s happening across your team today.</p></div><button className="primary-button" onClick={() => showToast("Capture link copied to clipboard")}><Icon name="plus" size={17} />Capture contact</button></div>

          <section className="metrics-grid" aria-label="Key metrics">{metricCards.map((metric) => <article className="metric-card" key={metric.label}><div className={`metric-icon ${metric.tone}`}><Icon name={metric.icon} size={19} /></div><div className="metric-copy"><p>{metric.label}</p><div className="metric-value-row"><strong>{metric.value}</strong><span className={`metric-delta ${metric.tone}`}>{metric.delta}</span></div><small>{metric.detail}</small></div><span className="metric-menu"><Icon name="more" size={18} /></span></article>)}</section>

          <section className="main-grid"><article className="panel trend-panel"><div className="panel-heading"><div><h2>Contact captures</h2><p>How your team is growing the network</p></div><select value={range} onChange={(event) => setRange(event.target.value)} aria-label="Chart range"><option>Last 30 days</option><option>Last 7 days</option><option>This year</option></select></div><div className="chart-meta"><strong>142</strong><span>contacts captured</span><span className="chart-change">↗ 18.4%</span></div><Sparkline /><div className="chart-labels"><span>Oct 21</span><span>Oct 28</span><span>Nov 4</span><span>Nov 11</span><span>Nov 19</span></div></article><article className="panel event-panel"><div className="panel-heading"><div><h2>Live event</h2><p>Currently collecting contacts</p></div><span className="live-badge"><i />Live</span></div><div className="event-title"><span className="event-icon"><Icon name="calendar" size={21} /></span><div><strong>Future of Work Summit</strong><span>Nov 18 – 20, 2026</span></div></div><div className="event-progress"><div className="progress-label"><span>Event progress</span><strong>72%</strong></div><div className="progress-track"><span style={{ width: "72%" }} /></div></div><div className="event-stats"><div><strong>86</strong><span>captured</span></div><div><strong>24</strong><span>today</span></div><div><strong>3</strong><span>team members</span></div></div><div className="sync-health"><span className="sync-check"><Icon name="check" size={13} /></span><span><strong>Mobile sync healthy</strong><small>All captures synced just now</small></span><span className="sync-time">0 pending</span></div><button className="secondary-button" onClick={() => showToast("Opening event details")}>View event details <Icon name="arrow" size={16} /></button></article></section>

          <section className="panel contacts-panel"><div className="panel-heading contacts-heading"><div><h2>Recent contacts</h2><p>Latest connections from your team</p></div><div className="heading-actions"><button className="filter-button" onClick={() => showToast("Filters are ready for your next view")}><Icon name="filter" size={16} />Filter</button><button className="text-button" onClick={() => { setActiveNav("Contacts"); showToast("Showing all contacts"); }}>View all <Icon name="arrow" size={15} /></button></div></div><div className="table-wrap"><table><thead><tr><th>Contact</th><th>Company</th><th>Captured by</th><th>Temperature</th><th>Status</th><th aria-label="Actions" /></tr></thead><tbody>{filteredLeads.map((lead) => <tr key={lead.id} onClick={() => setSelectedLead(lead)}><td><div className="contact-cell"><Avatar initials={lead.initials} color={`var(--avatar-${lead.color})`} /><span><strong>{lead.name}</strong><small>{lead.role}</small></span></div></td><td><span className="company-cell">{lead.company}</span></td><td><div className="captured-cell"><Avatar initials={lead.capturedBy.split(" ").map((part) => part[0]).join("")} color="#ecebff" /><span>{lead.capturedBy}</span><small>{lead.capturedLabel}</small></div></td><td><TemperaturePill temperature={lead.temperature} /></td><td><StatusPill status={lead.status} /></td><td><button className="row-more" aria-label={`More actions for ${lead.name}`} onClick={(event) => { event.stopPropagation(); setSelectedLead(lead); }}><Icon name="more" size={18} /></button></td></tr>)}</tbody></table>{filteredLeads.length === 0 && <div className="empty-state">No contacts match “{search}”.</div>}</div></section>

          <section className="bottom-grid"><article className="panel team-panel"><div className="panel-heading"><div><h2>Team activity</h2><p>Contributions this event</p></div><button className="row-more" onClick={() => showToast("Team activity details opened")}><Icon name="more" size={18} /></button></div>{team.map((member, index) => <div className="team-row" key={member.name}><Avatar initials={member.initials} color={member.color} /><div className="team-name"><strong>{member.name}</strong><span>{index === 0 ? "Most active today" : "Event staff"}</span></div><div className="team-count"><strong>{[34, 28, 24][index]}</strong><span>contacts</span></div><div className={`team-trend ${index === 2 ? "neutral" : ""}`}>{index === 0 ? "↗ 12%" : index === 1 ? "↗ 8%" : "—"}</div></div>)}</article><article className="panel quality-panel"><div className="panel-heading"><div><h2>Lead quality</h2><p>Follow-up readiness</p></div><button className="row-more" onClick={() => showToast("Quality filters opened")}><Icon name="more" size={18} /></button></div><div className="quality-total"><strong>86</strong><span>event contacts</span></div><div className="quality-bars"><div><span><i className="hot-fill" />Hot <b>31</b></span><em>36%</em></div><div><span><i className="warm-fill" />Warm <b>42</b></span><em>49%</em></div><div><span><i className="cold-fill" />Cold <b>13</b></span><em>15%</em></div></div><div className="quality-footer"><span><Icon name="check" size={13} /> 18 ready to follow up</span><button className="text-button" onClick={() => showToast("Showing follow-up ready contacts")}>Review <Icon name="arrow" size={14} /></button></div></article><article className="panel insight-panel"><div className="insight-glow" /><div className="insight-icon"><Icon name="spark" size={19} /></div><div><p className="eyebrow">Cotople insight</p><h2>Your team is in a great rhythm.</h2><p>Warm and hot leads make up <strong>63%</strong> of today&apos;s captures. Consider sending the enterprise case study while the conversation is fresh.</p><button className="text-button" onClick={() => showToast("Insight saved for follow-up")} >Save insight <Icon name="arrow" size={15} /></button></div></article></section>
        </div>
      </section>

      {selectedLead && <div className="drawer-backdrop" onClick={() => setSelectedLead(null)}><aside className="lead-drawer" onClick={(event) => event.stopPropagation()}><div className="drawer-header"><span className="eyebrow">Contact details</span><button className="icon-button" aria-label="Close contact details" onClick={() => setSelectedLead(null)}><Icon name="close" size={19} /></button></div><div className="drawer-person"><Avatar initials={selectedLead.initials} color={`var(--avatar-${selectedLead.color})`} large /><div><h2>{selectedLead.name}</h2><p>{selectedLead.role} at {selectedLead.company}</p></div></div><div className="drawer-tags"><TemperaturePill temperature={selectedLead.temperature} /><StatusPill status={selectedLead.status} /></div><div className="drawer-fields"><div><span>Email</span><strong>{selectedLead.email}</strong></div><div><span>Phone</span><strong>{selectedLead.phone}</strong></div><div><span>Captured at</span><strong>{selectedLead.capturedLabel} by {selectedLead.capturedBy}</strong></div><div><span>Event</span><strong>{selectedLead.event}</strong></div></div><div className="drawer-note"><span>Conversation note</span><p>{selectedLead.note}</p></div><button className="primary-button drawer-action" onClick={() => { setSelectedLead(null); showToast(`Follow-up queued for ${selectedLead.name}`); }}><Icon name="arrow" size={17} />Mark ready for follow-up</button></aside></div>}
      {toast && <div className="toast"><Icon name="check" size={17} />{toast}</div>}
    </main>
  );
}
