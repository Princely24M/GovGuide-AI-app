import { boolean, double, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const governmentServiceLocations = mysqlTable("government_service_locations", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  organisation: varchar("organisation", { length: 255 }).notNull(),
  department: varchar("department", { length: 255 }).notNull(),
  serviceCategory: varchar("serviceCategory", { length: 100 }).notNull(),
  serviceIds: text("serviceIds").notNull(),
  province: varchar("province", { length: 100 }).notNull(),
  city: varchar("city", { length: 120 }).notNull(),
  municipality: varchar("municipality", { length: 160 }),
  address: text("address"),
  latitude: double("latitude"),
  longitude: double("longitude"),
  phone: varchar("phone", { length: 80 }),
  email: varchar("email", { length: 320 }),
  website: text("website"),
  openingHours: text("openingHours"),
  verified: boolean("verified").default(false).notNull(),
  lastVerified: timestamp("lastVerified"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GovernmentServiceLocation = typeof governmentServiceLocations.$inferSelect;
export type InsertGovernmentServiceLocation = typeof governmentServiceLocations.$inferInsert;
