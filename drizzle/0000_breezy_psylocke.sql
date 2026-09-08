CREATE TABLE `course_progress` (
	`learner_id` text NOT NULL,
	`lesson_id` text NOT NULL,
	`status` text DEFAULT 'started' NOT NULL,
	`question_correct` integer DEFAULT false NOT NULL,
	`reflection` text DEFAULT '' NOT NULL,
	`workspace_json` text DEFAULT '{}' NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`learner_id`, `lesson_id`),
	FOREIGN KEY (`learner_id`) REFERENCES `learner_profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `exam_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`learner_id` text NOT NULL,
	`score` integer NOT NULL,
	`total` integer NOT NULL,
	`answers_json` text NOT NULL,
	`practical_json` text NOT NULL,
	`passed` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`learner_id`) REFERENCES `learner_profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `learner_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`access_hash` text NOT NULL,
	`nickname` text NOT NULL,
	`age` integer NOT NULL,
	`theme` text NOT NULL,
	`created_at` text NOT NULL,
	`last_seen_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `learner_profiles_access_hash_unique` ON `learner_profiles` (`access_hash`);--> statement-breakpoint
CREATE TABLE `project_checkpoints` (
	`id` text PRIMARY KEY NOT NULL,
	`learner_id` text NOT NULL,
	`stage_id` text NOT NULL,
	`version` integer NOT NULL,
	`project_json` text NOT NULL,
	`reflection` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`learner_id`) REFERENCES `learner_profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
