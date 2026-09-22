CREATE TABLE `assessment_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`learner_id` text NOT NULL,
	`course_id` text NOT NULL,
	`kind` text NOT NULL,
	`module_id` text,
	`form_id` text NOT NULL,
	`content_version` text NOT NULL,
	`status` text DEFAULT 'in_progress' NOT NULL,
	`stage` text DEFAULT 'knowledge' NOT NULL,
	`draft_json` text DEFAULT '{}' NOT NULL,
	`answers_json` text DEFAULT '[]' NOT NULL,
	`code_json` text DEFAULT '{}' NOT NULL,
	`knowledge_awarded` integer DEFAULT 0 NOT NULL,
	`knowledge_total` integer DEFAULT 0 NOT NULL,
	`practical_awarded` integer DEFAULT 0 NOT NULL,
	`practical_total` integer DEFAULT 0 NOT NULL,
	`debug_awarded` integer DEFAULT 0 NOT NULL,
	`debug_total` integer DEFAULT 0 NOT NULL,
	`build_awarded` integer DEFAULT 0 NOT NULL,
	`build_total` integer DEFAULT 0 NOT NULL,
	`total_awarded` integer DEFAULT 0 NOT NULL,
	`total_available` integer DEFAULT 0 NOT NULL,
	`mandatory_passed` integer DEFAULT false NOT NULL,
	`needs_verification` integer DEFAULT false NOT NULL,
	`defence_passed` integer DEFAULT false NOT NULL,
	`outcome` text,
	`started_at` text NOT NULL,
	`saved_at` text,
	`submitted_at` text,
	FOREIGN KEY (`learner_id`) REFERENCES `learner_profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `assessment_attempts_learner_created_idx` ON `assessment_attempts` (`learner_id`,`started_at`);--> statement-breakpoint
CREATE INDEX `assessment_attempts_learner_form_idx` ON `assessment_attempts` (`learner_id`,`kind`,`form_id`);--> statement-breakpoint
CREATE INDEX `assessment_attempts_learner_scope_idx` ON `assessment_attempts` (`learner_id`,`course_id`,`kind`,`module_id`);--> statement-breakpoint
CREATE TABLE `assessment_credentials` (
	`id` text PRIMARY KEY NOT NULL,
	`learner_id` text NOT NULL,
	`course_id` text NOT NULL,
	`level` text NOT NULL,
	`certificate_name` text NOT NULL,
	`project_title` text DEFAULT '' NOT NULL,
	`skills_json` text DEFAULT '[]' NOT NULL,
	`attempt_id` text NOT NULL,
	`issued_at` text NOT NULL,
	FOREIGN KEY (`learner_id`) REFERENCES `learner_profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`attempt_id`) REFERENCES `assessment_attempts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `assessment_credentials_learner_course_unique` ON `assessment_credentials` (`learner_id`,`course_id`);--> statement-breakpoint
CREATE TABLE `assessment_defence` (
	`attempt_id` text PRIMARY KEY NOT NULL,
	`learner_id` text NOT NULL,
	`course_id` text NOT NULL,
	`template_id` text NOT NULL,
	`explain_item_id` text NOT NULL,
	`predict_item_id` text NOT NULL,
	`predict_expected` text NOT NULL,
	`change_item_id` text NOT NULL,
	`change_prompt` text NOT NULL,
	`explain_response` text DEFAULT '' NOT NULL,
	`predict_response` text DEFAULT '' NOT NULL,
	`change_code_json` text DEFAULT '{}' NOT NULL,
	`predict_correct` integer DEFAULT false NOT NULL,
	`change_status` text DEFAULT 'pending' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`attempt_id`) REFERENCES `assessment_attempts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`learner_id`) REFERENCES `learner_profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `assessment_defence_learner_idx` ON `assessment_defence` (`learner_id`,`course_id`);--> statement-breakpoint
CREATE TABLE `assessment_item_results` (
	`attempt_id` text NOT NULL,
	`learner_id` text NOT NULL,
	`item_id` text NOT NULL,
	`requirement_id` text DEFAULT '' NOT NULL,
	`form_id` text NOT NULL,
	`content_version` text NOT NULL,
	`item_type` text NOT NULL,
	`concept` text DEFAULT '' NOT NULL,
	`status` text NOT NULL,
	`awarded` integer DEFAULT 0 NOT NULL,
	`available` integer DEFAULT 0 NOT NULL,
	`mandatory` text,
	`detail` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	PRIMARY KEY(`attempt_id`, `item_id`, `requirement_id`),
	FOREIGN KEY (`attempt_id`) REFERENCES `assessment_attempts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`learner_id`) REFERENCES `learner_profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `assessment_item_results_learner_concept_idx` ON `assessment_item_results` (`learner_id`,`concept`);--> statement-breakpoint
CREATE TABLE `assessment_revision_items` (
	`learner_id` text NOT NULL,
	`course_id` text NOT NULL,
	`concept` text NOT NULL,
	`label` text NOT NULL,
	`lesson_id` text DEFAULT '' NOT NULL,
	`source_attempt_id` text NOT NULL,
	`source_kind` text NOT NULL,
	`mandatory` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`readiness_passed_at` text,
	`readiness_json` text DEFAULT '{}' NOT NULL,
	PRIMARY KEY(`learner_id`, `course_id`, `concept`),
	FOREIGN KEY (`learner_id`) REFERENCES `learner_profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `assessment_revision_items_learner_idx` ON `assessment_revision_items` (`learner_id`,`course_id`,`readiness_passed_at`);--> statement-breakpoint
CREATE TABLE `assessment_signals` (
	`attempt_id` text PRIMARY KEY NOT NULL,
	`learner_id` text NOT NULL,
	`visibility_changes` integer DEFAULT 0 NOT NULL,
	`paste_events` integer DEFAULT 0 NOT NULL,
	`largest_paste_chars` integer DEFAULT 0 NOT NULL,
	`save_count` integer DEFAULT 0 NOT NULL,
	`first_saved_at` text,
	`last_saved_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`attempt_id`) REFERENCES `assessment_attempts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`learner_id`) REFERENCES `learner_profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `assessment_signals_learner_idx` ON `assessment_signals` (`learner_id`);