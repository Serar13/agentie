import { scanConfiguredSources } from "../services/source-service";

export async function runSourceScanner(limitPerSource = 15) {
  return scanConfiguredSources(limitPerSource);
}
