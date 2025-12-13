import { PageHeader } from "@/components/layout/page-header";
import { CreditsBoard } from "@/components/credits/credits-board";
import { fetchCreditPackages, fetchEarningRules, fetchSubscriptions } from "@/lib/data";

export default async function CreditsPage() {
  const [packages, earningRules, subscriptions] = await Promise.all([
    fetchCreditPackages(),
    fetchEarningRules(),
    fetchSubscriptions(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kredi & Ekonomi Yönetimi"
        description="Kredi paketleri, elmas kazanım kuralları ve abonelik avantajları"
      />
      <CreditsBoard
        packages={packages}
        earningRules={earningRules}
        subscriptions={subscriptions}
      />
    </div>
  );
}
