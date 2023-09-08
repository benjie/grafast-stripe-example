# Grafast Stripe Example

Gra*fast* is a cutting-edge planning and execution engine for GraphQL; it
replaces the concept of "resolvers" in a GraphQL schema with "plan resolvers".
These plan resolvers outline the steps that need to be taken, but don't
actually execute them. Gra*fast* builds up a "plan" by calling
the plan resolvers for each field in the incoming request, and then it gives
each step in the plan a chance to optimize or replace itself. This can
lead to significantly more efficient GraphQL execution.

For more information on Gra*fast*, see https://grafast.org

This repository contains a working example showing how a `StripeSubscriptions`
step can "optimize" itself to be inlined into a `StripeCustomer` step if the
circumstances are right.

In `index.ts` we issue a query to the server:

```graphql
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
```

In GraphQL this would have either required the stripe customer to always
include subscriptions (even when they were not requested), or to have to follow
up and fetch the subscriptions in a second request.

However, by using Gra*fast*, we can optimize the plan.

Initially our plan diagram will look like this (highlighting added):

```mermaid
%%{init: {'themeVariables': { 'fontSize': '12px'}}}%%
flowchart TD
    classDef path fill:#eee,stroke:#000,color:#000
    classDef plan fill:#fff,stroke-width:1px,color:#000
    classDef itemplan fill:#fff,stroke-width:2px,color:#000
    classDef unbatchedplan fill:#dff,stroke-width:1px,color:#000
    classDef sideeffectplan fill:#fcc,stroke-width:2px,color:#000
    classDef bucket fill:#f6f6f6,color:#000,stroke-width:2px,text-align:left


    %% plan dependencies
    Access7{{"Access[7∈0]<br />ᐸ3.viewerᐳ"}}:::plan
    __Value3["__Value[3∈0]<br />ᐸcontextᐳ"]:::plan
    __Value3 --> Access7
    Access9{{"Access[9∈0]<br />ᐸ3.viewer...stomerIdᐳ"}}:::plan
    __Value3 --> Access9
    StripeCustomer10[["StripeCustomer[10∈0]"]]:::plan
    Access9 --> StripeCustomer10
    Access11{{"Access[11∈2]<br />ᐸ10.idᐳ"}}:::plan
    StripeCustomer10 --> Access11
    StripeSubscriptions15[["StripeSubscriptions[15∈2]"]]:::plan
    Access11 --> StripeSubscriptions15
    Access16{{"Access[16∈2]<br />ᐸ15.dataᐳ"}}:::plan
    StripeSubscriptions15 --> Access16
    __Item17[/"__Item[17∈3]<br />ᐸ16ᐳ"\]:::itemplan
    Access16 ==> __Item17

    %% define steps

    classDef bucket0 stroke:#696969
    class Bucket0,__Value3,Access7,Access9,StripeCustomer10 bucket0
    classDef bucket1 stroke:#00bfff
    class Bucket1 bucket1
    classDef bucket2 stroke:#7f007f
    class Bucket2,Access11,StripeSubscriptions15,Access16 bucket2
    classDef bucket3 stroke:#ffa500
    class Bucket3,__Item17 bucket3

    classDef toDelete fill:#ffcccc
    class Access11,StripeSubscriptions15 toDelete
```

Note that the steps with two bars on each side are "asynchronous" steps, steps
that do work (in this case, making requests to Slack):

```mermaid
%%{init: {'themeVariables': { 'fontSize': '12px'}}}%%
flowchart TD
    classDef plan fill:#fff,stroke-width:1px,color:#000
    AsyncStep[["Steps like this are asynchronous"]]:::plan
```

Fortunately, the [`optimize` method on
`StripeSubscriptionsStep`](https://github.com/benjie/grafast-stripe-example/blob/e670921885c03e5d7d8ce8afa24abf146f2d5c53/src/steps/stripeSubscriptions.ts#L42-L59)
can determine that the dependency of `StripeSubscriptions[15]` is an `access`
step of the `"id"` property of a `StripeCustomerStep` (`StripeCustomer[10]`),
and thus can ask that `StripeCustomer` to
["expand"](https://stripe.com/docs/expand?locale=en-GB) the `subscriptions`
field instead (replacing itself).

This results in this plan diagram; note we now only have one asynchronous step,
we don't need two round-trips to Stripe any more:

```mermaid
%%{init: {'themeVariables': { 'fontSize': '12px'}}}%%
flowchart TD
    classDef path fill:#eee,stroke:#000,color:#000
    classDef plan fill:#fff,stroke-width:1px,color:#000
    classDef itemplan fill:#fff,stroke-width:2px,color:#000
    classDef unbatchedplan fill:#dff,stroke-width:1px,color:#000
    classDef sideeffectplan fill:#fcc,stroke-width:2px,color:#000
    classDef bucket fill:#f6f6f6,color:#000,stroke-width:2px,text-align:left


    %% plan dependencies
    Access7{{"Access[7∈0]<br />ᐸ3.viewerᐳ"}}:::plan
    __Value3["__Value[3∈0]<br />ᐸcontextᐳ"]:::plan
    __Value3 --> Access7
    Access9{{"Access[9∈0]<br />ᐸ3.viewer...stomerIdᐳ"}}:::plan
    __Value3 --> Access9
    StripeCustomer10[["StripeCustomer[10∈0]<br />ᐸexpand=subscriptionsᐳ"]]:::plan
    Access9 --> StripeCustomer10
    Access22{{"Access[22∈2]<br />ᐸ10.subsc...ons.dataᐳ"}}:::plan
    StripeCustomer10 --> Access22
    __Item17[/"__Item[17∈3]<br />ᐸ22ᐳ"\]:::itemplan
    Access22 ==> __Item17

    %% define steps

    classDef bucket0 stroke:#696969
    class Bucket0,__Value3,Access7,Access9,StripeCustomer10 bucket0
    classDef bucket1 stroke:#00bfff
    class Bucket1 bucket1
    classDef bucket2 stroke:#7f007f
    class Bucket2,Access22 bucket2
    classDef bucket3 stroke:#ffa500
    class Bucket3,__Item17 bucket3
```

If we were to just request the customer, without their subscriptions, then
we will not ask for subscription data from Stripe.
