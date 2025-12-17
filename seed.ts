import { hash } from "bcryptjs";
import { db } from "./lib/db";
import { users, shifts, locations, patrolHistory } from "./lib/schema";


const passHasSatpam = await hash("satpam123", 10)

const main = async () => {
  try {
    await db.delete(patrolHistory);
    await db.delete(locations);
    await db.delete(users);
    await db.delete(shifts);

    await db.insert(locations).values([
      {
        name: "GAS",
        latitude: -3.549033,
        longitude: 114.730356,
        radius: 200,
        order: 1,
      },
      {
        name: "GAS 2",
        latitude: -3.549033,
        longitude: 114.730356,
        radius: 200,
        order: 2,
      },
    ]).onConflictDoNothing();
    console.log("~~~ Seeding locations complete! ~~~ 👌");

    await db.insert(users).values([
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
    ]).onConflictDoNothing();
    console.log("~~~ Seeding users complete! ~~~ 👌");

    await db.insert(shifts).values([
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
    ]).onConflictDoNothing();
    console.log("~~~ Seeding shifts complete! ~~~ 👌");

    console.log("~~~ Seeding ALL complete! ~~~ 👍👍👍");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

main();
