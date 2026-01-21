CREATE TABLE `feedbacks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`mentoradoId` int NOT NULL,
	`ano` int NOT NULL,
	`mes` int NOT NULL,
	`analiseMes` text NOT NULL,
	`focoProximoMes` text NOT NULL,
	`sugestaoMentor` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `feedbacks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mentorados` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`nomeCompleto` varchar(255) NOT NULL,
	`turma` enum('neon_estrutura','neon_escala') NOT NULL,
	`metaFaturamento` int NOT NULL DEFAULT 16000,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mentorados_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `metricas_mensais` (
	`id` int AUTO_INCREMENT NOT NULL,
	`mentoradoId` int NOT NULL,
	`ano` int NOT NULL,
	`mes` int NOT NULL,
	`faturamento` int NOT NULL DEFAULT 0,
	`lucro` int NOT NULL DEFAULT 0,
	`postsFeed` int NOT NULL DEFAULT 0,
	`stories` int NOT NULL DEFAULT 0,
	`leads` int NOT NULL DEFAULT 0,
	`procedimentos` int NOT NULL DEFAULT 0,
	`observacoes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `metricas_mensais_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `feedbacks` ADD CONSTRAINT `feedbacks_mentoradoId_mentorados_id_fk` FOREIGN KEY (`mentoradoId`) REFERENCES `mentorados`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mentorados` ADD CONSTRAINT `mentorados_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `metricas_mensais` ADD CONSTRAINT `metricas_mensais_mentoradoId_mentorados_id_fk` FOREIGN KEY (`mentoradoId`) REFERENCES `mentorados`(`id`) ON DELETE cascade ON UPDATE no action;