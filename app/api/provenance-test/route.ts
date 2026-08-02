import { asc, eq, sql } from "drizzle-orm";
import fixtureJson from "../../../data/provenance-test-fixture.json";
import { getDb } from "../../../db";
import {
  factEvidenceLinks,
  knowledgeFacts,
  sourceBlocks,
  sourceDocuments,
} from "../../../db/schema";

type Fixture = typeof fixtureJson;

async function seedIfEmpty() {
  const db = getDb();
  const [{ total }] = await db.select({ total: sql<number>`count(*)` }).from(sourceDocuments);
  const wasEmpty = Number(total) === 0;

  await db.insert(sourceDocuments).values(fixtureJson.documents.map((item) => ({
    id: item.id,
    title: item.title,
    originalFilename: item.original_filename,
    fileUrl: item.file_url,
    fileType: item.file_type,
    category: item.category,
    sha256: item.sha256,
    sourceUpdatedAt: item.source_updated_at,
    pageCount: item.page_count,
    sheetCount: item.sheet_count,
    blockCount: item.block_count,
    factCount: item.fact_count,
    importStatus: item.import_status,
  }))).onConflictDoNothing();

  for (let index = 0; index < fixtureJson.blocks.length; index += 8) {
    const chunk = fixtureJson.blocks.slice(index, index + 8);
    await db.insert(sourceBlocks).values(chunk.map((item) => ({
      id: item.id,
      documentId: item.document_id,
      locatorType: item.locator_type,
      locatorLabel: item.locator_label,
      pageNumber: item.page_number,
      sectionPath: item.section_path,
      paragraphIndex: item.paragraph_index,
      sheetName: item.sheet_name,
      cellRange: item.cell_range,
      originalText: item.original_text,
      textHash: item.text_hash,
    }))).onConflictDoNothing();
  }

  for (let index = 0; index < fixtureJson.facts.length; index += 10) {
    const chunk = fixtureJson.facts.slice(index, index + 10);
    await db.insert(knowledgeFacts).values(chunk.map((item) => ({
      id: item.id,
      moduleCode: item.module_code,
      factKey: item.fact_key,
      title: item.title,
      factValue: item.fact_value,
      category: item.category,
      status: item.status,
      confidence: item.confidence,
    }))).onConflictDoNothing();
  }

  for (let index = 0; index < fixtureJson.evidence_links.length; index += 20) {
    const chunk = fixtureJson.evidence_links.slice(index, index + 20);
    await db.insert(factEvidenceLinks).values(chunk.map((item) => ({
      id: item.id,
      factId: item.fact_id,
      sourceBlockId: item.source_block_id,
      relationType: item.relation_type,
      isPrimary: item.is_primary,
    }))).onConflictDoNothing();
  }

  return wasEmpty;
}

function errorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected error";
  if (message.includes("no such table")) {
    return "临时证据库尚未完成初始化，请部署包含最新 D1 migration 的测试版本。";
  }
  return message;
}

export async function GET(request: Request) {
  try {
    const seeded = await seedIfEmpty();
    const db = getDb();
    const url = new URL(request.url);
    const fileType = url.searchParams.get("fileType");

    const baseQuery = db.select({
      id: knowledgeFacts.id,
      moduleCode: knowledgeFacts.moduleCode,
      factKey: knowledgeFacts.factKey,
      title: knowledgeFacts.title,
      factValue: knowledgeFacts.factValue,
      category: knowledgeFacts.category,
      status: knowledgeFacts.status,
      confidence: knowledgeFacts.confidence,
      documentId: sourceDocuments.id,
      documentTitle: sourceDocuments.title,
      originalFilename: sourceDocuments.originalFilename,
      fileUrl: sourceDocuments.fileUrl,
      fileType: sourceDocuments.fileType,
      sha256: sourceDocuments.sha256,
      sourceUpdatedAt: sourceDocuments.sourceUpdatedAt,
      locatorType: sourceBlocks.locatorType,
      locatorLabel: sourceBlocks.locatorLabel,
      pageNumber: sourceBlocks.pageNumber,
      sectionPath: sourceBlocks.sectionPath,
      paragraphIndex: sourceBlocks.paragraphIndex,
      sheetName: sourceBlocks.sheetName,
      cellRange: sourceBlocks.cellRange,
      excerpt: sourceBlocks.originalText,
      textHash: sourceBlocks.textHash,
    })
      .from(knowledgeFacts)
      .innerJoin(factEvidenceLinks, eq(factEvidenceLinks.factId, knowledgeFacts.id))
      .innerJoin(sourceBlocks, eq(sourceBlocks.id, factEvidenceLinks.sourceBlockId))
      .innerJoin(sourceDocuments, eq(sourceDocuments.id, sourceBlocks.documentId));

    const records = fileType
      ? await baseQuery.where(eq(sourceDocuments.fileType, fileType)).orderBy(asc(knowledgeFacts.id)).limit(200)
      : await baseQuery.orderBy(asc(sourceDocuments.fileType), asc(knowledgeFacts.id)).limit(200);

    const documents = await db.select().from(sourceDocuments).orderBy(asc(sourceDocuments.fileType));
    const countTable = async (table: typeof sourceDocuments | typeof sourceBlocks | typeof knowledgeFacts | typeof factEvidenceLinks) => {
      const [row] = await db.select({ total: sql<number>`count(*)` }).from(table);
      return Number(row.total);
    };
    const [documentCount, blockCount, factCount, evidenceCount] = await Promise.all([
      countTable(sourceDocuments),
      countTable(sourceBlocks),
      countTable(knowledgeFacts),
      countTable(factEvidenceLinks),
    ]);

    return Response.json({
      scope: (fixtureJson as Fixture).scope,
      seeded,
      source: "isolated-d1-test-db",
      summary: {
        documents: documentCount,
        blocks: blockCount,
        facts: factCount,
        completeEvidence: evidenceCount,
      },
      documents,
      records,
    });
  } catch (error) {
    return Response.json({ error: errorMessage(error) }, { status: 500 });
  }
}
