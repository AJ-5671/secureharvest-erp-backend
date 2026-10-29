import { getBatch, getFullBatchHistory } from './contractService';
import { getBatchStatus } from './erpService';

export async function getChainRecord(batchId) {
  const [batch, history] = await Promise.all([
    getBatch(batchId),
    getFullBatchHistory(batchId),
  ]);

  if (!batch.exists) {
    return { exists: false };
  }

  let status = null;
  try {
    status = await getBatchStatus(batchId);
  } catch (err) {
    status = null; // no inventory record yet — fine, chain data still shows
  }

  return { ...batch, readings: history, status };
}