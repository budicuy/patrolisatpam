import { getPatrolHistory, getShifts } from "@/app/actions/history";
import { PatrolHistoryTable } from "./patrol-history-table";

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; date?: string; shiftId?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const date = params.date;
  const shiftId = params.shiftId;

  const { data: history, metadata } = await getPatrolHistory({
    page,
    limit: 9,
    date,
    shiftId,
  });

  const shifts = await getShifts();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-sans">Riwayat Patroli</h1>
      <PatrolHistoryTable
        history={history}
        currentPage={metadata.currentPage}
        totalPages={metadata.totalPages}
        shifts={shifts}
      />
    </div>
  );
}
