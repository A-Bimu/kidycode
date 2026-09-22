CREATE TABLE `learner_transfer_codes` (
	`id` text PRIMARY KEY NOT NULL,
	`learner_id` text NOT NULL,
	`code_digest` text NOT NULL,
	`created_by` text DEFAULT 'learner' NOT NULL,
	`created_at` text NOT NULL,
	`expires_at` text NOT NULL,
	`used_at` text,
	`used_by_device` text,
	`applied_at` text,
	`invalidated_at` text,
	`failed_attempts` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`learner_id`) REFERENCES `learner_profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `learner_transfer_codes_digest_unique` ON `learner_transfer_codes` (`code_digest`);--> statement-breakpoint
CREATE INDEX `learner_transfer_codes_learner_idx` ON `learner_transfer_codes` (`learner_id`,`expires_at`);--> statement-breakpoint
CREATE TABLE `transfer_claim_limits` (
	`scope` text PRIMARY KEY NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`window_at` text
);
--> statement-breakpoint
PRAGMA optimize;
