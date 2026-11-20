export type Temperature = "Hot" | "Warm" | "Cold";
export type LeadRating = "hot" | "warm" | "cold";
export type FollowUpStatus = "pending" | "contacted" | "done";

export type Lead = {
  id: string;
  initials: string;
  name: string;
  position?: string;
  /** @deprecated Mobile uses position. Kept for legacy dashboard fixtures. */
  role: string;
  company: string;
  email: string;
  phone: string;
  website?: string;
  address?: string;
  photoPath?: string | null;
  isFavorite?: boolean;
  rating?: LeadRating | null;
  followUpStatus?: FollowUpStatus;
  /** @deprecated Follow-up rating now lives on event_occurrences. */
  temperature: Temperature;
  event: string;
  eventId?: string;
  capturedBy: string;
  capturedAt: string;
  capturedLabel: string;
  note: string;
  color: string;
  status: "Ready to follow up" | "Needs review" | "Synced";
};

export const leads: Lead[] = [
  { id: "l1", initials: "JL", name: "Jordan Lee", role: "Head of Partnerships", company: "Northstar Labs", email: "jordan@northstarlabs.co", phone: "+1 415 555 0198", temperature: "Hot", event: "Future of Work Summit", capturedBy: "Maya Chen", capturedAt: "2026-11-19T09:42:00", capturedLabel: "12 min ago", note: "Runs partnerships across 3 regions. Asked for the enterprise case study and pricing by Friday.", color: "violet", status: "Ready to follow up" },
  { id: "l2", initials: "SP", name: "Sofia Patel", role: "Founder & CEO", company: "Kite & Co.", email: "sofia@kiteandco.com", phone: "+1 310 555 0142", temperature: "Warm", event: "Future of Work Summit", capturedBy: "Daniel Wu", capturedAt: "2026-11-19T09:21:00", capturedLabel: "33 min ago", note: "Interested in a lighter-weight rollout for her consulting team. Reconnect after their planning week.", color: "teal", status: "Synced" },
  { id: "l3", initials: "MA", name: "Marcus Alvarez", role: "VP, Growth", company: "Polaris Health", email: "marcus@polarishealth.io", phone: "+1 646 555 0117", temperature: "Hot", event: "Future of Work Summit", capturedBy: "Maya Chen", capturedAt: "2026-11-19T08:54:00", capturedLabel: "1 hr ago", note: "Strong fit for the referral program. Mentioned a board meeting next Tuesday.", color: "orange", status: "Ready to follow up" },
  { id: "l4", initials: "EC", name: "Emma Carter", role: "Marketing Director", company: "Fieldnote", email: "emma@fieldnote.co", phone: "+1 212 555 0177", temperature: "Warm", event: "Future of Work Summit", capturedBy: "Alex Rivera", capturedAt: "2026-11-19T08:40:00", capturedLabel: "1 hr ago", note: "Wants to see how the team handles event handoff and duplicate detection.", color: "pink", status: "Needs review" },
  { id: "l5", initials: "RK", name: "Ravi Kumar", role: "Principal Consultant", company: "Cedar Strategy", email: "ravi@cedarstrategy.com", phone: "+1 917 555 0134", temperature: "Cold", event: "Future of Work Summit", capturedBy: "Daniel Wu", capturedAt: "2026-11-19T08:17:00", capturedLabel: "2 hrs ago", note: "Met during the afternoon break. Send the short product overview.", color: "blue", status: "Synced" },
  { id: "l6", initials: "NW", name: "Noah Williams", role: "COO", company: "Vantage Retail", email: "noah@vantageretail.com", phone: "+1 206 555 0106", temperature: "Warm", event: "Design Leaders Dinner", capturedBy: "Maya Chen", capturedAt: "2026-11-18T19:30:00", capturedLabel: "Yesterday", note: "Exploring a shared team workspace for a distributed sales group.", color: "indigo", status: "Synced" }
];

export const eventStats = [16, 24, 20, 31, 27, 42, 38, 54, 46, 58, 64, 71, 68, 82, 74, 91, 88, 106, 98, 116, 109, 124, 118, 138];

export type WorkspaceEvent = {
  id: string;
  name: string;
  startsAt?: string;
  notes?: string;
  date: string;
  location: string;
  status: "Live" | "Upcoming" | "Completed";
  contacts: number;
  team: number;
  owner: string;
};

export const events: WorkspaceEvent[] = [
  { id: "e1", name: "Future of Work Summit", date: "Nov 18–20, 2026", location: "San Francisco, CA", status: "Live", contacts: 86, team: 3, owner: "Maya Chen" },
  { id: "e2", name: "Design Leaders Dinner", date: "Nov 12, 2026", location: "New York, NY", status: "Completed", contacts: 24, team: 2, owner: "Daniel Wu" },
  { id: "e3", name: "RevOps Roundtable", date: "Dec 4, 2026", location: "Austin, TX", status: "Upcoming", contacts: 0, team: 4, owner: "Alex Rivera" },
  { id: "e4", name: "People Analytics Forum", date: "Dec 15, 2026", location: "Chicago, IL", status: "Upcoming", contacts: 0, team: 3, owner: "Maya Chen" },
  { id: "e5", name: "Customer Experience Week", date: "Oct 21–23, 2026", location: "London, UK", status: "Completed", contacts: 58, team: 5, owner: "Daniel Wu" },
];
