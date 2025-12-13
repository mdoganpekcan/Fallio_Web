import { PageHeader } from "@/components/layout/page-header";
import { NotificationPanel } from "@/components/notifications/notification-panel";
import { fetchNotifications } from "@/lib/data";

export default async function NotificationsPage() {
  const notifications = await fetchNotifications(12);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bildirim Merkezi"
        description="Toplu veya kullanıcıya özel bildirimler oluşturun."
      />
      <NotificationPanel notifications={notifications} />
    </div>
  );
}
