import { describe, it, expect } from "vitest";
import { taxIncluded, discounted, allocateDiscount } from "../lib/money";
describe("VAT-inclusive integer money", () => {
  it("extracts 24% VAT from gross and handles zero", () => {
    expect(taxIncluded(12400, 2400)).toBe(2400);
    expect(taxIncluded(0, 2400)).toBe(0);
    expect(taxIncluded(3900, 2400)).toBe(755);
  });
  it("caps a discount and uses basis points", () => {
    expect(discounted(1000, "PERCENT", 1250)).toBe(125);
    expect(discounted(1000, "FIXED", 5000)).toBe(1000);
  });
  it("allocates every cent across mixed tax lines", () => {
    const a = allocateDiscount(
      [
        { gross: 333, vatBps: 2400 },
        { gross: 667, vatBps: 1300 },
      ],
      101,
    );
    expect(a.reduce((n, x) => n + x.gross, 0)).toBe(899);
    expect(a.every((x) => Number.isInteger(x.gross))).toBe(true);
  });
  it("rejects invalid money values", () => {
    expect(() => taxIncluded(-1, 2400)).toThrow();
    expect(() => taxIncluded(1.1, 2400)).toThrow();
  });
});
