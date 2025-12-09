import { supabase } from '../../libs/supabase.js';
export const getUser = async (userId) => {
  const { data, error } = await supabase
    .from('users')
    .select(
      'id, email, firstName:first_name, lastName:last_name, phoneNumber:phone_number, tapCustomerId:tap_customer_id'
    )
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
};
export const updateUserTapId = async (userId, tapCustomerId) => {
  const { error } = await supabase
    .from('users')
    .update({ tap_customer_id: tapCustomerId })
    .eq('id', userId);
  if (error) throw error;
};
export const upsertCard = async (payload) => {
  const { data, error } = await supabase
    .from('cards')
    .upsert(
      {
        user_id: payload.userId,
        tap_card_id: payload.tapCardId,
        last4: payload.last4,
        card_brand: payload.brand,
        holder_name: payload.holderName,
        exp_month: payload.expMonth,
        exp_year: payload.expYear
      },
      { onConflict: 'user_id,tap_card_id' }
    )
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
};
export const listCardsForUser = async (userId) => {
  const { data, error } = await supabase
    .from('cards')
    .select('tap_card_id, card_brand, last4, exp_month, exp_year, holder_name')
    .eq('user_id', userId);
  if (error) throw error;
  return data ?? [];
};
export const deleteCardByTapId = async (userId, tapCardId) => {
  const { error } = await supabase
    .from('cards')
    .delete()
    .eq('user_id', userId)
    .eq('tap_card_id', tapCardId);
  if (error) throw error;
};
export const ensureWallet = async (userId) => {
  const { data, error } = await supabase
    .from('wallet')
    .upsert({ user_id: userId }, { onConflict: 'user_id' })
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
};
export const getWalletBalance = async (userId) => {
  const { data, error } = await supabase
    .from('wallet')
    .select('id, user_id, balance, created_at, updated_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
};
export const incrementWallet = async (userId, amount) => {
  const { data, error } = await supabase.rpc('wallet_increment', {
    p_user_id: userId,
    p_amount: amount
  });
  if (error) throw error;
  return data;
};
export const decrementWallet = async (userId, amount) => {
  const { data, error } = await supabase.rpc('wallet_decrement', {
    p_user_id: userId,
    p_amount: amount
  });
  if (error) throw error;
  return data;
};
export const recordWalletTransaction = async (payload) => {
  const { error } = await supabase.from('wallet_transactions').insert({
    user_id: payload.userId,
    payment_id: payload.paymentId ?? null,
    type: payload.type,
    amount: payload.amount,
    metadata: payload.metadata ?? null
  });
  if (error) throw error;
};
export const createPayment = async (payload) => {
  const { data, error } = await supabase
    .from('payments')
    .insert({
      user_id: payload.userId,
      machine_u_id: payload.machineUId ?? null,
      transaction_id: payload.transactionId,
      payment_method: payload.paymentMethod,
      status: payload.status,
      amount: payload.amount,
      charge_id: payload.chargeId ?? null,
      tap_customer_id: payload.tapCustomerId ?? null
    })
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
};
export const attachPaymentProducts = async (payload) => {
  if (!payload.items.length) return;
  const { error } = await supabase.from('payment_products').insert(
    payload.items.map((item) => ({
      payment_id: payload.paymentId,
      product_u_id: item.productUId,
      quantity: item.quantity,
      dispensed_quantity: 0
    }))
  );
  if (error) throw error;
};
export const setPaymentEarnedPoints = async (paymentId, points) => {
  const { error } = await supabase
    .from('payments')
    .update({ earned_points: points })
    .eq('id', paymentId);
  if (error) throw error;
};
export const setPaymentRedemption = async (paymentId, points, amount) => {
  const { error } = await supabase
    .from('payments')
    .update({
      redeemed_points: points,
      redeemed_amount: amount
    })
    .eq('id', paymentId);
  if (error) throw error;
};
export const setDispensedQuantity = async (paymentId, productUId, qty) => {
  const { error } = await supabase
    .from('payment_products')
    .update({ dispensed_quantity: qty, updated_at: new Date().toISOString() })
    .eq('payment_id', paymentId)
    .eq('product_u_id', productUId);
  if (error) throw error;
};
export const createLoyaltyEntry = async (payload) => {
  const { error } = await supabase.from('loyality_points').insert({
    user_id: payload.userId,
    payment_id: payload.paymentId ?? null,
    points: payload.points,
    type: payload.type,
    reason: payload.reason ?? null,
    metadata: payload.metadata ?? {}
  });
  if (error) throw error;
};
export const incrementLoyaltyBalance = async (userId, points) => {
  const { data, error } = await supabase.rpc('loyalty_increment', {
    p_user_id: userId,
    p_points: points
  });
  if (error) throw error;
  const balanceRow = Array.isArray(data) ? data[0] : data;
  return balanceRow?.balance ?? balanceRow?.points ?? null;
};
export const getLoyaltyBalance = async (userId) => {
  const { data, error } = await supabase
    .from('user_loyality_points')
    .select('points')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  const value = Number(data?.points ?? 0);
  return Number.isFinite(value) ? value : 0;
};
export const listPaymentHistory = async (userId) => {
  const { data, error } = await supabase
    .from('payments')
    .select(
      `
      id,
      transaction_id,
      payment_method,
      status,
      amount,
      created_at,
      products:payment_products (
        product_u_id,
        quantity,
        dispensed_quantity,
        product:product_u_id (
          description,
          product_image_url
        )
      )
    `
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
};
export const getPaymentById = async (paymentId) => {
  const { data, error } = await supabase
    .from('payments')
    .select('id, user_id, machine_u_id, status, charge_id')
    .eq('id', paymentId)
    .maybeSingle();
  if (error) throw error;
  return data;
};
export const getPaymentByChargeId = async (chargeId) => {
  const { data, error } = await supabase
    .from('payments')
    .select('id, user_id, machine_u_id, status, charge_id')
    .eq('charge_id', chargeId)
    .maybeSingle();
  if (error) throw error;
  return data;
};
export const updatePaymentStatus = async (paymentId, status) => {
  const { data, error } = await supabase
    .from('payments')
    .update({
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', paymentId)
    .select('id, status')
    .maybeSingle();
  if (error) throw error;
  return data;
};
export const listWalletHistory = async (userId) => {
  const { data: transactions, error } = await supabase
    .from('wallet_transactions')
    .select(
      `
      id,
      payment_id,
      type,
      amount,
      metadata,
      created_at
    `
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  const paymentIds = (transactions ?? [])
    .map((entry) => entry.payment_id)
    .filter((id) => Boolean(id));
  const paymentMap = new Map();
  if (paymentIds.length) {
    const { data: payments, error: paymentError } = await supabase
      .from('payments')
      .select(
        `
        id,
        charge_id,
        user_id,
        machine_u_id,
        transaction_id,
        status,
        payment_method,
        amount,
        created_at,
        updated_at
      `
      )
      .in('id', paymentIds);
    if (paymentError) throw paymentError;
    payments?.forEach((payment) => paymentMap.set(payment.id, payment));
  }
  return (transactions ?? []).map((entry) => ({
    ...entry,
    payment: entry.payment_id ? (paymentMap.get(entry.payment_id) ?? null) : null
  }));
};
export const listOrderHistory = async (userId) => {
  const { data, error } = await supabase
    .from('payments')
    .select(
      `
      id,
      user_id,
      machine_u_id,
      transaction_id,
      payment_method,
      status,
      amount,
      earned_points,
      redeemed_points,
      redeemed_amount,
      created_at,
      updated_at,
      machine:machine_u_id (
        u_id,
        machine_tag,
        machine_image_url
      ),
      products:payment_products (
        quantity,
        product:product_u_id (
          product_u_id,
          brand_name,
          description,
          product_image_url
        )
      ),
      rating:ratings (
        rating,
        emoji,
        comment
      )
    `
    )
    .eq('user_id', userId)
    .neq('status', 'CREDIT')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
};
export const listLoyaltyHistory = async (userId) => {
  const { data, error } = await supabase
    .from('loyality_points')
    .select(
      `
      points,
      type,
      reason,
      metadata,
      created_at,
      payment:payment_id (
        id,
        machine:machine_u_id (
          machine_tag,
          machine_image_url
        )
      )
    `
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
};
export const listPaymentProductQuantities = async (paymentId) => {
  const { data, error } = await supabase
    .from('payment_products')
    .select('quantity')
    .eq('payment_id', paymentId);
  if (error) throw error;
  return (data ?? []).map((item) => Number(item.quantity ?? 0));
};
