import { pgTable, serial, timestamp, varchar, integer, text, index } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const activities = pgTable("activities", {
	id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
	title: varchar("title", { length: 255 }).notNull(),
	startDate: timestamp("start_date", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	endDate: timestamp("end_date", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("activities_start_date_idx").on(table.startDate),
]);

export const participants = pgTable("participants", {
	id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
	activityId: varchar("activity_id", { length: 36 }).notNull(),
	name: varchar("name", { length: 128 }).notNull(),
	joinedAt: timestamp("joined_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	leftAt: timestamp("left_at", { withTimezone: true, mode: 'string' }),
	advancePayment: integer("advance_payment").default(0).notNull(),
}, (table) => [
	index("participants_activity_id_idx").on(table.activityId),
]);

export const expenses = pgTable("expenses", {
	id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
	activityId: varchar("activity_id", { length: 36 }).notNull(),
	payerId: varchar("payer_id", { length: 36 }).notNull(),
	amount: integer("amount").notNull(),
	description: text("description"),
	expenseDate: timestamp("expense_date", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("expenses_activity_id_idx").on(table.activityId),
	index("expenses_payer_id_idx").on(table.payerId),
	index("expenses_expense_date_idx").on(table.expenseDate),
]);

export const expense_participants = pgTable("expense_participants", {
	id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
	expenseId: varchar("expense_id", { length: 36 }).notNull(),
	participantId: varchar("participant_id", { length: 36 }).notNull(),
}, (table) => [
	index("expense_participants_expense_id_idx").on(table.expenseId),
	index("expense_participants_participant_id_idx").on(table.participantId),
]);
