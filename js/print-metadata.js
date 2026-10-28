// Keep the existing module API; public players use the same naming rules.
import '../public/shared/print-names.js';
export const { normalizePrintMetadata, resolvePrintMetadata, readPrintMetadata, loadPrintCatalog, buildPrintFilename, resolvePrintContext, createPrintTitleSession } = globalThis.LearningHubPrintNames;
