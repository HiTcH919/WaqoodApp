import { getPrices } from "@/lib/actions/prices";
import { PricesClient } from "./prices-client";

export default async function PricesPage() {
  const prices = await getPrices();
  return <PricesClient prices={prices} />;
}
