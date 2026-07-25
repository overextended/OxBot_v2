CREATE TABLE `bans` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`reason` text NOT NULL,
	`issuer_id` text(20) NOT NULL,
	`target_id` text(20) NOT NULL,
	`issued_at` integer DEFAULT (unixepoch()) NOT NULL,
	`revoked_at` integer,
	`revoked_by` text(20),
	FOREIGN KEY (`issuer_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE restrict,
	FOREIGN KEY (`target_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE restrict,
	FOREIGN KEY (`revoked_by`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `idx_bans_targetid` ON `bans` (`target_id`);--> statement-breakpoint
CREATE INDEX `idx_bans_issuerid` ON `bans` (`issuer_id`);--> statement-breakpoint
CREATE TABLE `kicks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`reason` text NOT NULL,
	`issuer_id` text(20) NOT NULL,
	`target_id` text(20) NOT NULL,
	`issued_at` integer DEFAULT (unixepoch()) NOT NULL,
	`revoked_at` integer,
	`revoked_by` text(20),
	FOREIGN KEY (`issuer_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE restrict,
	FOREIGN KEY (`target_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE restrict,
	FOREIGN KEY (`revoked_by`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `idx_kicks_targetid` ON `kicks` (`target_id`);--> statement-breakpoint
CREATE INDEX `idx_kicks_issuerid` ON `kicks` (`issuer_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text(20) PRIMARY KEY NOT NULL,
	`joined_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `warns` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`reason` text NOT NULL,
	`issuer_id` text(20) NOT NULL,
	`target_id` text(20) NOT NULL,
	`issued_at` integer DEFAULT (unixepoch()) NOT NULL,
	`revoked_at` integer,
	`revoked_by` text(20),
	FOREIGN KEY (`issuer_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE restrict,
	FOREIGN KEY (`target_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE restrict,
	FOREIGN KEY (`revoked_by`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `idx_warns_targetid` ON `warns` (`target_id`);--> statement-breakpoint
CREATE INDEX `idx_warns_issuerid` ON `warns` (`issuer_id`);