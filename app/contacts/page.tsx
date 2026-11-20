import ContactsPage from "@/components/contacts-page";
import { WorkspaceShell } from "@/components/workspace-shell";
import { getWorkspaceUser } from "@/lib/workspace-user";
import { getContactsAndEvents } from "@/lib/workspace-data";

export const dynamic = "force-dynamic";

export default async function ContactsRoute() {
  const user = await getWorkspaceUser();
  const { contacts, events } = await getContactsAndEvents();
  return <WorkspaceShell {...user} title="Contacts"><ContactsPage initialContacts={contacts} events={events} /></WorkspaceShell>;
}
