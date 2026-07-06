export function calculateSerials(
  existingBatches: { end_serial: number }[],
  count: number
): { startSerial: number; endSerial: number } {
  const maxEnd = existingBatches.reduce(
    (max, b) => Math.max(max, b.end_serial),
    0
  );
  const startSerial = maxEnd + 1;
  return { startSerial, endSerial: startSerial + count - 1 };
}

export function calculateCost(
  litresPerCoupon: number,
  count: number,
  pricePerLitre: number
): number {
  return Math.round(litresPerCoupon * count * pricePerLitre * 100) / 100;
}
