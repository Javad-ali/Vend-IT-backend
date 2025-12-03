import { describe, it, expect, vi, beforeEach } from 'vitest';

const serviceMocks = vi.hoisted(() => ({
  getCategories: vi.fn(),
  getProducts: vi.fn(),
  searchProducts: vi.fn()
}));

vi.mock('../src/modules/products/products.service.js', () => serviceMocks);

const { getProducts } = serviceMocks;
const { handleProducts } = await import('../src/modules/products/products.controller.js');

const createRes = () => {
  const json = vi.fn();
  const status = vi.fn().mockReturnThis();
  return { status, json };
};

describe('products controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when machineId is missing', async () => {
    const req = { query: {} };
    const res = createRes();

    await handleProducts(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      status: 400,
      message: 'machine_id query param is required'
    });
    expect(getProducts).not.toHaveBeenCalled();
  });

  it('delegates to getProducts when query params are present', async () => {
    const payload = { status: 200, data: [] };
    getProducts.mockResolvedValue(payload);
    const req = { query: { machineId: 'machine-1', categoryId: 'cat-5' } };
    const res = createRes();

    await handleProducts(req as any, res as any);

    expect(getProducts).toHaveBeenCalledWith('machine-1', 'cat-5');
    expect(res.json).toHaveBeenCalledWith(payload);
  });
});
