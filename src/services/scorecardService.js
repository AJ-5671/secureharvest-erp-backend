import { getOrders, getBatchStatus } from './erpService';

export async function getSupplierScorecards() {
  const orders = await getOrders();
  const linkedOrders = orders.filter((o) => o.linkedBatchId != null && o.supplierId);

  const bySupplier = {};
  for (const o of linkedOrders) {
    if (!bySupplier[o.supplierId]) bySupplier[o.supplierId] = [];
    bySupplier[o.supplierId].push(o.linkedBatchId);
  }

  const scorecards = await Promise.all(
    Object.entries(bySupplier).map(async ([supplierId, batchIds]) => {
      const statuses = await Promise.all(batchIds.map((id) => getBatchStatus(id)));

      // Only keep scores that actually exist — don't default missing ones to 0,
      // or a supplier with zero real data looks identical to one that's 0% reliable.
      const scores = statuses
        .map((s) => s.onChain?.reliabilityScore)
        .filter((score) => score !== null && score !== undefined);

      const breachCount = statuses.filter((s) => (s.onChain?.breachCount ?? 0) > 0).length;

      const hasScoreData = scores.length > 0;
      const avg = hasScoreData
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : null;

      return {
        supplierId,
        totalBatches: batchIds.length,
        breachedBatches: breachCount,
        reliabilityScore: avg,
        hasScoreData,
      };
    })
  );

  // Suppliers with no real score data sort last, not mixed in with 0% (worst) suppliers.
  return scorecards.sort((a, b) => {
    if (!a.hasScoreData && !b.hasScoreData) return 0;
    if (!a.hasScoreData) return 1;
    if (!b.hasScoreData) return -1;
    return a.reliabilityScore - b.reliabilityScore;
  });
}