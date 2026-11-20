import EventsPage from "@/components/events-page";
import { WorkspaceShell } from "@/components/workspace-shell";
import { getWorkspaceUser } from "@/lib/workspace-user";
import { getContactsAndEvents } from "@/lib/workspace-data";

export const dynamic = "force-dynamic";

export default async function EventsRoute() {
  const user = await getWorkspaceUser();
  const { events } = await getContactsAndEvents();
  return <WorkspaceShell {...user} title="Events"><EventsPage initialEvents={events} /></WorkspaceShell>;
}
