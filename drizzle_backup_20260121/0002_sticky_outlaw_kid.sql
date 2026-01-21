ALTER TABLE `mentorados` DROP FOREIGN KEY `mentorados_userId_users_id_fk`;
--> statement-breakpoint
ALTER TABLE `mentorados` MODIFY COLUMN `userId` int;--> statement-breakpoint
ALTER TABLE `mentorados` ADD `email` varchar(320);--> statement-breakpoint
ALTER TABLE `mentorados` ADD CONSTRAINT `mentorados_email_unique` UNIQUE(`email`);--> statement-breakpoint
ALTER TABLE `mentorados` ADD CONSTRAINT `mentorados_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;