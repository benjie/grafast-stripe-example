import { grafast } from "grafast";
import { schema } from "./schema.js";
import { waitForDocker } from "./utils.js";

async function main() {
  await waitForDocker();

  const result = await grafast({
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
  });

  console.dir(result, { depth: 100 });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
