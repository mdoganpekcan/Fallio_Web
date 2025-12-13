import { TellersBoard } from "@/components/tellers/tellers-board";
import { fetchTellers } from "@/lib/data";

export default async function TellersPage() {
  const tellers = await fetchTellers();

  return <TellersBoard initialTellers={tellers} />;
}
