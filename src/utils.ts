import { fetch } from "@whatwg-node/fetch";

export const STRIPE_PROTOCOL = "http";
export const STRIPE_HOST = "localhost";
export const STRIPE_PORT = "12111";
export const STRIPE_API = `${STRIPE_PROTOCOL}://${STRIPE_HOST}:${STRIPE_PORT}`;

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export async function waitForDocker() {
  try {
    await fetch(`${STRIPE_API}/v1/charges`, {
      headers: { Authorization: "Bearer sk_test_123" },
    });
  } catch (e) {
    console.log(`Failed to talk to Stripe API; retrying in 1 second`);
    await sleep(1000);
    return waitForDocker();
  }
  console.log(`API ready`);
}
