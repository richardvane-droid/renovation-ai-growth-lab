import uiFixture from "../data/provenance-test-ui.json";
import sourceCatalog from "../data/source-catalog.json";

export type ProvenanceLabDocument = {
  id: string;
  title: string;
  originalFilename: string;
  fileUrl: string;
  fileType: string;
  category: string;
  sha256: string;
  sourceUpdatedAt: string;
  pageCount: number | null;
  sheetCount: number | null;
  blockCount: number;
  factCount: number;
  importStatus: string;
};

export type ProvenanceLabRecord = {
  id: string;
  moduleCode: string;
  factKey: string;
  title: string;
  factValue: string;
  category: string;
  status: string;
  confidence: number;
  documentId: string;
  documentTitle: string;
  originalFilename: string;
  fileUrl: string;
  fileType: string;
  sha256: string;
  sourceUpdatedAt: string;
  locatorType: string;
  locatorLabel: string;
  pageNumber: number | null;
  sectionPath: string | null;
  paragraphIndex: number | null;
  sheetName: string | null;
  cellRange: string | null;
  excerpt: string;
  textHash: string;
};

export type ProvenanceLabResponse = {
  scope: string;
  source: "isolated-d1-test-db" | "bundled-verified-fixture";
  summary: {
    documents: number;
    parsedDocuments: number;
    pendingDocuments: number;
    blocks: number;
    facts: number;
    completeEvidence: number;
  };
  documents: ProvenanceLabDocument[];
  records: ProvenanceLabRecord[];
};

function mapDocument(item: (typeof uiFixture.documents)[number]): ProvenanceLabDocument {
  return {
    id: item.id,
    title: item.title,
    originalFilename: item.original_filename,
    fileUrl: item.file_url,
    fileType: item.file_type as ProvenanceLabDocument["fileType"],
    category: item.category,
    sha256: item.sha256,
    sourceUpdatedAt: item.source_updated_at,
    pageCount: item.page_count,
    sheetCount: item.sheet_count,
    blockCount: item.block_count,
    factCount: item.fact_count,
    importStatus: item.import_status,
  };
}

const verifiedDocuments = new Map(uiFixture.documents.map((item) => [item.id, mapDocument(item)]));

function mapCatalogDocument(item: (typeof sourceCatalog.documents)[number]): ProvenanceLabDocument {
  return verifiedDocuments.get(item.id) ?? {
    id: item.id,
    title: item.title,
    originalFilename: item.original_filename,
    fileUrl: item.file_url,
    fileType: item.file_type,
    category: item.category,
    sha256: "",
    sourceUpdatedAt: item.source_updated_at,
    pageCount: null,
    sheetCount: null,
    blockCount: 0,
    factCount: 0,
    importStatus: item.import_status,
  };
}

export const provenanceLabFallback: ProvenanceLabResponse = {
  scope: uiFixture.scope,
  source: "bundled-verified-fixture",
  summary: {
    documents: sourceCatalog.summary.documents,
    parsedDocuments: sourceCatalog.summary.parsed_documents,
    pendingDocuments: sourceCatalog.summary.pending_documents,
    blocks: uiFixture.summary.blocks,
    facts: uiFixture.summary.facts,
    completeEvidence: uiFixture.summary.complete_evidence,
  },
  documents: sourceCatalog.documents.map(mapCatalogDocument),
  records: uiFixture.records.map((item) => ({
    id: item.id,
    moduleCode: item.module_code,
    factKey: item.fact_key,
    title: item.title,
    factValue: item.fact_value,
    category: item.category,
    status: item.status,
    confidence: item.confidence,
    documentId: item.document.id,
    documentTitle: item.document.title,
    originalFilename: item.document.original_filename,
    fileUrl: item.document.file_url,
    fileType: item.document.file_type as ProvenanceLabRecord["fileType"],
    sha256: item.document.sha256,
    sourceUpdatedAt: item.document.source_updated_at,
    locatorType: item.evidence.locator_type,
    locatorLabel: item.evidence.locator_label,
    pageNumber: item.evidence.page_number,
    sectionPath: item.evidence.section_path,
    paragraphIndex: item.evidence.paragraph_index,
    sheetName: item.evidence.sheet_name,
    cellRange: item.evidence.cell_range,
    excerpt: item.evidence.original_text,
    textHash: item.evidence.text_hash,
  })),
};

export async function fetchProvenanceLab(signal?: AbortSignal): Promise<ProvenanceLabResponse> {
  const response = await fetch("/api/provenance-test", { signal });
  if (!response.ok) throw new Error(`Provenance test database ${response.status}`);
  return response.json() as Promise<ProvenanceLabResponse>;
}
