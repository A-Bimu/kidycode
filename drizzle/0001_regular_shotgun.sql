CREATE INDEX `course_progress_learner_updated_idx` ON `course_progress` (`learner_id`,`updated_at`);--> statement-breakpoint
CREATE INDEX `exam_attempts_learner_created_idx` ON `exam_attempts` (`learner_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `project_checkpoints_learner_stage_idx` ON `project_checkpoints` (`learner_id`,`stage_id`,`created_at`);