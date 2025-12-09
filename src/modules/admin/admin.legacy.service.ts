import axios from 'axios';
import FormData from 'form-data';
import { nanoid } from 'nanoid';
import { supabase } from '../../libs/supabase.js';
import { getConfig } from '../../config/env.js';
import { apiError, ok } from '../../utils/response.js';
const GENERATED_BUCKET = 'generated-images';
const buildGeneratedImageUrl = (fileName) => {
  const cdn = process.env.CDN_BASE_URL ?? '';
  return `${cdn}/generated-images/${fileName}`;
};
export const generateImageFromText = async (payload) => {
  const config = getConfig();
  if (!payload.prompt?.trim()) {
    throw new apiError(400, 'Prompt is required');
  }
  let buffer;
  if (config.nodeEnv === 'test') {
    buffer = Buffer.from(`test-image:${payload.prompt}`);
  } else {
    if (!config.vyroApiKey) {
      throw new apiError(500, 'Vyro API key is not configured');
    }
    const form = new FormData();
    form.append('prompt', payload.prompt);
    form.append('style_id', payload.styleId ?? '21');
    let response;
    try {
      response = await axios.post(config.vyroApiUrl, form, {
        headers: {
          Authorization: `Bearer ${config.vyroApiKey}`,
          ...form.getHeaders()
        },
        responseType: 'arraybuffer',
        timeout: 15000
      });
    } catch (error) {
      throw new apiError(502, 'Vyro generation failed', error.message);
    }
    buffer = Buffer.from(response.data);
  }
  const fileName = `text-${Date.now()}-${nanoid(6)}.png`;
  const { error: uploadError } = await supabase.storage
    .from(GENERATED_BUCKET)
    .upload(fileName, buffer, {
      contentType: 'image/png',
      upsert: true
    });
  if (uploadError) {
    throw new apiError(500, 'Failed to store generated image', uploadError.message);
  }
  return ok({ url: buildGeneratedImageUrl(fileName) }, 'Image generated');
};
