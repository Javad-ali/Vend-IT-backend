import { supabase } from '../../libs/supabase.js';
export const getStaticContent = async () => {
  const { data, error } = await supabase.from('static_content').select('*').limit(1).maybeSingle();
  if (error) throw error;
  return data;
};
export const upsertStaticContent = async (payload) => {
  const { data: existing, error } = await supabase
    .from('static_content')
    .select('id')
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (existing?.id) {
    const { data, error: updateError } = await supabase
      .from('static_content')
      .update({
        privacy_policy: payload.privacyPolicy ?? null,
        terms_and_conditions: payload.termsAndConditions ?? null,
        faq: payload.faq ?? null,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id)
      .select('*')
      .maybeSingle();
    if (updateError) throw updateError;
    return data;
  }
  const { data: inserted, error: insertError } = await supabase
    .from('static_content')
    .insert({
      privacy_policy: payload.privacyPolicy ?? null,
      terms_and_conditions: payload.termsAndConditions ?? null,
      faq: payload.faq ?? null,
      updated_at: new Date().toISOString()
    })
    .select('*')
    .maybeSingle();
  if (insertError) throw insertError;
  return inserted;
};
export const createContactMessage = async (payload) => {
  const { error } = await supabase.from('contact_us').insert({
    user_id: payload.userId,
    email: payload.email,
    subject: payload.subject,
    message: payload.message
  });
  if (error) throw error;
};
export const listContactMessages = async () => {
  const { data, error } = await supabase
    .from('contact_us')
    .select(
      `
      id,
      email,
      subject,
      message,
      created_at,
      user:users!contact_us_user_id_fkey(first_name, last_name, phone_number)
    `
    )
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
};
