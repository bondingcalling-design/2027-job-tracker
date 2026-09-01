import { env } from 'cloudflare:workers';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

export function getDb() {
  if (!env.DB) {
    throw new Error(
      'Cloudflare D1 binding `DB` is unavailable. Set the `d1` field in .openai/hosting.json to `DB` or let your control plane inject the real binding values before using the database.',
    );
  }

  return drizzle(env.DB, { schema });
}

export function getD1() {
  if (!env.DB) {
    throw new Error('Cloudflare D1 binding `DB` is unavailable.');
  }
  return env.DB;
}

let schemaReady: Promise<void> | null = null;

export function ensureSchema() {
  if (!schemaReady) {
    const d1 = getD1();
    schemaReady = (async () => {
      await d1.batch([
        d1.prepare(`CREATE TABLE IF NOT EXISTS opportunities (
          row_key TEXT PRIMARY KEY,
          source_id TEXT NOT NULL,
          owner_id TEXT NOT NULL,
          company TEXT NOT NULL,
          role TEXT NOT NULL,
          tracks TEXT NOT NULL,
          ownership TEXT NOT NULL,
          scale TEXT NOT NULL,
          city TEXT NOT NULL,
          apply_url TEXT NOT NULL,
          source_url TEXT NOT NULL,
          source_label TEXT NOT NULL,
          start_date TEXT,
          end_date TEXT,
          deadline_note TEXT NOT NULL,
          recommendation INTEGER NOT NULL,
          fit_reason TEXT NOT NULL,
          risk_note TEXT NOT NULL,
          degree_gate TEXT NOT NULL,
          compensation TEXT NOT NULL DEFAULT '未公开',
          verified_at TEXT NOT NULL,
          stage TEXT NOT NULL DEFAULT '待投递',
          applied_at TEXT,
          next_action_at TEXT,
          notes TEXT NOT NULL DEFAULT '',
          favorite INTEGER NOT NULL DEFAULT 0,
          archived INTEGER NOT NULL DEFAULT 0,
          is_custom INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )`),
        d1.prepare(`CREATE UNIQUE INDEX IF NOT EXISTS idx_opportunities_owner_source
          ON opportunities(owner_id, source_id)`),
        d1.prepare(`CREATE INDEX IF NOT EXISTS idx_opportunities_owner_stage
          ON opportunities(owner_id, stage)`),
        d1.prepare(`CREATE INDEX IF NOT EXISTS idx_opportunities_owner_deadline
          ON opportunities(owner_id, end_date)`),
      ]);
      const columns = await d1
        .prepare('PRAGMA table_info(opportunities)')
        .all<{ name: string }>();
      if (!columns.results.some((column) => column.name === 'compensation')) {
        await d1
          .prepare(
            "ALTER TABLE opportunities ADD COLUMN compensation TEXT NOT NULL DEFAULT '未公开'",
          )
          .run();
      }
      await d1.prepare('PRAGMA optimize').run();
    })();
  }
  return schemaReady;
}
