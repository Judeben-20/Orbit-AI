import { pgTable, text, timestamp, uuid, jsonb, boolean, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const agents = pgTable("agents", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  avatarSeed: text("avatar_seed").notNull(),
  instructions: text("instructions"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  agentId: uuid("agent_id").references(() => agents.id, { onDelete: 'cascade' }).notNull(),
  userId: text("user_id").notNull(),
  role: text("role").notNull(), // 'user' | 'assistant' | 'tool'
  content: text("content").notNull(),
  parts: jsonb("parts").$type<unknown[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const connections = pgTable("connections", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  appSlug: text("app_slug").notNull(),
  composioConnectedAccountId: text("composio_connected_account_id").notNull(),
  status: text("status").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const agentConnections = pgTable("agent_connections", {
  agentId: uuid("agent_id").references(() => agents.id, { onDelete: 'cascade' }).notNull(),
  connectionId: uuid("connection_id").references(() => connections.id, { onDelete: 'cascade' }).notNull(),
});

export const routines = pgTable("routines", {
  id: uuid("id").primaryKey().defaultRandom(),
  agentId: uuid("agent_id").references(() => agents.id, { onDelete: 'cascade' }).notNull(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  prompt: text("prompt").notNull(),
  cron: text("cron").notNull(),
  timezone: text("timezone").notNull(),
  requiredApps: text("required_apps").array(),
  status: text("status").notNull(), // 'proposed' | 'active' | 'paused'
  nextRunAt: timestamp("next_run_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const routineRuns = pgTable("routine_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  routineId: uuid("routine_id").references(() => routines.id, { onDelete: 'cascade' }).notNull(),
  status: text("status").notNull(), // 'queued'|'running'|'success'|'failed'|'needs_approval'
  startedAt: timestamp("started_at").defaultNow().notNull(),
  finishedAt: timestamp("finished_at"),
  output: text("output"),
  error: text("error"),
});

export const usage = pgTable("usage", {
  userId: text("user_id").notNull(),
  period: text("period").notNull(), // YYYY-MM
  tokensUsed: integer("tokens_used").default(0).notNull(),
  runsUsed: integer("runs_used").default(0).notNull(),
});

// Relations
export const agentsRelations = relations(agents, ({ many }) => ({
  messages: many(messages),
  routines: many(routines),
}));

export const routinesRelations = relations(routines, ({ one, many }) => ({
  agent: one(agents, {
    fields: [routines.agentId],
    references: [agents.id],
  }),
  runs: many(routineRuns),
}));

export const routineRunsRelations = relations(routineRuns, ({ one }) => ({
  routine: one(routines, {
    fields: [routineRuns.routineId],
    references: [routines.id],
  }),
}));
