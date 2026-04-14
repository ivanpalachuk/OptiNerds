import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  password: text('password').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const cuts = sqliteTable('cuts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  boardWidth: integer('board_width').notNull(),
  boardHeight: integer('board_height').notNull(),
  boardThick: integer('board_thick').notNull().default(18),
  boardQty: integer('board_qty').notNull().default(1),
  kerf: integer('kerf').notNull().default(3),
  pieces: text('pieces', { mode: 'json' }).notNull().$type<unknown>(),
  result: text('result', { mode: 'json' }).$type<unknown>(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  cuts: many(cuts),
}));

export const cutsRelations = relations(cuts, ({ one }) => ({
  user: one(users, { fields: [cuts.userId], references: [users.id] }),
}));
