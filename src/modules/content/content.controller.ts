import {
  fetchContactMessages,
  fetchStaticContent,
  submitContact,
  updateStaticContent
} from './content.service.js';
import { contactSchema, staticContentSchema } from './content.validators.js';
export const handleContact = async (req, res) => {
  const payload = contactSchema.parse(req.body);
  const response = await submitContact(req.user.id, payload);
  return res.json(response);
};
export const handleStaticContent = async (_req, res) => {
  const response = await fetchStaticContent();
  return res.json(response);
};
export const handleUpdateStatic = async (req, res) => {
  const payload = staticContentSchema.parse(req.body);
  const response = await updateStaticContent(payload);
  return res.json(response);
};
export const handleAdminContactList = async (_req, res) => {
  const messages = await fetchContactMessages();
  return res.render('admin/feedback.njk', {
    title: 'Feedback',
    feedback: messages
  });
};
export const renderAdminStaticContent = async (_req, res) => {
  const response = await fetchStaticContent();
  return res.render('admin/static-content.njk', {
    title: 'Static Content',
    content: response.data
  });
};
export const handleAdminStaticUpdate = async (req, res) => {
  try {
    const payload = staticContentSchema.parse(req.body);
    await updateStaticContent(payload);
    res.flash('success', 'Static content updated successfully');
  } catch (error) {
    res.flash('error', error.message);
  }
  return res.redirect('/admin/content');
};
