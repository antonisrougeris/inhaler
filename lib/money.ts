export function taxIncluded(gross: number, vatBps: number) {
  if (
    !Number.isSafeInteger(gross) ||
    gross < 0 ||
    !Number.isInteger(vatBps) ||
    vatBps < 0
  )
    throw new Error("Invalid money");
  return gross - Math.round((gross * 10000) / (10000 + vatBps));
}
export function discounted(subtotal: number, type: string, amount: number) {
  return Math.min(
    subtotal,
    Math.max(
      0,
      type === "PERCENT" ? Math.round((subtotal * amount) / 10000) : amount,
    ),
  );
}
export function allocateDiscount(
  lines: { gross: number; vatBps: number }[],
  discount: number,
) {
  const total = lines.reduce((a, b) => a + b.gross, 0);
  let left = discount;
  return lines.map((line, i) => {
    const part =
      i === lines.length - 1
        ? left
        : Math.min(
            left,
            Math.floor((discount * line.gross) / Math.max(total, 1)),
          );
    left -= part;
    return { ...line, gross: line.gross - part };
  });
}
