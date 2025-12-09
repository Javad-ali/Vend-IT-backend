import axios from 'axios';
import { getConfig } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { cacheWrap, CacheKeys, CacheTTL, cacheDel } from '../../libs/cache.js';
import {
  getMachineById,
  getMachineSlots,
  listMachines,
  upsertMachines,
  upsertSlots
} from './machines.repository.js';
import { upsertRemoteProducts } from '../products/products.repository.js';
import { apiError, ok } from '../../utils/response.js';
const { remoteMachineBaseUrl, remoteMachineApiKey, remoteMachinePageSize, dispenseSocketUrl } =
  getConfig();
const client = axios.create({
  baseURL: remoteMachineBaseUrl,
  headers: { apikey: remoteMachineApiKey },
  timeout: 60000 // Increased from 30s to 60s for slow remote APIs
});
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const MAX_RETRY = 5; // Increased from 3 to 5 retries
const BACKOFF_BASE = 2000; // Exponential backoff starting at 2 seconds
const fetchAll = async (path) => {
  let page = 0;
  const items = [];
  const startTime = Date.now();

  logger.info({ path }, 'Starting fetch');

  while (true) {
    const params = {
      select: '*',
      limit: remoteMachinePageSize,
      offset: page * remoteMachinePageSize
    };
    let data = [];

    for (let attempt = 1; attempt <= MAX_RETRY; attempt += 1) {
      try {
        const response = await client.get(path, { params });
        data = response.data;
        break; // Success!
      } catch (error) {
        const isLastAttempt = attempt === MAX_RETRY;
        const backoffMs = BACKOFF_BASE * Math.pow(2, attempt - 1); // 2s, 4s, 8s, 16s, 32s

        logger.warn(
          {
            path,
            page,
            attempt,
            maxRetries: MAX_RETRY,
            backoffMs,
            error: error.message
          },
          'Remote machine fetch failed, retrying'
        );

        if (isLastAttempt) {
          logger.error(
            { path, page, totalItemsFetched: items.length },
            'Max retries exceeded, giving up on this page'
          );
          throw error;
        }

        await delay(backoffMs);
      }
    }

    if (!data.length) break;
    items.push(...data);

    // Progress logging every 10 pages
    if (page > 0 && page % 10 === 0) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      logger.info(
        {
          path,
          page,
          itemsSoFar: items.length,
          elapsedSeconds: elapsed
        },
        'Fetch progress'
      );
    }

    if (data.length < remoteMachinePageSize) break;
    page += 1;

    // Rate limiting: small delay every 5 pages to avoid overwhelming the API
    if (page % 5 === 0) {
      await delay(500);
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  logger.info(
    {
      path,
      totalPages: page + 1,
      totalItems: items.length,
      totalSeconds: totalTime
    },
    'Fetch completed'
  );

  return items;
};
export const syncMachines = async () => {
  logger.info('Machine sync started');

  // Fetch sequentially to avoid overwhelming the remote API
  // This prevents concurrent load on pages 27, 30, 37, etc.
  const machines = await fetchAll('/vending_machines');
  logger.info({ count: machines.length }, 'Machines fetched');

  // Small delay between fetches to give API breathing room
  await delay(1000);

  const slots = await fetchAll('/slots');
  logger.info({ count: slots.length }, 'Slots fetched');

  await delay(1000);

  const products = await fetchAll('/products');
  logger.info({ count: products.length }, 'Products fetched');

  // Use allSettled to prevent one failure from crashing entire sync
  // This allows machines and slots to be saved even if product sync fails
  const results = await Promise.allSettled([
    upsertMachines(machines),
    upsertRemoteProducts(products),
    upsertSlots(slots)
  ]);

  // Log individual failures for debugging
  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      const names = ['machines', 'products', 'slots'];
      logger.error(
        {
          name: names[i],
          error: result.reason?.message || result.reason
        },
        'Upsert failed'
      );
    }
  });

  const successCount = results.filter((r) => r.status === 'fulfilled').length;
  const failCount = results.filter((r) => r.status === 'rejected').length;

  logger.info(
    {
      machines: machines.length,
      slots: slots.length,
      products: products.length,
      upserted: successCount,
      failed: failCount
    },
    'Machine sync completed'
  );

  return ok(
    {
      machines: machines.length,
      slots: slots.length,
      products: products.length,
      succeeded: successCount,
      failed: failCount
    },
    failCount > 0 ? 'Machine sync partially completed' : 'Machine data synced'
  );
};
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};
export const getMachinesNear = async (lat, lng) => {
  const radius = 50; // km

  // Use cache library for consistency
  const machines = await cacheWrap(
    CacheKeys.machines(lat, lng, radius),
    async () => {
      const allMachines = await listMachines();
      return allMachines
        .map((machine) => {
          if (!machine.location_latitude || !machine.location_longitude) return null;
          const distance = haversineDistance(
            lat,
            lng,
            Number(machine.location_latitude),
            Number(machine.location_longitude)
          );
          return { ...machine, distance };
        })
        .filter(Boolean)
        .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
    },
    { ttl: CacheTTL.SHORT } // 5 minutes - location queries change frequently for different coords
  );

  logger.debug({ lat, lng, count: machines.length }, 'Machines near location retrieved');
  return machines;
};
export const getMachineDetail = async (machineUId) => {
  const machine = await getMachineById(machineUId);
  if (!machine) throw new apiError(404, 'Machine not found');
  const slots = await getMachineSlots(machineUId);
  return { machine, slots };
};
const getWebSocketConstructor = () => {
  const WS = globalThis.WebSocket;
  if (!WS) {
    throw new apiError(500, 'WebSocket client is unavailable in this runtime');
  }
  return WS;
};
export const dispatchDispenseCommand = async (machineId, slotNumber) => {
  if (!dispenseSocketUrl) {
    throw new apiError(500, 'Dispense socket URL is not configured');
  }
  if (!machineId || !slotNumber) {
    throw new apiError(400, 'machineId and slotNumber are required');
  }
  const payload = JSON.stringify({ type: 'dispense', machineId, slotNumber });
  logger.info({ socketUrl: dispenseSocketUrl, payload }, 'Dispatching dispense command');
  return new Promise((resolve, reject) => {
    const WS = getWebSocketConstructor();
    let settled = false;
    const socket = new WS(dispenseSocketUrl);
    const cleanup = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      try {
        socket.close();
      } catch (closeError) {
        logger.warn({ closeError }, 'Failed to close dispense socket cleanly');
      }
      if (error) {
        reject(error);
      } else {
        resolve(ok({ acknowledged: true }, 'Dispense command forwarded'));
      }
    };
    const timeoutId = setTimeout(() => {
      logger.error({ machineId, slotNumber }, 'Dispense socket timed out');
      cleanup(new apiError(504, 'Dispense socket timeout'));
    }, 10000);
    const handleOpen = () => {
      try {
        socket.send(payload);
      } catch (error) {
        logger.error({ error, machineId, slotNumber }, 'Failed to send dispense payload');
        cleanup(new apiError(502, 'Failed to send dispense payload'));
      }
    };
    const handleMessage = (event) => {
      logger.info(
        { machineId, slotNumber, data: event?.data },
        'Dispense acknowledgement received'
      );
      cleanup(null);
    };
    const handleError = (event) => {
      const error =
        event instanceof Error
          ? event
          : new apiError(502, 'Dispense socket error', JSON.stringify(event ?? {}));
      logger.error({ error, machineId, slotNumber }, 'Dispense socket error');
      cleanup(error instanceof apiError ? error : new apiError(502, error.message));
    };
    const handleClose = () => {
      cleanup(null);
    };
    socket.onopen = handleOpen;
    socket.onmessage = handleMessage;
    socket.onerror = handleError;
    socket.onclose = handleClose;
  });
};
