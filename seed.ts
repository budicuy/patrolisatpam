import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("❌ DATABASE_URL environment variable is not set in .env");
  process.exit(1);
}

const main = async () => {
  const startTime = Date.now();
  console.log("🌱 Memulai proses seeding database dari data backup.sql...\n");

  const sqlPath = path.resolve(process.cwd(), "backup.sql");
  if (!fs.existsSync(sqlPath)) {
    console.error(`❌ File backup tidak ditemukan di: ${sqlPath}`);
    process.exit(1);
  }

  // max: 1 diperlukan agar postgres-js mengizinkan transaksi BEGIN ... COMMIT dari file SQL
  const sql = postgres(connectionString, { prepare: false, max: 1 });

  try {
    console.log("⏳ Menjalankan eksekusi backup.sql (skema, tabel, sequence, constraints & 37.000+ data)...");
    await sql.file(sqlPath);

    // Ambil rekapitulasi data yang berhasil di-seed
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;

    console.log("\n✅ Seeding database berhasil diselesaikan!");
    console.log("📊 Rekapitulasi Data yang Masuk:");
    for (const t of tables) {
      const countRes = await sql.unsafe(`SELECT COUNT(*) as count FROM "public"."${t.table_name}"`);
      console.log(`   - ${t.table_name.padEnd(16)} : ${Number(countRes[0].count).toLocaleString()} baris`);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n⏱️ Total durasi: ${duration} detik`);
    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Terjadi kesalahan saat seeding:", error);
    await sql.end();
    process.exit(1);
  }
};

main();
