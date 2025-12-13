/* eslint-disable @next/next/no-img-element */
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FortuneResponseForm } from "@/components/fortunes/fortune-response-form";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

async function fetchFortuneDetail(id: string) {
  // 1. Get the fortune base data
  const { data: fortune, error: fortuneError } = await supabaseAdmin
    .from("fortunes")
    .select("*")
    .eq("id", id)
    .single();

  if (fortuneError) {
    console.error("Error fetching fortune base:", JSON.stringify(fortuneError, null, 2));
    return null;
  }

  // 2. Fetch related data in parallel to avoid PostgREST join issues
  const [userRes, tellerRes, imagesRes] = await Promise.all([
    supabaseAdmin
      .from("users")
      .select("full_name, email, zodiac_sign, job, relationship_status")
      .eq("id", fortune.user_id)
      .single(),
    fortune.teller_id 
      ? supabaseAdmin.from("fortune_tellers").select("name").eq("id", fortune.teller_id).single() 
      : Promise.resolve({ data: null }),
    supabaseAdmin
      .from("fortune_images")
      .select("url")
      .eq("fortune_id", id)
  ]);

  // Construct the object expected by the component
  return {
    ...fortune,
    user: userRes.data,
    teller: tellerRes.data,
    images: imagesRes.data || []
  };
}

export default async function FortuneDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await fetchFortuneDetail(id);
  if (!detail) return notFound();

  const statusLabel =
    detail.status === "completed" ? (
      <Badge variant="success">Tamamlandı</Badge>
    ) : (
      <Badge variant="warning">Bekliyor</Badge>
    );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fal Detayı"
        description="Fal talebini görüntüle ve yanıtla."
      />

      <Card>
        <CardHeader
          title={`${detail.user?.full_name ?? "Kullanıcı"} - ${detail.type}`}
          description={`Gönderilme: ${format(
            new Date(detail.created_at),
            "dd.MM.yyyy HH:mm",
            { locale: tr }
          )}`}
          action={statusLabel}
        />
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-sm text-[var(--muted-foreground)]">
              <p className="text-white">Kullanıcı</p>
              <p>{detail.user?.full_name ?? "İsimsiz"}</p>
              <p>{detail.user?.email}</p>
              <p className="mt-2 text-xs opacity-70">
                {detail.user?.zodiac_sign} • {detail.user?.job} • {detail.user?.relationship_status}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-sm text-[var(--muted-foreground)]">
              <p className="text-white">Falcı</p>
              <p>{detail.teller?.name ?? "Atanmamış"}</p>
            </div>
          </div>

          {detail.user_note ? (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
              <p className="text-sm font-semibold text-white">Kullanıcı Notu</p>
              <p className="text-sm text-[var(--muted-foreground)]">
                {detail.user_note}
              </p>
            </div>
          ) : null}

          {/* Metadata Display (Tarot Cards, etc.) */}
          {detail.metadata && Object.keys(detail.metadata).length > 0 ? (
             <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
               <p className="text-sm font-semibold text-white mb-2">Fal Detayları</p>
               <div className="grid gap-2 text-sm text-[var(--muted-foreground)]">
                 {detail.metadata.selected_cards && (
                   <div>
                     <span className="text-white">Seçilen Kartlar:</span> {Array.isArray(detail.metadata.selected_cards) ? detail.metadata.selected_cards.join(", ") : detail.metadata.selected_cards}
                   </div>
                 )}
                 {detail.metadata.selected_color && (
                   <div>
                     <span className="text-white">Seçilen Renk:</span> {detail.metadata.selected_color}
                   </div>
                 )}
                 {detail.metadata.category && (
                   <div>
                     <span className="text-white">Kategori:</span> {detail.metadata.category}
                   </div>
                 )}
               </div>
             </div>
          ) : null}

          {detail.images?.length ? (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-white">Yüklenen Fotoğraflar</p>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {detail.images.map((img: any) => (
                  <div
                    key={img.url}
                    className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--panel)]"
                  >
                    <img src={img.url} alt="fortune" className="h-32 w-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <FortuneResponseForm
            fortuneId={detail.id}
            userId={detail.user_id}
            initialResponse={detail.response}
            initialStatus={detail.status}
            fortuneType={detail.type}
            userNote={detail.user_note}
            metadata={detail.metadata}
            userZodiac={detail.user?.zodiac_sign ?? undefined}
          />
        </CardContent>
      </Card>
    </div>
  );
}
