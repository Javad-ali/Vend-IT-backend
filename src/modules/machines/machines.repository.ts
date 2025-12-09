import { getConfig } from '../../config/env.js';
import { supabase } from '../../libs/supabase.js';
const config = getConfig();
const pickProp = (source, ...keys) => {
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null) {
      return value;
    }
  }
  return null;
};
const mapRemoteMachine = (machine) => {
  const fallbackStatus = pickProp(machine, 'machine_operation_state', 'status') ?? null;
  return {
    u_id: machine.id,
    machine_tag: pickProp(machine, 'machine_tag', 'machineId', 'machine_id') ?? null,
    model: machine.model ?? null,
    serial_no: machine.serial_no ?? null,
    description: machine.description ?? null,
    distance: machine.distance ?? null,
    manufacturer: machine.manufacturer ?? null,
    specification: machine.specification ?? null,
    country: machine.country ?? null,
    state_province: machine.state_province ?? null,
    location_address: pickProp(machine, 'location_address', 'locationAddress', 'location') ?? null,
    location_latitude: machine.location_latitude ?? null,
    location_longitude: machine.location_longitude ?? null,
    mac_address: machine.mac_address ?? null,
    security_id: machine.security_id ?? null,
    machine_image_url: machine.machine_image_url ?? null,
    machine_operation_state: machine.machine_operation_state ?? fallbackStatus,
    subscription_expiry: machine.subscription_expiry ?? null,
    last_hearbeat: machine.last_hearbeat ?? null,
    last_machine_status: machine.last_machine_status ?? fallbackStatus,
    machine_currency: machine.machine_currency ?? null,
    machine_pin: machine.machine_pin ?? null,
    machine_socket: machine.machine_socket ?? null,
    machine_qrcode: machine.machine_qrcode ?? null,
    created_at: machine.created_at ?? new Date().toISOString(),
    updated_at: machine.updated_at ?? machine.created_at ?? new Date().toISOString()
  };
};
export const upsertMachines = async (machines) => {
  if (!machines.length) return;
  const { error } = await supabase.from('machine').upsert(
    machines.map((machine) => mapRemoteMachine(machine)),
    { onConflict: 'u_id' }
  );
  if (error) throw error;
};
// const { error } = await supabase.from('machine_slots').upsert(
//     slots.map(slot => {
export const upsertSlots = async (slots) => {
  if (!slots.length) return;
  const CHUNK_SIZE = 500;
  for (let i = 0; i < slots.length; i += CHUNK_SIZE) {
    const chunk = slots.slice(i, i + CHUNK_SIZE);
    const payload = chunk.map((slot) => {
      const slotRecord = slot;
      const slotNumber = pickProp(slotRecord, 'slot_number', 'slotNumber') ?? slot.slot_number;
      const maxQuantity =
        slot.max_quantity ?? slot.max_capacity ?? pickProp(slotRecord, 'maxCapacity');
      const price = slot.price ?? slot.custom_price ?? pickProp(slotRecord, 'customPrice');
      const quantity = slot.quantity ?? pickProp(slotRecord, 'quantity', 'qty', 'stock');
      return {
        machine_u_id: slot.vending_machine_id,
        slot_number: String(slotNumber),
        product_u_id: slot.product_id,
        quantity: quantity ?? null,
        max_quantity: maxQuantity ?? null,
        price: price ?? null,
        raw: slot
      };
    });
    let attempt = 0;
    // include up to 100 machines per chunk, so 500*? maybe but I added loop.
    while (true) {
      try {
        const { error } = await supabase.from('machine_slots').upsert(payload, {
          onConflict: 'machine_u_id,slot_number'
        });
        if (error) throw error;
        break;
      } catch (error) {
        attempt += 1;
        if (attempt >= 3) throw error;
        await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
      }
    }
  }
};
export const listMachines = async () => {
  const { data, error } = await supabase.from('machine').select('*');
  if (error) throw error;
  return data;
};
export const getMachineById = async (id) => {
  const { data, error } = await supabase.from('machine').select('*').eq('u_id', id).maybeSingle();
  if (error) throw error;
  return data;
};
export const getMachineSlots = async (machineUId) => {
  const { data, error } = await supabase
    .from('machine_slots')
    .select(
      'slot_number, quantity, max_quantity, price, product:product_u_id (brand_name, description, product_image_url, unit_price)'
    )
    .eq('machine_u_id', machineUId);
  if (error) throw error;
  return data;
};
export const updateMachineQrCode = async (machineId, qrPath) => {
  const { data, error } = await supabase
    .from('machine')
    .update({ machine_qrcode: qrPath, updated_at: new Date().toISOString() })
    .eq('u_id', machineId)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
};
export const logWebhookEvent = async (payload) => {
  if (config.nodeEnv === 'test') {
    return;
  }
  const { error } = await supabase.from('machine_webhooks').insert({
    source: payload.source,
    headers: payload.headers,
    payload: payload.body
  });
  if (error) throw error;
};
