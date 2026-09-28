import { relations } from "drizzle-orm";
import {
  boolean,
  doublePrecision,
  index,
  integer,
  pgTable,
  serial,
  text,
  time,
  timestamp,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  name: text("name").notNull(),
  password: text("password").notNull(),
  role: text("role", { enum: ["admin", "satpam", "hr"] })
    .default("satpam")
    .notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  radius: integer("radius").default(5).notNull(), // in meters
  order: integer("order").notNull().unique(), // patrol sequence
  createdAt: timestamp("created_at").defaultNow(),
});

export const shifts = pgTable("shifts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const patrolHistory = pgTable(
  "patrol_history",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id)
      .notNull(),
    shiftId: integer("shift_id")
      .references(() => shifts.id)
      .notNull(),
    locationId: integer("location_id")
      .references(() => locations.id)
      .notNull(),
    roundNumber: integer("round_number").default(1).notNull(), // Patrol round (1-5)
    checkInTime: timestamp("check_in_time").defaultNow().notNull(),
    status: text("status", { enum: ["aman", "tidak_aman"] })
      .default("aman")
      .notNull(),
    notes: text("notes"),
    imageData: text("image_data"), // S3 / Storage URL
  },
  (table) => ({
    // Indexes for frequently queried columns
    shiftIdIdx: index("patrol_history_shift_id_idx").on(table.shiftId),
    checkInTimeIdx: index("patrol_history_check_in_time_idx").on(
      table.checkInTime,
    ),
    userIdIdx: index("patrol_history_user_id_idx").on(table.userId),
    // Composite index for common query patterns
    shiftTimeIdx: index("patrol_history_shift_time_idx").on(
      table.shiftId,
      table.checkInTime,
    ),
  }),
);

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
