CREATE TABLE `scamImageHashes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`hash` text NOT NULL,
	`added_at` integer,
	`added_by` text(20),
	FOREIGN KEY (`added_by`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `scamImageHashes_hash_unique` ON `scamImageHashes` (`hash`);