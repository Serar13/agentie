import { scanConfiguredSources } from "../services/source-service";
import { prisma } from "../lib/prisma";

async function main() {
  const limit = Number(process.argv[2] ?? 15);
  const result = await scanConfiguredSources(limit);

  console.log("Scan complete");
  console.table({
    scannedSources: result.scannedSources,
    createdDrafts: result.createdDrafts,
    skippedDuplicates: result.skippedDuplicates,
    errors: result.errors.length
  });

  if (result.errors.length > 0) {
    console.table(result.errors);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
