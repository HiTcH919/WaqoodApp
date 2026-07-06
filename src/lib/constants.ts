export function getFuelCategory(fuelType: string): string {
  return fuelType.includes("بنزين") ? "بنزين" : "سولار";
}

export function getDefaultLitresPerCoupon(
  fuelTypeId: string,
  fuelTypes: { id: string; default_litres: number }[]
): number {
  const ft = fuelTypes.find((f) => f.id === fuelTypeId);
  return ft?.default_litres ?? 20;
}

export function currentMonthStr(): string {
  return new Date().toISOString().substring(0, 7);
}
