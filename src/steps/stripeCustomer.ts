import {
  AccessStep,
  ExecutableStep,
  GrafastResultsList,
  GrafastValuesList,
  access,
} from "grafast";
import { Stripe } from "stripe";
import { stripe } from "../stripeInstance.js";

type ExpandableEntity = "subscriptions";

export class StripeCustomerStep extends ExecutableStep<Stripe.Customer | null> {
  expands = new Set<ExpandableEntity>();
  constructor($customerId: ExecutableStep<string | undefined>) {
    super();
    this.addDependency($customerId);
  }

  toStringMeta(): string | null {
    if (this.expands.size > 0) {
      return `expand=${[...this.expands].join(",")}`;
    } else {
      return null;
    }
  }

  get<TKey extends keyof Stripe.Customer>(
    key: TKey,
  ): AccessStep<Stripe.Customer[TKey]> {
    return access(this, key);
  }

  expand(field: ExpandableEntity) {
    if (field === "subscriptions") {
      this.expands.add("subscriptions");
      return access(this, "subscriptions") as ExecutableStep<
        Stripe.ApiList<Stripe.Subscription>
      >;
    } else {
      throw new Error(`Don't yet know how to expand '${field}'`);
    }
  }

  execute(
    count: number,
    [customerIds]: [GrafastValuesList<string | undefined>],
  ): GrafastResultsList<Stripe.Customer | null> {
    // Unfortunately Stripe doesn't support a batch API for getting customers by
    // their IDs currently, so we'll just have to N+1 it.
    return customerIds.map(async (id) => {
      if (!id) return null;
      const customer = await stripe.customers.retrieve(id, {
        expand: this.expands.size > 0 ? [...this.expands] : undefined,
      });
      if (customer.deleted) {
        return null;
      }
      return customer;
    });
  }
}

export function stripeCustomer(
  $customerId: ExecutableStep<string | undefined>,
) {
  return new StripeCustomerStep($customerId);
}
