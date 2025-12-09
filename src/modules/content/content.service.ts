import { apiError, ok } from '../../utils/response.js';
import {
  createContactMessage,
  getStaticContent,
  listContactMessages,
  upsertStaticContent
} from './content.repository.js';
export const submitContact = async (userId, payload) => {
  await createContactMessage({
    userId,
    email: payload.email,
    subject: payload.subject,
    message: payload.message
  });
  return ok(null, 'Contact form submitted');
};
export const fetchStaticContent = async () => {
  const content = await getStaticContent();
  if (!content) throw new apiError(404, 'Content not found');
  return ok(content, 'Static content found');
};
export const updateStaticContent = async (payload) => {
  const updated = await upsertStaticContent(payload);
  return ok(updated, 'Static content updated');
};
export const fetchContactMessages = async () => listContactMessages();
