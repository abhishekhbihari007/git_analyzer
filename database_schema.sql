CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(255) NOT NULL,
	`password` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);

CREATE TABLE `analyzed_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(255) NOT NULL,
	`name` text,
	`avatar_url` text,
	`bio` text,
	`location` text,
	`company` text,
	`blog` text,
	`github_url` text,
	`followers` int NOT NULL DEFAULT 0,
	`following` int NOT NULL DEFAULT 0,
	`public_repos` int NOT NULL DEFAULT 0,
	`total_stars` int NOT NULL DEFAULT 0,
	`total_forks` int NOT NULL DEFAULT 0,
	`avg_repo_size` int NOT NULL DEFAULT 0,
	`profile_score` int NOT NULL DEFAULT 0,
	`developer_style` varchar(255),
	`top_repos` json,
	`language_breakdown` json,
	`ai_summary` text,
	`user_id` int NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `analyzed_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `analyzed_profiles_username_unique` UNIQUE(`username`)
);

ALTER TABLE `analyzed_profiles` ADD CONSTRAINT `analyzed_profiles_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
