import { pgTable, timestamp, uuid, text, unique } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
  name: text("name").notNull().unique(),
});

export const feeds = pgTable("feeds", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
  name: text("name").notNull(),
  url: text("url").notNull().unique(),
  //cascade ondelete so feeds are deleted when a user is removed
  userID: uuid("user_id").notNull().references(()=>users.id, {onDelete: "cascade"})
});

export const feedFollows = pgTable("feed_follows", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
  //links user to a feed in a many-to-many relationship
  userID: uuid("user_id").notNull().references(()=>users.id, {onDelete: "cascade"}),
  feedID: uuid("feed_id").notNull().references(()=>feeds.id, {onDelete: "cascade"})
  //unique constraint
},(table)=> [
  unique("user_feed_unique_idx").on(table.userID, table.feedID)
]);