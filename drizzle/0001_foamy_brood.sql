CREATE TABLE `guildInvites` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`invite` text NOT NULL,
	`added_at` integer,
	`added_by` text(20),
	FOREIGN KEY (`added_by`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `guildInvites_invite_unique` ON `guildInvites` (`invite`);--> statement-breakpoint
CREATE INDEX `idx_guildinvites_name` ON `guildInvites` (`name`);--> statement-breakpoint
INSERT INTO `guildInvites` (id, name, invite, added_at, added_by) VALUES
    (1, 'Community Ox', 'https://discord.gg/cHUbNqKQf8', 0, '1'),
    (2, 'ESX', 'https://discord.gg/RPX2GssV6r', 0, '1'),
    (3, 'txAdmin', 'https://discord.gg/yWxjt9zPWR', 0, '1'),
    (4, 'Cfx.re', 'https://discord.gg/fivem', 0, '1'),
    (5, 'Warden', 'https://discord.gg/MVNZR73Ghf', 0, '1');
