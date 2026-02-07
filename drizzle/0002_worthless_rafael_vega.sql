CREATE TABLE `conversationShares` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`sharedWithUserId` int NOT NULL,
	`permission` enum('view','edit','admin') NOT NULL DEFAULT 'view',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `conversationShares_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `conversationShares` ADD CONSTRAINT `conversationShares_conversationId_conversations_id_fk` FOREIGN KEY (`conversationId`) REFERENCES `conversations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conversationShares` ADD CONSTRAINT `conversationShares_sharedWithUserId_users_id_fk` FOREIGN KEY (`sharedWithUserId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;