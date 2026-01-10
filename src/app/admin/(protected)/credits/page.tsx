import { PageHeader } from "@/components/layout/page-header";
import { CreditsBoard } from "@/components/credits/credits-board";
import { fetchCreditPackages, fetchSubscriptions } from "@/lib/data";

export default async function CreditsPage() {
  const [packages, subscriptions] = await Promise.all([
    fetchCreditPackages(),
    fetchSubscriptions(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kredi & Ekonomi Yönetimi"
        description="Kredi paketleri ve abonelik avantajları"
      />
      <CreditsBoard
        packages={packages}
        subscriptions={subscriptions}
      />
    </div>
  );
}
