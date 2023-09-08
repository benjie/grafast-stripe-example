import {
  AccessStep,
  ExecutableStep,
  GrafastResultsList,
  GrafastValuesList,
  access,
} from "grafast";
import { Stripe } from "stripe";
import { stripe } from "../stripeInstance.js";

export class StripeCustomerStep extends ExecutableStep<Stripe.Customer | null> {
  constructor($customerId: ExecutableStep<string | undefined>) {
    super();
    this.addDependency($customerId);
  }

  get<TKey extends keyof Stripe.Customer>(
    key: TKey,
  ): AccessStep<Stripe.Customer[TKey]> {
    return access(this, key);
  }

  execute(
    count: number,
    [customerIds]: [GrafastValuesList<string | undefined>],
  ): GrafastResultsList<Stripe.Customer | null> {
    // Unfortunately Stripe doesn't support a batch API for getting customers by
    // their IDs currently, so we'll just have to N+1 it.
    return customerIds.map(async (id) => {
      if (!id) return null;
      const customer = await stripe.customers.retrieve(id);
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
