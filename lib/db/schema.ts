import { relations } from "drizzle-orm";
import {
  date,
  decimal,
  int,
  mysqlEnum,
  mysqlTable,
  serial,
  time,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// Users Table
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(), // Hashed
  role: mysqlEnum("role", ["admin", "satpam"]).notNull().default("satpam"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Locations Table
export const locations = mysqlTable("locations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  radius: int("radius").default(5).notNull(), // meters
  sequenceOrder: int("sequence_order").default(0), // For route ordering
  createdAt: timestamp("created_at").defaultNow(),
});

// Shifts Table
export const shifts = mysqlTable("shifts", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(), // e.g., "Shift 1"
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
});

// Patrol Sessions (Track the whole patrol session: Date, Start, End)
export const patrolSessions = mysqlTable("patrol_sessions", {
  id: serial("id").primaryKey(),
  userId: int("user_id").notNull(),
  shiftId: int("shift_id"),
  date: date("date").notNull(), // Date of patrol
  startTime: time("start_time"), // When they clicked "Start"
  endTime: time("end_time"), // When they clicked "Finish"
  status: mysqlEnum("status", ["ongoing", "completed"]).default("ongoing"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Patrol Logs (Check-ins at specific locations)
export const patrolLogs = mysqlTable("patrol_logs", {
  id: serial("id").primaryKey(),
  sessionId: int("session_id").notNull(), // Link to session
  locationId: int("location_id").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  status: mysqlEnum("status", ["checked_in", "skipped"]).default("checked_in"),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(patrolSessions),
}));

export const sessionsRelations = relations(patrolSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [patrolSessions.userId],
    references: [users.id],
  }),
  shift: one(shifts, {
    fields: [patrolSessions.shiftId],
    references: [shifts.id],
  }),
  logs: many(patrolLogs),
}));

export const logsRelations = relations(patrolLogs, ({ one }) => ({
  session: one(patrolSessions, {
    fields: [patrolLogs.sessionId],
    references: [patrolSessions.id],
  }),
  location: one(locations, {
    fields: [patrolLogs.locationId],
    references: [locations.id],
  }),
}));
