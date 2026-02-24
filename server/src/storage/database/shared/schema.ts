import { pgTable, index, varchar, timestamp, serial, integer, text } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const activities = pgTable("activities", {
	id: varchar({ length: 36 }).default(gen_random_uuid()).primaryKey().notNull(),
	title: varchar({ length: 255 }).notNull(),
	startDate: timestamp("start_date", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	endDate: timestamp("end_date", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("activities_start_date_idx").using("btree", table.startDate.asc().nullsLast().op("timestamptz_ops")),
]);

export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const expenses = pgTable("expenses", {
	id: varchar({ length: 36 }).default(gen_random_uuid()).primaryKey().notNull(),
	activityId: varchar("activity_id", { length: 36 }).notNull(),
	amount: integer().notNull(),
	description: text(),
	expenseDate: timestamp("expense_date", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("expenses_activity_id_idx").using("btree", table.activityId.asc().nullsLast().op("text_ops")),
	index("expenses_expense_date_idx").using("btree", table.expenseDate.asc().nullsLast().op("timestamptz_ops")),
]);

export const participants = pgTable("participants", {
	id: varchar({ length: 36 }).default(gen_random_uuid()).primaryKey().notNull(),
	activityId: varchar("activity_id", { length: 36 }).notNull(),
	name: varchar({ length: 128 }).notNull(),
	joinedAt: timestamp("joined_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	leftAt: timestamp("left_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("participants_activity_id_idx").using("btree", table.activityId.asc().nullsLast().op("text_ops")),
]);
