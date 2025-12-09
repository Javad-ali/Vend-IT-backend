import axios from 'axios';
import { supabase } from '../../libs/supabase.js';
import { apiError, ok } from '../../utils/response.js';
import {
  getProductById,
  listCategoriesForMachine,
  listProductsForMachine
} from './products.repository.js';
import { getConfig } from '../../config/env.js';
import { cacheWrap, CacheKeys, CacheTTL } from '../../libs/cache.js';
import { logger } from '../../config/logger.js';

const { remoteMachineBaseUrl, remoteMachineApiKey, remoteMachinePageSize } = getConfig();
const client = axios.create({
  baseURL: remoteMachineBaseUrl,
  headers: { apikey: remoteMachineApiKey }
});
export const getCategories = async (machineUId) => {
  // Use cache wrapper for categories
  const categories = await cacheWrap(
    CacheKeys.categories(machineUId),
    () => listCategoriesForMachine(machineUId),
    { ttl: CacheTTL.LONG } // 1 hour - categories change infrequently
  );

  logger.debug({ machineUId, count: categories.length }, 'Categories retrieved');
  return ok(categories, 'Categories found');
};
const fetchRemoteProduct = async (productId) => {
  const { data } = await client.get(`/products`, {
    params: { select: '*', id: `eq.${productId}` }
  });
  return data?.[0] ?? null;
};
const titleCase = (value) =>
  value
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
const toRecord = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value;
};
const getRecordString = (record, key) => {
  if (!record) return null;
  const value = record[key];
  return typeof value === 'string' ? value : null;
};
const buildProductProperties = (metadata, remote) => {
  const seen = new Set();
  const properties = [];
  const addEntry = (key, value) => {
    if (value === undefined || value === null) return;
    const normalizedKey = key.trim();
    if (!normalizedKey.length || seen.has(normalizedKey)) return;
    const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value).trim();
    if (!stringValue.length) return;
    seen.add(normalizedKey);
    properties.push({
      display_name: titleCase(normalizedKey),
      property_name: normalizedKey,
      value: stringValue
    });
  };
  if (metadata && typeof metadata === 'object') {
    Object.entries(metadata).forEach(([key, value]) => addEntry(key, value));
  }
  if (remote) {
    const remoteProps = {
      price: remote.price ?? remote.unit_price ?? null,
      health_rating: remote.health_rating ?? null,
      calories: remote.calories ?? null,
      fat: remote.fat ?? null,
      carbs: remote.carbs ?? null,
      protein: remote.protein ?? null,
      sodium: remote.sodium ?? null
    };
    Object.entries(remoteProps).forEach(([key, value]) => addEntry(key, value));
  }
  return properties;
};
export const getProducts = async (machineUId, categoryId) => {
  // Determine cache key based on category
  const cacheKey = categoryId
    ? CacheKeys.products(machineUId, categoryId)
    : CacheKeys.products(machineUId);

  // Cache the entire product list per machine first
  const slots = await cacheWrap(
    CacheKeys.products(machineUId),
    () => listProductsForMachine(machineUId),
    { ttl: CacheTTL.MEDIUM } // 30 minutes
  );

  const normalizedCategory = categoryId?.trim().toLowerCase();
  const isAllCategory =
    !categoryId ||
    normalizedCategory === 'all' ||
    normalizedCategory === 'all products' ||
    normalizedCategory === 'all-products';
  let filtered = slots.filter((slot) => {
    if (!slot.product) return false;
    if (isAllCategory || categoryId === 'ALL') return true;
    return String(slot.product.category_id) === categoryId;
  });
  const remoteProductIdSet = new Set(
    filtered.map((slot) => slot.product?.product_u_id).filter(Boolean)
  );
  if (remoteProductIdSet.size > 0) {
    const remoteLookup = new Map();
    await Promise.all(
      Array.from(remoteProductIdSet).map(async (productId) => {
        try {
          const remoteData = await fetchRemoteProduct(productId);
          if (remoteData) remoteLookup.set(productId, remoteData);
        } catch {
          // Ignore errors from remote fetch
        }
      })
    );
    filtered = filtered.map((slot) => {
      const remoteData = remoteLookup.get(slot.product?.product_u_id);
      if (remoteData) {
        return { ...slot, remoteData };
      }
      return slot;
    });
  }
  const mapped = filtered.map((slot) => {
    const product = slot.product;
    const vendorPart = product?.vendor_part_no ?? null;
    // Extract health_rating from metadata
    const metadata = product?.metadata;
    const healthRating = metadata?.health_rating ?? null;
    return {
      slot: slot.slot_number,
      quantity: slot.quantity,
      maxQuantity: slot.max_quantity,
      price: slot.price ?? product?.unit_price ?? null,
      product: product
        ? {
            ...product,
            partNo: vendorPart ?? null,
            health_rating: healthRating
          }
        : null
    };
  });

  logger.debug({ machineUId, categoryId, count: mapped.length }, 'Products retrieved');
  return ok(mapped, 'Products found');
};
// export const searchProducts = async (machineUId: string, searchTerm: string) => {
//   const slots = await listProductsForMachine(machineUId);
//   const term = searchTerm.toLowerCase();
//   const filtered = slots.filter(slot => {
//     const description = slot.product?.description?.toLowerCase() ?? '';
//     const brand = slot.product?.brand_name?.toLowerCase() ?? '';
//     return description.includes(term) || brand.includes(term);
//   });
//   return ok(
//     filtered.map(slot => ({
//       slot: slot.slot_number,
//       product: slot.product
//     })),
//     'Products found'
//   );
// };
export const searchProducts = async (machineUId, searchTerm) => {
  const { data, error } = await supabase
    .from('machine_slots')
    .select(
      `
      slot_number,
      quantity,
      max_quantity,
      price,
      product_u_id,
      product:product_u_id (
        product_u_id,
        brand_name,
        description,
        category_id,
        category_name,
        unit_price,
        cost_price,
        vendor_part_no,
        product_image_url,
        product_detail_image_url,
        metadata,
        updated_at
      )
    `
    )
    .eq('machine_u_id', machineUId)
    .or(
      `description.ilike.*${searchTerm}*,brand_name.ilike.*${searchTerm}*,vendor_part_no.ilike.*${searchTerm}*`,
      { referencedTable: 'product' }
    );
  if (error) throw error;
  const beautified = (data ?? [])
    .filter((slot) => slot.product !== null) // Add this filter
    .map((slot) => {
      const rawProduct = Array.isArray(slot.product) ? (slot.product[0] ?? null) : slot.product;
      return {
        slot: slot.slot_number,
        quantity: slot.quantity,
        maxQuantity: slot.max_quantity,
        price: slot.price ?? rawProduct?.unit_price ?? null,
        product: formatLegacyProduct(rawProduct)
      };
    });
  return ok(beautified, 'Products found');
};
const formatLegacyProduct = (product) => {
  if (!product) return null;
  const metadata = product.metadata ?? null;
  const getMetaNumber = (key) => {
    const value = metadata?.[key];
    if (typeof value === 'number') return value;
    if (typeof value === 'string' && value.trim() !== '') {
      const num = Number(value);
      return Number.isNaN(num) ? null : num;
    }
    return null;
  };
  const imageUrl = product.product_image_url ?? product.product_detail_image_url ?? null;
  return {
    id: product.product_u_id ?? null,
    brand_name: product.brand_name ?? null,
    price: product.unit_price ?? null,
    product_image_url: imageUrl,
    created_at: product.updated_at ?? null,
    description: product.description ?? null,
    health_rating: getMetaNumber('health_rating'),
    calories: getMetaNumber('calories'),
    fat: getMetaNumber('fat'),
    carbs: getMetaNumber('carbs'),
    protein: getMetaNumber('protein'),
    sodium: getMetaNumber('sodium'),
    category: metadata?.category ?? product.category_name ?? null,
    partNo: product.vendor_part_no ?? null
  };
};
export const getProductDetail = async (productId) => {
  const [product, remote] = await Promise.all([
    getProductById(productId),
    fetchRemoteProduct(productId)
  ]);
  if (!product) throw new apiError(404, 'Product not found');
  return ok({ ...product, remote }, 'Product detail');
};
export const getProductImage = async (productId) => {
  const [product, remote] = await Promise.all([
    getProductById(productId),
    fetchRemoteProduct(productId)
  ]);
  if (!product && !remote) throw new apiError(404, 'Product not found');
  const productRecord = toRecord(product);
  const metadata = toRecord(productRecord?.metadata ?? null);
  const recommendedGender = getRecordString(metadata, 'recommended_gender');
  const productType = getRecordString(metadata, 'product_type');
  const remark = getRecordString(metadata, 'remark') ?? remote?.ingredients ?? null;
  const categoryRelation = toRecord(productRecord?.category ?? null);
  const categoryName =
    getRecordString(categoryRelation, 'category_name') ??
    getRecordString(productRecord, 'category_name') ??
    remote?.category ??
    null;
  const payload = {
    u_id: product?.product_u_id ?? remote?.id ?? null,
    description: product?.description ?? remote?.description ?? remote?.ingredients ?? null,
    remark,
    vendor_part_no: product?.vendor_part_no ?? (remote?.partNo ? String(remote.partNo) : null),
    category_name: categoryName,
    brand_name: product?.brand_name ?? remote?.name ?? null,
    product_image_url: product?.product_image_url ?? remote?.image_url ?? null,
    product_detail_image_url: product?.product_detail_image_url ?? remote?.image_url ?? null,
    recommended_gender: recommendedGender,
    createAt: product?.updated_at ?? remote?.created_at ?? null,
    product_type: productType,
    product_property: buildProductProperties(metadata, remote)
  };
  return ok(payload, 'Product detail');
};
