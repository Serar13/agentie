import { runPipelineForPendingDrafts } from "../agents/pipeline";

async function main() {
  const limit = Number(process.argv[2] ?? 10);
  const results = await runPipelineForPendingDrafts(limit);

  console.log(`Pipeline processed ${results.length} draft(s).`);
  console.table(
    results.map((article) => ({
      id: article.id,
      title: article.title.slice(0, 72),
      status: article.status,
      positiveScore: article.positiveScore,
      confidenceScore: article.confidenceScore
    }))
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
