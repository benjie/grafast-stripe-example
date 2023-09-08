import {
  ExecutableStep,
  GrafastResultsList,
  GrafastValuesList,
  PromiseOrDirect,
  access,
} from "grafast";
import { Stripe } from "stripe";
import { stripe } from "../stripeInstance.js";

export class StripeSubscriptionsStep extends ExecutableStep<Stripe.ApiList<Stripe.Subscription> | null> {
  private paramSpecs: [
    key: keyof Stripe.SubscriptionListParams,
    depId: number,
  ][] = [];

  constructor(parameters: {
    [key in keyof Stripe.SubscriptionListParams]?: ExecutableStep<
      Stripe.SubscriptionListParams[key] | undefined
    >;
  }) {
    super();
    for (const [key, $value] of Object.entries(parameters)) {
      if ($value) {
        const depId = this.addDependency($value);
        this.paramSpecs.push([
          key as keyof Stripe.SubscriptionListParams,
          depId,
        ]);
      }
    }
  }

  items() {
    return access(this, "data");
  }

  execute(
    count: number,
    values: GrafastValuesList<any>[],
  ): GrafastResultsList<Stripe.ApiList<Stripe.Subscription> | null> {
    // Stripe doesn't offer a batch API for fetching subscriptions, so we'll have to do it the old N+1 way
    const promises: Array<
      PromiseOrDirect<Stripe.ApiList<Stripe.Subscription> | null>
    > = [];
    for (let i = 0; i < count; i++) {
      const params: Stripe.SubscriptionListParams = Object.create(null);
      /** Set this true if we should skip the fetch due to null inputs */
      let stop = false;
      for (const [key, depId] of this.paramSpecs) {
        const value = values[depId][i];
        if (value == null) {
          stop = true;
        }
        params[key] = value;
      }
      console.dir({ params, stop });
      if (stop) {
        promises.push(null);
      } else {
        promises.push(stripe.subscriptions.list(params));
      }
    }
    return promises;
  }
}

export function stripeSubscriptions(parameters: {
  [key in keyof Stripe.SubscriptionListParams]?: ExecutableStep<
    Stripe.SubscriptionListParams[key] | undefined
  >;
}) {
  return new StripeSubscriptionsStep(parameters);
}
