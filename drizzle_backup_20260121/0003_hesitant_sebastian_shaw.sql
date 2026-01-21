ALTER TABLE `mentorados` ADD `fotoUrl` varchar(500);--> statement-breakpoint
ALTER TABLE `mentorados` ADD `metaLeads` int DEFAULT 50;--> statement-breakpoint
ALTER TABLE `mentorados` ADD `metaProcedimentos` int DEFAULT 10;--> statement-breakpoint
ALTER TABLE `mentorados` ADD `metaPosts` int DEFAULT 12;--> statement-breakpoint
ALTER TABLE `mentorados` ADD `metaStories` int DEFAULT 60;--> statement-breakpoint
ALTER TABLE `mentorados` ADD `ativo` enum('sim','nao') DEFAULT 'sim' NOT NULL;