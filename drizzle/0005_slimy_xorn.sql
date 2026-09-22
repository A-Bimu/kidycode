CREATE TABLE `guardian_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`platform_user_id` text NOT NULL,
	`email` text NOT NULL,
	`display_name` text,
	`created_at` text NOT NULL,
	`last_sign_in_at` text NOT NULL,
	`failed_claim_attempts` integer DEFAULT 0 NOT NULL,
	`last_claim_attempt_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `guardian_accounts_platform_user_unique` ON `guardian_accounts` (`platform_user_id`);--> statement-breakpoint
CREATE TABLE `guardian_connect_codes` (
	`id` text PRIMARY KEY NOT NULL,
	`learner_id` text NOT NULL,
	`code_digest` text NOT NULL,
	`created_at` text NOT NULL,
	`expires_at` text NOT NULL,
	`used_at` text,
	`used_by_guardian_id` text,
	`invalidated_at` text,
	`failed_attempts` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`learner_id`) REFERENCES `learner_profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`used_by_guardian_id`) REFERENCES `guardian_accounts`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `guardian_connect_codes_digest_unique` ON `guardian_connect_codes` (`code_digest`);--> statement-breakpoint
CREATE INDEX `guardian_connect_codes_learner_idx` ON `guardian_connect_codes` (`learner_id`,`expires_at`);--> statement-breakpoint
CREATE TABLE `guardian_links` (
	`id` text PRIMARY KEY NOT NULL,
	`link_ref` text NOT NULL,
	`guardian_id` text NOT NULL,
	`learner_id` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`initiated_by` text DEFAULT 'learner' NOT NULL,
	`connected_at` text NOT NULL,
	`revoked_at` text,
	FOREIGN KEY (`guardian_id`) REFERENCES `guardian_accounts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`learner_id`) REFERENCES `learner_profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `guardian_links_pair_unique` ON `guardian_links` (`guardian_id`,`learner_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `guardian_links_ref_unique` ON `guardian_links` (`link_ref`);--> statement-breakpoint
CREATE INDEX `guardian_links_learner_idx` ON `guardian_links` (`learner_id`,`status`);
--> statement-breakpoint
PRAGMA optimize;
