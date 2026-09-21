CREATE TABLE `lesson_evidence` (
	`learner_id` text NOT NULL,
	`lesson_id` text NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`successful_checks` integer DEFAULT 0 NOT NULL,
	`hints_requested` integer DEFAULT 0 NOT NULL,
	`mastery` integer DEFAULT 0 NOT NULL,
	`struggle_json` text DEFAULT '[]' NOT NULL,
	`independent_corrections` integer DEFAULT 0 NOT NULL,
	`last_intervention_level` integer DEFAULT 0 NOT NULL,
	`intervention_pending` integer DEFAULT false NOT NULL,
	`code_passed_at` text,
	`quick_check_passed_at` text,
	`best_quiz_score` integer DEFAULT 0 NOT NULL,
	`completed_at` text,
	`created_at` text NOT NULL,
	`last_activity_at` text NOT NULL,
	PRIMARY KEY(`learner_id`, `lesson_id`),
	FOREIGN KEY (`learner_id`) REFERENCES `learner_profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `lesson_evidence_learner_activity_idx` ON `lesson_evidence` (`learner_id`,`last_activity_at`);--> statement-breakpoint
CREATE TABLE `tutor_interventions` (
	`id` text PRIMARY KEY NOT NULL,
	`learner_id` text NOT NULL,
	`lesson_id` text NOT NULL,
	`level` integer NOT NULL,
	`focus` text NOT NULL,
	`requirement_json` text DEFAULT '[]' NOT NULL,
	`source` text DEFAULT 'check' NOT NULL,
	`resolved_independently` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`learner_id`) REFERENCES `learner_profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `tutor_interventions_learner_lesson_idx` ON `tutor_interventions` (`learner_id`,`lesson_id`,`created_at`);