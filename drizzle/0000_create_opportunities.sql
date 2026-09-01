CREATE TABLE IF NOT EXISTS `opportunities` (
	`row_key` text PRIMARY KEY NOT NULL,
	`source_id` text NOT NULL,
	`owner_id` text NOT NULL,
	`company` text NOT NULL,
	`role` text NOT NULL,
	`tracks` text NOT NULL,
	`ownership` text NOT NULL,
	`scale` text NOT NULL,
	`city` text NOT NULL,
	`apply_url` text NOT NULL,
	`source_url` text NOT NULL,
	`source_label` text NOT NULL,
	`start_date` text,
	`end_date` text,
	`deadline_note` text NOT NULL,
	`recommendation` integer NOT NULL,
	`fit_reason` text NOT NULL,
	`risk_note` text NOT NULL,
	`degree_gate` text NOT NULL,
	`compensation` text DEFAULT '未公开' NOT NULL,
	`verified_at` text NOT NULL,
	`stage` text DEFAULT '待投递' NOT NULL,
	`applied_at` text,
	`next_action_at` text,
	`notes` text DEFAULT '' NOT NULL,
	`favorite` integer DEFAULT 0 NOT NULL,
	`archived` integer DEFAULT 0 NOT NULL,
	`is_custom` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `idx_opportunities_owner_source` ON `opportunities` (`owner_id`,`source_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_opportunities_owner_stage` ON `opportunities` (`owner_id`,`stage`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_opportunities_owner_deadline` ON `opportunities` (`owner_id`,`end_date`);
