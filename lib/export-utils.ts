"use client";

import { format } from "date-fns";
import { id } from "date-fns/locale";

interface ExportRow {
  id: number;
  tanggal: string;
  waktu: string;
  petugas: string;
  shift: string;
  lokasi: string;
  putaran: number;
}

export async function exportToExcel(data: ExportRow[], filename: string) {
  // Dynamic import - only loads when function is called
  const XLSX = await import("xlsx");

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();

  // Set column widths
  worksheet["!cols"] = [
    { wch: 8 }, // ID
    { wch: 12 }, // Tanggal
    { wch: 10 }, // Waktu
    { wch: 20 }, // Petugas
    { wch: 15 }, // Shift
    { wch: 25 }, // Lokasi
    { wch: 10 }, // Putaran
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, "Riwayat Patroli");
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export async function exportToPdf(
  data: ExportRow[],
  filename: string,
  dateRange: { start: string; end: string },
) {
  // Dynamic imports - only loads when function is called
  const { jsPDF } = await import("jspdf");
  const autoTableModule = await import("jspdf-autotable");
  const autoTable = autoTableModule.default;

  const doc = new jsPDF();

  // Header
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Laporan Riwayat Patroli", 14, 22);

  // Subtitle with date range
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Periode: ${format(new Date(dateRange.start), "d MMM yyyy", { locale: id })} - ${format(new Date(dateRange.end), "d MMM yyyy", { locale: id })}`,
    14,
    30,
  );
  doc.text(
    `Dicetak: ${format(new Date(), "d MMM yyyy, HH:mm", { locale: id })}`,
    14,
    36,
  );

  // Table
  autoTable(doc, {
    startY: 45,
    head: [["No", "Tanggal", "Waktu", "Petugas", "Shift", "Lokasi", "Putaran"]],
    body: data.map((row, index) => [
      index + 1,
      row.tanggal,
      row.waktu,
      row.petugas,
      row.shift,
      row.lokasi,
      row.putaran,
    ]),
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Halaman ${i} dari ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" },
    );
  }

  doc.save(`${filename}.pdf`);
}

