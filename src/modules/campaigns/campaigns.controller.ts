import { fetchLatestCampaign } from './campaigns.service.js';
import { catchAsync } from '../../utils/catch-async.js';
export const handleLatestCampaign = catchAsync(async (req, res) => {
  const response = await fetchLatestCampaign(req.user.id);
  return res.json(response);
});
