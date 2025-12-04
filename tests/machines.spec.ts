import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock repository functions
const listMachines = vi.fn();
const getMachineById = vi.fn();
const getMachineSlots = vi.fn();
const upsertMachines = vi.fn();
const upsertSlots = vi.fn();

vi.mock('../src/modules/machines/machines.repository.js', () => ({
  listMachines,
  getMachineById,
  getMachineSlots,
  upsertMachines,
  upsertSlots
}));

const upsertRemoteProducts = vi.fn();

vi.mock('../src/modules/products/products.repository.js', () => ({
  upsertRemoteProducts
}));

// Mock Redis
const redisMock = {
  get: vi.fn().mockResolvedValue(null),
  setex: vi.fn().mockResolvedValue('OK'),
  del: vi.fn().mockResolvedValue(1)
};

vi.mock('../src/libs/redis.js', () => ({
  redis: redisMock
}));

// Mock axios
const axiosGetMock = vi.fn();
vi.mock('axios', () => ({
  default: {
    create: vi.fn().mockReturnValue({
      get: axiosGetMock
    })
  }
}));

// Mock config
vi.mock('../src/config/env.js', () => ({
  getConfig: vi.fn().mockReturnValue({
    remoteMachineBaseUrl: 'https://api.machines.test',
    remoteMachineApiKey: 'test-key',
    remoteMachinePageSize: 100,
    dispenseSocketUrl: 'wss://test.socket',
    nodeEnv: 'test'
  })
}));

const { getMachinesNear, getMachineDetail, syncMachines } = await import(
  '../src/modules/machines/machines.service.js'
);

beforeEach(() => {
  vi.clearAllMocks();
  redisMock.get.mockResolvedValue(null);
});

describe('machines service', () => {
  describe('getMachinesNear', () => {
    it('returns machines sorted by distance', async () => {
      listMachines.mockResolvedValue([
        {
          u_id: 'machine-1',
          machine_tag: 'Mall A',
          location_latitude: 29.3759,
          location_longitude: 47.9774
        },
        {
          u_id: 'machine-2',
          machine_tag: 'Mall B',
          location_latitude: 29.3800,
          location_longitude: 48.0000
        },
        {
          u_id: 'machine-3',
          machine_tag: 'No Location',
          location_latitude: null,
          location_longitude: null
        }
      ]);

      const result = await getMachinesNear(29.3760, 47.9775);

      // machine-1 is closer to the query point
      expect(result).toHaveLength(2); // machine-3 excluded (no coords)
      expect(result[0].u_id).toBe('machine-1');
      expect(result[0].distance).toBeDefined();
      expect(result[0].distance).toBeLessThan(result[1].distance);
    });

    it('returns cached result if available', async () => {
      const cachedData = [
        { u_id: 'cached-1', distance: 0.5 }
      ];
      redisMock.get.mockResolvedValue(JSON.stringify(cachedData));

      const result = await getMachinesNear(29.3760, 47.9775);

      expect(result).toEqual(cachedData);
      expect(listMachines).not.toHaveBeenCalled();
    });

    it('caches result for 60 seconds', async () => {
      listMachines.mockResolvedValue([]);

      await getMachinesNear(29.3760, 47.9775);

      expect(redisMock.setex).toHaveBeenCalledWith(
        expect.stringContaining('machines:list:'),
        60,
        expect.any(String)
      );
    });

    it('calculates haversine distance correctly', async () => {
      // Kuwait City coordinates
      listMachines.mockResolvedValue([
        {
          u_id: 'machine-1',
          machine_tag: 'Test',
          location_latitude: 29.3759,
          location_longitude: 47.9774
        }
      ]);

      const result = await getMachinesNear(29.3759, 47.9774);

      // Same coordinates should give ~0 distance
      expect(result[0].distance).toBeLessThan(0.01);
    });
  });

  describe('getMachineDetail', () => {
    it('returns machine with slots', async () => {
      getMachineById.mockResolvedValue({
        u_id: 'machine-1',
        machine_tag: 'Test Machine',
        location_address: '123 Test St'
      });
      getMachineSlots.mockResolvedValue([
        { slot_number: 'A1', quantity: 5, product: { name: 'Chips' } },
        { slot_number: 'A2', quantity: 0, product: { name: 'Soda' } }
      ]);

      const result = await getMachineDetail('machine-1');

      expect(result.machine.machine_tag).toBe('Test Machine');
      expect(result.slots).toHaveLength(2);
      expect(result.slots[0].slot_number).toBe('A1');
    });

    it('throws error when machine not found', async () => {
      getMachineById.mockResolvedValue(null);

      await expect(getMachineDetail('invalid')).rejects.toThrow('Machine not found');
    });

    it('returns empty slots array when machine has no slots', async () => {
      getMachineById.mockResolvedValue({
        u_id: 'machine-1',
        machine_tag: 'Empty Machine'
      });
      getMachineSlots.mockResolvedValue([]);

      const result = await getMachineDetail('machine-1');

      expect(result.machine).toBeDefined();
      expect(result.slots).toHaveLength(0);
    });
  });

  describe('syncMachines', () => {
    it('calls upsert functions after fetching data', async () => {
      // The syncMachines function is complex with parallel fetching
      // We primarily test that it calls the upsert functions
      axiosGetMock.mockResolvedValue({ data: [] });

      upsertMachines.mockResolvedValue(undefined);
      upsertSlots.mockResolvedValue(undefined);
      upsertRemoteProducts.mockResolvedValue(undefined);

      const result = await syncMachines();

      expect(result.status).toBe(200);
      expect(result.message).toBe('Machine data synced');
      expect(upsertMachines).toHaveBeenCalled();
      expect(upsertSlots).toHaveBeenCalled();
      expect(upsertRemoteProducts).toHaveBeenCalled();
    });

    it('returns counts of synced items', async () => {
      axiosGetMock.mockResolvedValue({ data: [] });

      upsertMachines.mockResolvedValue(undefined);
      upsertSlots.mockResolvedValue(undefined);
      upsertRemoteProducts.mockResolvedValue(undefined);

      const result = await syncMachines();

      expect(result.data).toEqual({
        machines: 0,
        slots: 0,
        products: 0
      });
    });
  });
});

