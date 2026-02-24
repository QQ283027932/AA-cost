import { pgTable, serial, timestamp, varchar, integer, text, index } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// Activities table - AA 费用分摊活动
export const activities = pgTable("activities", {
	id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
	title: varchar("title", { length: 255 }).notNull(),
	totalAmount: integer("total_amount").notNull().default(0),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("activities_created_at_idx").on(table.createdAt),
]);

// Participants table - 活动参与者
export const participants = pgTable("participants", {
	id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
	activityId: varchar("activity_id", { length: 36 }).notNull(),
	name: varchar("name", { length: 128 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("participants_activity_id_idx").on(table.activityId),
]);
