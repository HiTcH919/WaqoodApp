import { describe, it, expect } from "vitest";
import { calculateSerials, calculateCost } from "@/lib/coupon-service";

describe("calculateSerials", () => {
  it("returns 1 as start when no existing batches", () => {
    expect(calculateSerials([], 5)).toEqual({ startSerial: 1, endSerial: 5 });
  });

  it("starts after the last batch end serial", () => {
    const batches = [{ end_serial: 100 }] as { end_serial: number }[];
    expect(calculateSerials(batches, 10)).toEqual({ startSerial: 101, endSerial: 110 });
  });

  it("handles multiple existing batches", () => {
    const batches = [
      { end_serial: 50 },
      { end_serial: 75 },
    ] as { end_serial: number }[];
    expect(calculateSerials(batches, 5)).toEqual({ startSerial: 76, endSerial: 80 });
  });

  it("handles empty batches array", () => {
    expect(calculateSerials([], 1)).toEqual({ startSerial: 1, endSerial: 1 });
  });
});

describe("calculateCost", () => {
  it("calculates cost from litres count and price", () => {
    expect(calculateCost(20, 10, 15)).toBe(3000);
  });

  it("handles fractional litres", () => {
    expect(calculateCost(20.5, 5, 13.75)).toBeCloseTo(1409.38, 2);
  });

  it("returns 0 for zero count", () => {
    expect(calculateCost(20, 0, 15)).toBe(0);
  });
});
