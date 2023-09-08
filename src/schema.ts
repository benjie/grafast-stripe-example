import { context, makeGrafastSchema, AccessStep } from "grafast";
import { stripeCustomer, StripeCustomerStep } from "./steps/stripeCustomer";

declare global {
  namespace Grafast {
    interface Context {
      viewer: {
        id?: number;
        stripeCustomerId?: string;
      };
    }
  }
}

export const schema = makeGrafastSchema({
  typeDefs: /* GraphQL */ `
    type Query {
      viewer: Viewer
    }

    type Viewer {
      id: Int!
      stripeCustomer: StripeCustomer
    }

    type StripeCustomer {
      id: String!
      name: String
      email: String
      description: String
      currency: String
      invoicePrefix: String
      subscriptions: [StripeSubscription!]
    }

    type StripeSubscription {
      id: String!
      status: StripeSubscriptionStatus!
      description: String
    }

    enum StripeSubscriptionStatus {
      incomplete
      incomplete_expired
      trialing
      active
      past_due
      canceled
      unpaid
    }
  `,
  plans: {
    Query: {
      viewer() {
        return context().get("viewer");
      },
    },
    Viewer: {
      stripeCustomer(viewer: AccessStep<Grafast.Context["viewer"]>) {
        return stripeCustomer(viewer.get("stripeCustomerId"));
      },
    },
    StripeCustomer: {
      invoicePrefix($customer: StripeCustomerStep) {
        return $customer.get("invoice_prefix");
      },
    },
  },
});
