import { generateImageFromText } from './admin.legacy.service.js';
export const handleLegacyTextToImage = async (req, res) => {
  const response = await generateImageFromText({
    prompt: req.body.prompt,
    styleId: req.body.styleId
  });
  const wantsJson = req.headers.accept?.includes('application/json') || req.xhr;
  if (wantsJson) {
    return res.json(response);
  }
  const url = response.data?.url;
  if (url) {
    res.flash(
      'success',
      `Image generated: <a class="underline" href="${url}" target="_blank" rel="noopener noreferrer">View</a>`
    );
  } else {
    res.flash('success', response.message);
  }
  return res.redirect('/admin/legacy-tools');
};
export const renderLegacyTools = async (_req, res) => {
  return res.render('admin/legacy-tools.njk', { title: 'Legacy Tools' });
};
