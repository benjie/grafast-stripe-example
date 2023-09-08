import { Stripe } from "stripe";
import { STRIPE_HOST, STRIPE_PORT, STRIPE_PROTOCOL } from "./utils.js";

export const stripe = new Stripe("sk_test_...", {
  apiVersion: "2023-08-16",
  host: STRIPE_HOST,
  port: STRIPE_PORT,
  protocol: STRIPE_PROTOCOL,
  typescript: true,
});
