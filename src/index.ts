import { writeFile } from "node:fs/promises";
import { grafast } from "grafast";
import { planToMermaid } from "grafast/mermaid";
import "graphile-config";
import { ExecutionResult } from "graphql";
import { schema } from "./schema.js";
import { waitForDocker } from "./utils.js";

async function main() {
  await waitForDocker();

  const result = (await grafast({
    schema,
    source: /* GraphQL */ `
      {
        viewer {
          id
          stripeCustomer {
            id
            currency
            invoicePrefix
            subscriptions {
              id
              status
              description
            }
          }
        }
      }
    `,
    contextValue: {
      viewer: {
        id: 42,
        stripeCustomerId: "cus_9s6XKzkNRiz8i3",
      },
    },
    resolvedPreset: {
      grafast: {
        explain: true,
      },
    },
  })) as ExecutionResult;

  if (result.errors) {
    console.dir(result.errors);
    throw new Error(`GraphQL request raised an error`);
  }

  console.log("Query result:");
  console.dir(result.data, { depth: 100 });

  await writeFile(
    `plan.mermaid`,
    planToMermaid((result.extensions?.explain as any)?.operations?.[0]?.plan, {
      skipBuckets: true,
      concise: true,
    }),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
