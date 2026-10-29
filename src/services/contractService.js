import { contract } from './web3';


async function fetchBatchHistory(batchId) {
  const readings = await contract.getBatchHistory(batchId);
  return readings.map((r) => ({
    dataHash: r.dataHash,
    timestamp: Number(r.timestamp),
    temperature: Number(r.temperature) / 10,
    humidity: Number(r.humidity) / 10,
    breach: r.breach,
  }));
}

// Thresholds are global (not per-reading), so we cache them after the
// first fetch instead of re-querying the chain on every breach lookup.
let thresholdsCache = null;
async function getThresholds() {
  if (!thresholdsCache) {
    const [maxTemp, maxHumidity] = await Promise.all([
      contract.maxTempThreshold(),
      contract.maxHumidityThreshold(),
    ]);
    thresholdsCache = {
      maxTemp: Number(maxTemp) / 10,
      maxHumidity: Number(maxHumidity) / 10,
    };
  }
  return thresholdsCache;
}

export async function getRawReadings(batchId) {
  const history = await fetchBatchHistory(batchId);
  return history.map((r) => ({
    temperature: r.temperature,
    humidity: r.humidity,
    timestamp: r.timestamp,
  }));
}

export async function getHashRecords(batchId, limit = 0) {
  const history = await fetchBatchHistory(batchId);
  const records = history.map((r) => ({
    batchId: Number(batchId),
    dataHash: r.dataHash,
    timestamp: r.timestamp,
  }));
  return limit === 0 ? records : records.slice(-limit);
}

/**
 * The contract only stores a flat `breach` boolean per reading — it doesn't
 * record *which* threshold was crossed. Since there's just one global temp
 * threshold and one humidity threshold, we infer the breach type by
 * comparing the reading's values against them ourselves.
 */
export async function getBreachEvents(batchId) {
  const [history, thresholds] = await Promise.all([
    fetchBatchHistory(batchId),
    getThresholds(),
  ]);

  return history
    .filter((r) => r.breach)
    .map((r) => {
      const tempExceeded = r.temperature > thresholds.maxTemp;
      const humidityExceeded = r.humidity > thresholds.maxHumidity;
      const breachType =
        tempExceeded && humidityExceeded
          ? 'TEMP & HUMIDITY HIGH'
          : tempExceeded
          ? 'TEMP HIGH'
          : 'HUMIDITY HIGH';

      return {
        batchId: Number(batchId),
        timestamp: r.timestamp,
        temperature: r.temperature,
        humidity: r.humidity,
        breachType,
        tempThreshold: thresholds.maxTemp,
        humidityThreshold: thresholds.maxHumidity,
      };
    });
}

export async function getBatch(batchId) {
  const [history, meta] = await Promise.all([
    fetchBatchHistory(batchId),
    contract.batches(batchId),
  ]);

  return {
    batchId: Number(batchId),
    exists: meta.exists,
    farmer: meta.farmer,
    createdAt: Number(meta.createdAt),
    closed: meta.closed,
    hasBreach: history.some((r) => r.breach),
    readingCount: history.length,
    // productType still isn't stored on-chain anywhere — that stays
    // unavailable unless your teammate adds it to the contract later.
  };
}
export async function getFullBatchHistory(batchId) {
  return fetchBatchHistory(batchId);
}