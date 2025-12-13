import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { LineChart } from "@/components/charts/line-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { Avatar } from "@/components/ui/avatar";
import { Table } from "@/components/tables/table";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { fetchDashboardStats, fetchRecentFortunes, fetchRecentUsers } from "@/lib/data";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const stats = await fetchDashboardStats();
  const recentUsers = await fetchRecentUsers(5);
  const fortunes = await fetchRecentFortunes(6);

  const weeklyData = [
    { label: "Mon", value: 68 },
    { label: "Tue", value: 92 },
    { label: "Wed", value: 80 },
    { label: "Thu", value: 110 },
    { label: "Fri", value: 95 },
    { label: "Sat", value: 120 },
    { label: "Sun", value: 140 },
  ];

  const subscriptionGrowth = [
    { label: "Mon", value: 40 },
    { label: "Tue", value: 55 },
    { label: "Wed", value: 62 },
    { label: "Thu", value: 70 },
    { label: "Fri", value: 85 },
    { label: "Sat", value: 98 },
    { label: "Sun", value: 120 },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Falio performansını gerçek zamanlı takip edin."
        action={<Button className="px-5">+ Yeni İşlem</Button>}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString("tr-TR")}
          change="+2.5%"
          positive
        />
        <StatCard
          title="Total Fortunes"
          value={stats.totalFortunes.toLocaleString("tr-TR")}
          change="+1.8%"
          positive
        />
        <StatCard
          title="Active Tellers"
          value={stats.activeTellers.toLocaleString("tr-TR")}
          change="-1.2%"
          positive={false}
        />
        <StatCard
          title="Daily Revenue"
          value={`$${stats.dailyRevenue.toLocaleString("en-US")}`}
          change="+5.0%"
          positive
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Weekly Fortune Submissions"
            description="Son 7 gün içerisindeki trend"
          />
          <CardContent>
            <LineChart data={weeklyData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader
            title="Subscription Growth"
            description="Aylık abonelik dönüşümü"
          />
          <CardContent>
            <BarChart data={subscriptionGrowth} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Recent Fortunes" description="En son talepler" />
          <CardContent>
            <Table
              data={fortunes}
              columns={[
                { key: "user_name", header: "User" },
                { key: "type", header: "Fortune Type" },
                { key: "teller_name", header: "Teller" },
                {
                  key: "status",
                  header: "Status",
                  render: (item) => (
                    <Badge
                      variant={item.status === "completed" ? "success" : "warning"}
                    >
                      {item.status === "completed" ? "Tamamlandı" : "Bekliyor"}
                    </Badge>
                  ),
                },
              ]}
              empty="Henüz fortune kaydı yok."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="New Users" description="Son katılan üyeler" />
          <CardContent className="space-y-4">
            {recentUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between rounded-xl bg-[var(--card)] px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={user.full_name} src={user.avatar_url} />
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {user.full_name}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {user.city ?? "Bilinmiyor"}
                    </p>
                  </div>
                </div>
                <Badge variant="default">{user.zodiac_sign ?? "-"}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
