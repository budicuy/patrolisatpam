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

    console.log("~~~ Seeding ALL complete! ~~~ 👍👍👍");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

main();
