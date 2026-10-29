import path from "node:path";
import { pathToFileURL } from "node:url";
import approval from "../src/app/config/eventCoverApproval.json";

export async function prepareEventCovers(
  state: { status: string } = approval,
  generate = async () => {
    const { generateEventCovers } = await import("./generate-event-covers");
    await generateEventCovers();
  },
) {
  if (state.status !== "approved") return "skipped-pending-illustration";
  await generate();
  return "generated";
}

if (
  process.argv[1] &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
) {
  prepareEventCovers()
    .then(console.log)
    .catch((error: unknown) => {
      console.error(error);
      process.exitCode = 1;
    });
}
