import { describe, it, expect, vi, beforeEach } from 'vitest';

const listCategoriesForMachine = vi.fn();
const listProductsForMachine = vi.fn();
const getProductById = vi.fn();

vi.mock('../src/modules/products/products.repository.js', () => ({
  listCategoriesForMachine,
  listProductsForMachine,
  getProductById
}));

const { getCategories, getProducts } = await import(
  '../src/modules/products/products.service.js'
);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('products service', () => {
  it('returns categories with the expected ok payload', async () => {
    const categories = [{ id: 'cat-1', category_name: 'Healthy Snacks' }];
    listCategoriesForMachine.mockResolvedValue(categories);

    const result = await getCategories('machine-55');

    expect(listCategoriesForMachine).toHaveBeenCalledWith('machine-55');
    expect(result.status).toBe(200);
    expect(result.data).toEqual(categories);
    expect(result.message).toBe('Categories found');
  });

  it('maps slots into the products payload with health ratings', async () => {
    listProductsForMachine.mockResolvedValue([
      {
        slot_number: 'A1',
        quantity: 2,
        max_quantity: 10,
        price: 0.5,
        product: {
          product_u_id: 'prod-1',
          vendor_part_no: 'XYZ',
          category_id: 'cat-healthy',
          unit_price: 0.45,
          metadata: { health_rating: 4 }
        }
      },
      {
        slot_number: 'A2',
        quantity: 0,
        max_quantity: 8,
        price: 1.25,
        product: {
          product_u_id: 'prod-2',
          vendor_part_no: 'ABC',
          category_id: 'cat-drinks',
          unit_price: 1.25,
          metadata: {}
        }
      }
    ]);

    const result = await getProducts('machine-55', 'cat-healthy');

    expect(listProductsForMachine).toHaveBeenCalledWith('machine-55');
    expect(result.status).toBe(200);
    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toMatchObject({
      slot: 'A1',
      quantity: 2,
      maxQuantity: 10,
      price: 0.5,
      product: expect.objectContaining({
        product_u_id: 'prod-1',
        partNo: 'XYZ',
        health_rating: 4
      })
    });
  });

  it('falls back to returning in-stock products if category filter is empty', async () => {
    listProductsForMachine.mockResolvedValue([
      {
        slot_number: 'B1',
        quantity: 1,
        max_quantity: 4,
        price: 2,
        product: {
          product_u_id: 'prod-3',
          category_id: 'cat-energy',
          unit_price: 2
        }
      }
    ]);

    const result = await getProducts('machine-5', 'cat-missing');

    expect(result.data).toHaveLength(1);
    expect(result.data[0].slot).toBe('B1');
  });
});
