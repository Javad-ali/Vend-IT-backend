import { supabase } from '../../libs/supabase.js';
const getCategoryName = (product) => {
  const record = product;
  const alt = record.categoryName;
  return product.category_name ?? product.category ?? (typeof alt === 'string' ? alt : null);
};
export const ensureCategories = async (products) => {
  const allCategoryId = await ensureAllCategory();
  const names = [...new Set(products.map(getCategoryName).filter(Boolean))];
  let categoryMap = new Map();
  if (names.length) {
    const { data, error } = await supabase
      .from('categories')
      .upsert(
        names.map((name) => ({ category_name: name })),
        { onConflict: 'category_name' }
      )
      .select();
    if (error) throw error;
    categoryMap = new Map(data.map((cat) => [cat.category_name, cat.id]));
  }
  if (allCategoryId) categoryMap.set('All', allCategoryId);
  return { categoryMap, allCategoryId };
};
export const upsertRemoteProducts = async (products) => {
  if (!products.length) return;
  const { categoryMap, allCategoryId } = await ensureCategories(products);
  const payload = products.map((product) => {
    const record = product;
    const vendorPart =
      product.vendor_part_no ??
      (product.partNo ? String(product.partNo) : null) ??
      (typeof record.vendorPartNo === 'string' ? record.vendorPartNo : null);
    const recordImage = typeof record.imageUrl === 'string' ? record.imageUrl : null;
    const image = product.product_image_url ?? product.image_url ?? recordImage ?? null;
    const detailImage =
      product.product_detail_image_url ?? product.image_url ?? recordImage ?? null;
    return {
      product_u_id: product.id,
      brand_name: product.brand_name ?? product.name ?? null,
      description: product.description ?? product.ingredients ?? null,
      vendor_part_no: vendorPart,
      category_id: (() => {
        const name = getCategoryName(product);
        return name ? (categoryMap.get(name) ?? null) : null;
      })(),
      for_sale: product.for_sale ?? true,
      unit_price: product.unit_price ?? product.price ?? null,
      cost_price: product.cost_price ?? null,
      product_image_url: image,
      product_detail_image_url: detailImage,
      metadata: product.metadata ?? {
        health_rating: product.health_rating ?? null,
        calories: product.calories ?? null,
        fat: product.fat ?? null,
        carbs: product.carbs ?? null,
        protein: product.protein ?? null,
        sodium: product.sodium ?? null
      },
      updated_at: product.updated_at ?? product.created_at ?? new Date().toISOString()
    };
  });
  const { error } = await supabase.from('products').upsert(payload, { onConflict: 'product_u_id' });
  if (error) throw error;
  if (allCategoryId) {
    const { error: setAllCategoryError } = await supabase
      .from('products')
      .update({ category_id: allCategoryId })
      .is('category_id', null);
    if (setAllCategoryError) throw setAllCategoryError;
  }
};
export const listCategoriesForMachine = async (machineUId) => {
  const { data: slots, error } = await supabase
    .from('machine_slots')
    .select('product_u_id')
    .eq('machine_u_id', machineUId);
  if (error) throw error;
  const productIds = [...new Set(slots.map((slot) => slot.product_u_id).filter(Boolean))];
  if (!productIds.length) return [];
  const { data: products, error: productErr } = await supabase
    .from('products')
    .select('category_id')
    .in('product_u_id', productIds);
  if (productErr) throw productErr;
  const categoryIds = [...new Set(products.map((p) => p.category_id).filter(Boolean))];
  if (!categoryIds.length) return [];
  const { data: categories, error: categoryErr } = await supabase
    .from('categories')
    .select('id, category_name, description')
    .in('id', categoryIds);
  if (categoryErr) throw categoryErr;
  categories.sort((a, b) => a.category_name.localeCompare(b.category_name));
  const { data: defaultCat } = await supabase
    .from('categories')
    .select('id, category_name, description')
    .eq('category_name', 'All')
    .maybeSingle();
  return defaultCat ? [defaultCat, ...categories] : categories;
};
export const listProductsForMachine = async (machineUId) => {
  const { data, error } = await supabase
    .from('machine_slots')
    .select(
      `
      slot_number,
      quantity,
      max_quantity,
      price,
      product:product_u_id (
        product_u_id,
        brand_name,
        description,
        category_id,
        vendor_part_no,
        unit_price,
        cost_price,
        product_image_url,
        product_detail_image_url,
        metadata
      )
    `
    )
    .eq('machine_u_id', machineUId);
  if (error) throw error;
  // Transform to ensure product is a single object, not array
  return (
    data?.map((slot) => ({
      ...slot,
      product: Array.isArray(slot.product) ? (slot.product[0] ?? null) : slot.product
    })) ?? []
  );
};
export const getProductById = async (productId) => {
  const { data, error } = await supabase
    .from('products')
    .select(
      `
      product_u_id,
      brand_name,
      description,
      vendor_part_no,
      category_name,
      product_image_url,
      product_detail_image_url,
      metadata,
      updated_at,
      category:category_id (id, category_name)
    `
    )
    .eq('product_u_id', productId)
    .maybeSingle();
  if (error) throw error;
  if (data && Array.isArray(data.category)) {
    const [firstCategory] = data.category;
    (data as any).category = firstCategory ?? null;
  }
  return data;
};
export const getProductsByIds = async (productIds) => {
  if (!productIds.length) return [];
  const { data, error } = await supabase
    .from('products')
    .select('product_u_id, unit_price, metadata')
    .in('product_u_id', productIds);
  if (error) throw error;
  return data ?? [];
};
const ensureAllCategory = async () => {
  const { data, error } = await supabase
    .from('categories')
    .upsert({ category_name: 'All', description: 'All products' }, { onConflict: 'category_name' })
    .select()
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
};
