import { requireAuth } from "@/lib/auth-utils";
import { getPrices } from "@/lib/actions/prices";
import { PricesClient } from "./prices-client";

export default async function PricesPage() {
  await requireAuth();
  const prices = await getPrices();
  return     <PricesClient initialPrices={prices} />;
}
