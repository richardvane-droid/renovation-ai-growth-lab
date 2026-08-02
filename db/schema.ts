import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const sourceDocuments = sqliteTable("source_documents", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  originalFilename: text("original_filename").notNull(),
  fileUrl: text("file_url").notNull(),
  fileType: text("file_type").notNull(),
  category: text("category").notNull(),
  sha256: text("sha256").notNull(),
  sourceUpdatedAt: text("source_updated_at").notNull(),
  pageCount: integer("page_count"),
  sheetCount: integer("sheet_count"),
  blockCount: integer("block_count").notNull(),
  factCount: integer("fact_count").notNull(),
  importStatus: text("import_status").notNull(),
});

export const sourceBlocks = sqliteTable("source_blocks", {
  id: text("id").primaryKey(),
  documentId: text("document_id").notNull().references(() => sourceDocuments.id),
  locatorType: text("locator_type").notNull(),
  locatorLabel: text("locator_label").notNull(),
  pageNumber: integer("page_number"),
  sectionPath: text("section_path"),
  paragraphIndex: integer("paragraph_index"),
  sheetName: text("sheet_name"),
  cellRange: text("cell_range"),
  originalText: text("original_text").notNull(),
  textHash: text("text_hash").notNull(),
}, (table) => [
  index("idx_source_blocks_document_id").on(table.documentId),
  index("idx_source_blocks_locator_type").on(table.locatorType),
]);

export const knowledgeFacts = sqliteTable("knowledge_facts", {
  id: text("id").primaryKey(),
  moduleCode: text("module_code").notNull(),
  factKey: text("fact_key").notNull(),
  title: text("title").notNull(),
  factValue: text("fact_value").notNull(),
  category: text("category").notNull(),
  status: text("status").notNull(),
  confidence: real("confidence").notNull(),
}, (table) => [
  index("idx_knowledge_facts_module_code").on(table.moduleCode),
  index("idx_knowledge_facts_category").on(table.category),
]);

export const factEvidenceLinks = sqliteTable("fact_evidence_links", {
  id: text("id").primaryKey(),
  factId: text("fact_id").notNull().references(() => knowledgeFacts.id),
  sourceBlockId: text("source_block_id").notNull().references(() => sourceBlocks.id),
  relationType: text("relation_type").notNull(),
  isPrimary: integer("is_primary").notNull().default(1),
}, (table) => [
  index("idx_fact_evidence_links_fact_id").on(table.factId),
  index("idx_fact_evidence_links_source_block_id").on(table.sourceBlockId),
]);
