CREATE TABLE `kicks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`reason` text NOT NULL,
	`issuer_id` text(20) NOT NULL,
	`target_id` text(20) NOT NULL,
	`issued_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`issuer_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE restrict,
	FOREIGN KEY (`target_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `idx_kicks_targetid` ON `kicks` (`target_id`);--> statement-breakpoint
CREATE INDEX `idx_kicks_issuerid` ON `kicks` (`issuer_id`);