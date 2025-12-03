import axios from 'axios';
import { getConfig } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { redis } from '../../libs/redis.js';
import { getMachineById, getMachineSlots, listMachines, upsertMachines, upsertSlots } from './machines.repository.js';
import { upsertRemoteProducts } from '../products/products.repository.js';
import { apiError, ok } from '../../utils/response.js';
const { remoteMachineBaseUrl, remoteMachineApiKey, remoteMachinePageSize, dispenseSocketUrl } = getConfig();
const client = axios.create({
    baseURL: remoteMachineBaseUrl,
    headers: { apikey: remoteMachineApiKey },
    timeout: 30000
});
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const MAX_RETRY = 3;
const fetchAll = async (path) => {
    let page = 0;
    const items = [];
    while (true) {
        const params = { select: '*', limit: remoteMachinePageSize, offset: page * remoteMachinePageSize };
        let data = [];
        for (let attempt = 1; attempt <= MAX_RETRY; attempt += 1) {
            try {
                const response = await client.get(path, { params });
                data = response.data;
                break;
            }
            catch (error) {
                logger.warn({ path, page, attempt, error: error.message }, 'Remote machine fetch failed, retrying');
                if (attempt === MAX_RETRY) {
                    throw error;
                }
                await delay(attempt * 500);
            }
        }
        if (!data.length)
            break;
        items.push(...data);
        if (data.length < remoteMachinePageSize)
            break;
        page += 1;
    }
    return items;
};
export const syncMachines = async () => {
    const [machines, slots, products] = await Promise.all([
        fetchAll('/vending_machines'),
        fetchAll('/slots'),
        fetchAll('/products')
    ]);
    await Promise.all([upsertMachines(machines), upsertRemoteProducts(products), upsertSlots(slots)]);
    logger.info({ machines: machines.length, slots: slots.length, products: products.length }, 'Machine sync completed');
    return ok({ machines: machines.length, slots: slots.length, products: products.length }, 'Machine data synced');
};
const haversineDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};
export const getMachinesNear = async (lat, lng) => {
    const cacheKey = `machines:list:${lat.toFixed(3)}:${lng.toFixed(3)}`;
    const cached = await redis.get(cacheKey);
    if (cached)
        return JSON.parse(cached);
    const machines = await listMachines();
    const enriched = machines
        .map(machine => {
        if (!machine.location_latitude || !machine.location_longitude)
            return null;
        const distance = haversineDistance(lat, lng, Number(machine.location_latitude), Number(machine.location_longitude));
        return { ...machine, distance };
    })
        .filter(Boolean)
        .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
    await redis.setex(cacheKey, 60, JSON.stringify(enriched));
    return enriched;
};
export const getMachineDetail = async (machineUId) => {
    const machine = await getMachineById(machineUId);
    if (!machine)
        throw new apiError(404, 'Machine not found');
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
            if (settled)
                return;
            settled = true;
            clearTimeout(timeoutId);
            try {
                socket.close();
            }
            catch (closeError) {
                logger.warn({ closeError }, 'Failed to close dispense socket cleanly');
            }
            if (error) {
                reject(error);
            }
            else {
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
            }
            catch (error) {
                logger.error({ error, machineId, slotNumber }, 'Failed to send dispense payload');
                cleanup(new apiError(502, 'Failed to send dispense payload'));
            }
        };
        const handleMessage = (event) => {
            logger.info({ machineId, slotNumber, data: event?.data }, 'Dispense acknowledgement received');
            cleanup(null);
        };
        const handleError = (event) => {
            const error = event instanceof Error
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
