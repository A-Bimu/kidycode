CREATE TABLE `academic_reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`cohort_id` text NOT NULL,
	`learner_id` text NOT NULL,
	`reviewer_member_id` text,
	`scope` text NOT NULL,
	`outcome` text DEFAULT 'pending' NOT NULL,
	`evidence_json` text DEFAULT '{}' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`decided_at` text,
	FOREIGN KEY (`cohort_id`) REFERENCES `cohorts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`learner_id`) REFERENCES `learner_profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`reviewer_member_id`) REFERENCES `organisation_members`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `academic_reviews_cohort_learner_scope_unique` ON `academic_reviews` (`cohort_id`,`learner_id`,`scope`);--> statement-breakpoint
CREATE INDEX `academic_reviews_reviewer_idx` ON `academic_reviews` (`reviewer_member_id`,`outcome`);--> statement-breakpoint
CREATE TABLE `cohort_enrolments` (
	`id` text PRIMARY KEY NOT NULL,
	`cohort_id` text NOT NULL,
	`learner_id` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`enrolled_by` text DEFAULT 'organisation' NOT NULL,
	`enrolled_at` text NOT NULL,
	`revoked_at` text,
	FOREIGN KEY (`cohort_id`) REFERENCES `cohorts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`learner_id`) REFERENCES `learner_profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cohort_enrolments_pair_unique` ON `cohort_enrolments` (`cohort_id`,`learner_id`);--> statement-breakpoint
CREATE INDEX `cohort_enrolments_learner_idx` ON `cohort_enrolments` (`learner_id`,`status`);--> statement-breakpoint
CREATE TABLE `cohorts` (
	`id` text PRIMARY KEY NOT NULL,
	`organisation_id` text NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`course_id` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`organisation_id`) REFERENCES `organisations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cohorts_organisation_code_unique` ON `cohorts` (`organisation_id`,`code`);--> statement-breakpoint
CREATE INDEX `cohorts_organisation_course_idx` ON `cohorts` (`organisation_id`,`course_id`,`status`);--> statement-breakpoint
CREATE TABLE `organisation_members` (
	`id` text PRIMARY KEY NOT NULL,
	`organisation_id` text NOT NULL,
	`platform_user_id` text NOT NULL,
	`email` text NOT NULL,
	`display_name` text,
	`role` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text NOT NULL,
	`last_seen_at` text NOT NULL,
	FOREIGN KEY (`organisation_id`) REFERENCES `organisations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `organisation_members_identity_unique` ON `organisation_members` (`platform_user_id`,`organisation_id`);--> statement-breakpoint
CREATE INDEX `organisation_members_org_role_idx` ON `organisation_members` (`organisation_id`,`role`,`status`);--> statement-breakpoint
CREATE TABLE `organisations` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`kind` text DEFAULT 'school' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `organisations_slug_unique` ON `organisations` (`slug`);