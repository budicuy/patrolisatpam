import { hash } from "bcryptjs";
import { db } from "./lib/db";
import { locations, patrolHistory, shifts, users } from "./lib/schema";

const passHasSatpam = await hash("satpam123", 10);

const main = async () => {
  try {
    await db.delete(patrolHistory);
    await db.delete(locations);
    await db.delete(users);
    await db.delete(shifts);

    await db
      .insert(locations)
      .values([
        {
          name: "Kantor Utama",
          latitude: -3.549538,
          longitude: 114.730745,
          radius: 10,
          order: 1,
        },
        {
          name: "Area Locker Depan Ruang GAS",
          latitude: -3.549033,
          longitude: 114.730356,
          radius: 10,
          order: 2,
        },
        {
          name: "Poliklinik",
          latitude: -3.548831,
          longitude: 114.73004,
          radius: 10,
          order: 3,
        },
        {
          name: "Ruang Boiler",
          latitude: -3.5491137289677,
          longitude: 114.729492379713,
          radius: 10,
          order: 4,
        },
        {
          name: "Pos Jembatan Timbang",
          latitude: -3.548359,
          longitude: 114.729316,
          radius: 10,
          order: 5,
        },
        {
          name: "Gudang Cangkang Sawit",
          latitude: -3.548748,
          longitude: 114.728953,
          radius: 10,
          order: 6,
        },
        {
          name: "Ruang Hydran",
          latitude: -3.549439,
          longitude: 114.729306,
          radius: 10,
          order: 7,
        },
        {
          name: "Gudang Tepung",
          latitude: -3.549881,
          longitude: 114.72917,
          radius: 10,
          order: 8,
        },
        {
          name: "Gudang FG",
          latitude: -3.550595,
          longitude: 114.730152,
          radius: 10,
          order: 9,
        },
        {
          name: "Gudang Bumbu",
          latitude: -3.549684,
          longitude: 114.730532,
          radius: 10,
          order: 10,
        },
      ])
      .onConflictDoNothing();
    console.log("~~~ Seeding locations complete! ~~~ 👌");

    await db
      .insert(users)
      .values([
        {
          username: "admin",
          name: "Administrator",
          password: await hash("admin123", 10),
          role: "admin",
        },
        {
          username: "satpam1",
          name: "Satpam 01",
          password: passHasSatpam,
          role: "satpam",
        },
        {
          username: "satpam2",
          name: "Satpam 02",
          password: passHasSatpam,
          role: "satpam",
        },
        {
          username: "satpam3",
          name: "Satpam 03",
          password: passHasSatpam,
          role: "satpam",
        },
      ])
      .onConflictDoNothing();
    console.log("~~~ Seeding users complete! ~~~ 👌");

    await db
      .insert(shifts)
      .values([
        {
          name: "Shift 1",
          startTime: "07:30",
          endTime: "15:30",
        },
        {
          name: "Shift 2",
          startTime: "15:30",
          endTime: "23:30",
        },
        {
          name: "Shift 3",
          startTime: "23:30",
          endTime: "07:30",
        },
      ])
      .onConflictDoNothing();
    console.log("~~~ Seeding shifts complete! ~~~ 👌");

    // --- Generate Dummy Patrol History ---
    console.log("Started generate dummy patrol history...");

    // 1. Fetch Master Data
    const allUsers = await db.select().from(users);
    const allLocations = await db.select().from(locations);
    const allShifts = await db.select().from(shifts);

    const satpamUsers = allUsers.filter((u) => u.role === "satpam");
    if (
      satpamUsers.length === 0 ||
      allLocations.length === 0 ||
      allShifts.length === 0
    ) {
      console.warn("Skipping history seeding: Missing master data.");
      process.exit(0);
    }

    const logsToInsert: (typeof patrolHistory.$inferInsert)[] = [];
    const DAYS_TO_GENERATE = 7;
    // const LOGS_PER_SHIFT = 20; // Removed, now using allLocations.length

    const notesExamples = [
      "Pintu tidak terkunci",
      "Lampu koridor mati",
      "Ada barang mencurigakan",
      "Kaca jendela retak",
      "Keran air bocor",
      null,
      null,
      null,
      null,
      null, // bias towards null (safe) slightly if used with random
    ];

    for (let i = 0; i < DAYS_TO_GENERATE; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i); // Go back i days

      for (const shift of allShifts) {
        // Base time for this shift on this date
        // Simple logic: parse startTime to get hours
        const [startHour] = shift.startTime.split(":");
        const shiftStart = new Date(date);
        shiftStart.setHours(Number(startHour), 0, 0, 0);

        // Generate 1 log per location for this shift (Total 10 locations)
        // Shuffle locations slightly to make time sequence interesting?
        // Or just iterate standard order. Let's Shuffle for "realistic" randomness in path.
        const shuffledLocations = [...allLocations].sort(
          () => Math.random() - 0.5,
        );

        let minuteOffset = 0;
        for (const location of shuffledLocations) {
          const randomUser =
            satpamUsers[Math.floor(Math.random() * satpamUsers.length)];
          const isUnsafe = Math.random() < 0.1; // 10% chance unsafe

          // Sequential time: 10-20 mins apart
          minuteOffset += 10 + Math.floor(Math.random() * 10);

          const logTime = new Date(shiftStart);
          logTime.setMinutes(logTime.getMinutes() + minuteOffset);

          logsToInsert.push({
            userId: randomUser.id,
            shiftId: shift.id,
            locationId: location.id,
            checkInTime: logTime,
            status: isUnsafe ? "tidak_aman" : "aman",
            notes: isUnsafe
              ? notesExamples[Math.floor(Math.random() * 5)] // Pick an unsafe note
              : null,
            imageData: isUnsafe
              ? "https://placehold.co/600x400/red/white?text=BUKTI+BAHAYA"
              : null,
          });
        }
      }
    }

    // Batch insert (Drizzle insert many)
    // Chunking if too large might be needed in real scenario, but 7*3*20 = 420 rows is fine.
    if (logsToInsert.length > 0) {
      await db.insert(patrolHistory).values(logsToInsert);
      console.log(
        `~~~ Inserted ${logsToInsert.length} dummy patrol logs! ~~~ 🚀`,
      );
    }

    console.log("~~~ Seeding ALL complete! ~~~ 👍👍👍");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

main();
