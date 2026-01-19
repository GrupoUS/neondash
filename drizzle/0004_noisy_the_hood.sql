CREATE TABLE `badges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`codigo` varchar(50) NOT NULL,
	`nome` varchar(100) NOT NULL,
	`descricao` text NOT NULL,
	`icone` varchar(50) NOT NULL,
	`cor` varchar(20) NOT NULL DEFAULT 'gold',
	`categoria` enum('faturamento','conteudo','operacional','consistencia','especial') NOT NULL,
	`criterio` text NOT NULL,
	`pontos` int NOT NULL DEFAULT 10,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `badges_id` PRIMARY KEY(`id`),
	CONSTRAINT `badges_codigo_unique` UNIQUE(`codigo`)
);
--> statement-breakpoint
CREATE TABLE `mentorado_badges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`mentoradoId` int NOT NULL,
	`badgeId` int NOT NULL,
	`conquistadoEm` timestamp NOT NULL DEFAULT (now()),
	`ano` int NOT NULL,
	`mes` int NOT NULL,
	CONSTRAINT `mentorado_badges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `metas_progressivas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`mentoradoId` int NOT NULL,
	`tipo` enum('faturamento','leads','procedimentos','posts','stories') NOT NULL,
	`metaAtual` int NOT NULL,
	`metaInicial` int NOT NULL,
	`incremento` int NOT NULL DEFAULT 10,
	`vezesAtingida` int NOT NULL DEFAULT 0,
	`ultimaAtualizacao` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `metas_progressivas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notificacoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`mentoradoId` int NOT NULL,
	`tipo` enum('lembrete_metricas','alerta_meta','conquista','ranking') NOT NULL,
	`titulo` varchar(200) NOT NULL,
	`mensagem` text NOT NULL,
	`lida` enum('sim','nao') NOT NULL DEFAULT 'nao',
	`enviadaPorEmail` enum('sim','nao') NOT NULL DEFAULT 'nao',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notificacoes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ranking_mensal` (
	`id` int AUTO_INCREMENT NOT NULL,
	`mentoradoId` int NOT NULL,
	`ano` int NOT NULL,
	`mes` int NOT NULL,
	`turma` enum('neon_estrutura','neon_escala') NOT NULL,
	`posicao` int NOT NULL,
	`pontuacaoTotal` int NOT NULL DEFAULT 0,
	`pontosBonus` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ranking_mensal_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `mentorado_badges` ADD CONSTRAINT `mentorado_badges_mentoradoId_mentorados_id_fk` FOREIGN KEY (`mentoradoId`) REFERENCES `mentorados`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mentorado_badges` ADD CONSTRAINT `mentorado_badges_badgeId_badges_id_fk` FOREIGN KEY (`badgeId`) REFERENCES `badges`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `metas_progressivas` ADD CONSTRAINT `metas_progressivas_mentoradoId_mentorados_id_fk` FOREIGN KEY (`mentoradoId`) REFERENCES `mentorados`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notificacoes` ADD CONSTRAINT `notificacoes_mentoradoId_mentorados_id_fk` FOREIGN KEY (`mentoradoId`) REFERENCES `mentorados`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ranking_mensal` ADD CONSTRAINT `ranking_mensal_mentoradoId_mentorados_id_fk` FOREIGN KEY (`mentoradoId`) REFERENCES `mentorados`(`id`) ON DELETE cascade ON UPDATE no action;