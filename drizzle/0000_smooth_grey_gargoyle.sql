CREATE TABLE `fact_evidence_links` (
	`id` text PRIMARY KEY NOT NULL,
	`fact_id` text NOT NULL,
	`source_block_id` text NOT NULL,
	`relation_type` text NOT NULL,
	`is_primary` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`fact_id`) REFERENCES `knowledge_facts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_block_id`) REFERENCES `source_blocks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_fact_evidence_links_fact_id` ON `fact_evidence_links` (`fact_id`);--> statement-breakpoint
CREATE INDEX `idx_fact_evidence_links_source_block_id` ON `fact_evidence_links` (`source_block_id`);--> statement-breakpoint
CREATE TABLE `knowledge_facts` (
	`id` text PRIMARY KEY NOT NULL,
	`module_code` text NOT NULL,
	`fact_key` text NOT NULL,
	`title` text NOT NULL,
	`fact_value` text NOT NULL,
	`category` text NOT NULL,
	`status` text NOT NULL,
	`confidence` real NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_knowledge_facts_module_code` ON `knowledge_facts` (`module_code`);--> statement-breakpoint
CREATE INDEX `idx_knowledge_facts_category` ON `knowledge_facts` (`category`);--> statement-breakpoint
CREATE TABLE `source_blocks` (
	`id` text PRIMARY KEY NOT NULL,
	`document_id` text NOT NULL,
	`locator_type` text NOT NULL,
	`locator_label` text NOT NULL,
	`page_number` integer,
	`section_path` text,
	`paragraph_index` integer,
	`sheet_name` text,
	`cell_range` text,
	`original_text` text NOT NULL,
	`text_hash` text NOT NULL,
	FOREIGN KEY (`document_id`) REFERENCES `source_documents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_source_blocks_document_id` ON `source_blocks` (`document_id`);--> statement-breakpoint
CREATE INDEX `idx_source_blocks_locator_type` ON `source_blocks` (`locator_type`);--> statement-breakpoint
CREATE TABLE `source_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`original_filename` text NOT NULL,
	`file_url` text NOT NULL,
	`file_type` text NOT NULL,
	`category` text NOT NULL,
	`sha256` text NOT NULL,
	`source_updated_at` text NOT NULL,
	`page_count` integer,
	`sheet_count` integer,
	`block_count` integer NOT NULL,
	`fact_count` integer NOT NULL,
	`import_status` text NOT NULL
);
