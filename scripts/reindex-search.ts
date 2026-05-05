import { reindexAll } from "../src/server/providers/search";
import { logger } from "../src/lib/logger";

async function main() {
  logger.info({ event: "reindex.start" }, "starting full reindex");
  const result = await reindexAll();
  logger.info({ event: "reindex.ok", counts: result.counts }, "reindex completed");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error({ err }, "reindex failed");
    process.exit(1);
  });
