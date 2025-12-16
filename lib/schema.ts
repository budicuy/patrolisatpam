import { relations } from "drizzle-orm";
import {
  doublePrecision,
  integer,
  pgTable,
  serial,
  text,
  time,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: text("username").unique().notNull(),
  name: text("name").notNull(),
  password: text("password").notNull(),
  role: text("role", { enum: ["admin", "satpam"] })
    .default("satpam")
    .notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const locations = pgTable("locations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  radius: integer("radius").default(5).notNull(), // in meters
  order: integer("order").notNull(), // patrol sequence
  createdAt: timestamp("created_at").defaultNow(),
});

export const shifts = pgTable("shifts", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const patrolHistory = pgTable("patrol_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  shiftId: uuid("shift_id")
    .references(() => shifts.id)
    .notNull(),
  locationId: uuid("location_id")
    .references(() => locations.id)
    .notNull(),
  checkInTime: timestamp("check_in_time").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  patrolLogs: many(patrolHistory),
}));

export const locationsRelations = relations(locations, ({ many }) => ({
  patrolLogs: many(patrolHistory),
}));

export const shiftsRelations = relations(shifts, ({ many }) => ({
  patrolLogs: many(patrolHistory),
}));

export const patrolHistoryRelations = relations(patrolHistory, ({ one }) => ({
  user: one(users, {
    fields: [patrolHistory.userId],
    references: [users.id],
  }),
  location: one(locations, {
    fields: [patrolHistory.locationId],
    references: [locations.id],
  }),
  shift: one(shifts, {
    fields: [patrolHistory.shiftId],
    references: [shifts.id],
  }),
}));
