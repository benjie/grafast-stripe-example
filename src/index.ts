import { waitForDocker } from "./utils.js";

async function main() {
  await waitForDocker();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
