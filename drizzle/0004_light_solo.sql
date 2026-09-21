CREATE TABLE `concept_review` (
	`learner_id` text NOT NULL,
	`concept` text NOT NULL,
	`label` text NOT NULL,
	`lesson_id` text NOT NULL,
	`times_failed` integer DEFAULT 1 NOT NULL,
	`times_recovered` integer DEFAULT 0 NOT NULL,
	`review_streak` integer DEFAULT 0 NOT NULL,
	`due` integer DEFAULT true NOT NULL,
	`first_failed_at` text NOT NULL,
	`last_failed_at` text NOT NULL,
	`last_reviewed_at` text,
	PRIMARY KEY(`learner_id`, `concept`),
	FOREIGN KEY (`learner_id`) REFERENCES `learner_profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `concept_review_due_idx` ON `concept_review` (`learner_id`,`due`,`last_failed_at`);