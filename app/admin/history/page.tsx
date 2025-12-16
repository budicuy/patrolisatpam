import { getPatrolHistory } from "@/app/actions/history";
import { PatrolHistoryTable } from "./patrol-history-table";

export default async function HistoryPage() {
  const history = await getPatrolHistory();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-sans">Riwayat Patroli</h1>
      <PatrolHistoryTable history={history} />
    </div>
  );
}
