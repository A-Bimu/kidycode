CREATE TABLE `member_cohort_assignments` (
	`id` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`cohort_id` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`assigned_by` text DEFAULT 'organisation' NOT NULL,
	`assigned_at` text NOT NULL,
	`revoked_at` text,
	FOREIGN KEY (`member_id`) REFERENCES `organisation_members`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`cohort_id`) REFERENCES `cohorts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `member_cohort_assignments_pair_unique` ON `member_cohort_assignments` (`member_id`,`cohort_id`);--> statement-breakpoint
CREATE INDEX `member_cohort_assignments_member_idx` ON `member_cohort_assignments` (`member_id`,`status`);--> statement-breakpoint
CREATE INDEX `member_cohort_assignments_cohort_idx` ON `member_cohort_assignments` (`cohort_id`,`status`);