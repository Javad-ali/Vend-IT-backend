// import { Router } from 'express';
// // import {
// //   getDashboard,
// //   getUsersList,
// //   getUserDetails,
// //   postSuspendUser,
// //   postDeleteUser,
// //   postChangePassword
// // } from '@modules/users/users.controller.js';
// // import { requireAuth } from 'src/middleware/auth';
// import campaignsRoutes from './campaigns.routes.js';
// const router = Router();
// // router.use(requireAuth('admin'));
// router.use('/campaigns', campaignsRoutes);
// // router.get('/dashboard', getDashboard);
// // router.get('/users', getUsersList);
// // router.get('/users/:id', getUserDetails);
// // router.post('/users/:id/suspend', postSuspendUser);
// // router.post('/users/:id/delete', postDeleteUser);
// // router
// //   .route('/change-password')
// //   .get((_req, res) => res.render('admin/password'))
// //   .post(postChangePassword);
// export default router;
import { Router } from 'express';
import { handleChangePassword, handleDeleteUser, handleSuspendUser, renderAllProducts, renderChangePassword, renderDashboard, renderMachineProducts, renderMachines, renderOrderDetails, renderOrders, renderProductDetails, renderUserDetails, renderUsers } from '../modules/admin/admin.controller.js';
import { attachAdmin, requireAdmin } from '../middleware/admin-auth.js';
import campaignsAdminRoutes from './campaigns.admin.routes.js';
import { handleAdminContactList, handleAdminStaticUpdate, renderAdminStaticContent } from '../modules/content/content.controller.js';
import { generateMachineQr } from '../modules/machines/machines.qr.service.js';
import { avatarUpload, categoryUpload, handleCreateCategory, handleProfileUpdate, handleUpdateCategory, renderCategoryForm, renderCategoryList, renderProfilePage } from '../modules/admin/admin.profile.controller.js';
import { loadCategory } from '../modules/admin/admin.category.middleware.js';
import { handleLegacyTextToImage, renderLegacyTools } from '../modules/admin/admin.legacy.controller.js';
const router = Router();
router.use(requireAdmin, attachAdmin);
router.get('/', renderDashboard);
router.get('/profile', renderProfilePage);
router.post('/profile', avatarUpload, handleProfileUpdate);
router.get('/categories', renderCategoryList);
router.get('/categories/create', renderCategoryForm);
router.post('/categories/create', categoryUpload, handleCreateCategory);
router.get('/categories/:categoryId/edit', loadCategory, renderCategoryForm);
router.post('/categories/:categoryId/edit', loadCategory, categoryUpload, handleUpdateCategory);
router.get('/users', renderUsers);
router.post('/users/:userId/delete', handleDeleteUser);
router.post('/users/:userId/status', handleSuspendUser);
router.get('/users/:userId', renderUserDetails);
router.get('/machines', renderMachines);
router.get('/machines/:machineId/products', renderMachineProducts);
router.get('/products', renderAllProducts);
router.get('/products/:productId', renderProductDetails);
router.get('/orders', renderOrders);
router.get('/orders/:orderId', renderOrderDetails);
router.get('/feedback', handleAdminContactList);
router.get('/content', renderAdminStaticContent);
router.post('/content', handleAdminStaticUpdate);
router.get('/legacy-tools', renderLegacyTools);
router.post('/legacy/text-to-image', handleLegacyTextToImage);
router.get('/change-password', renderChangePassword);
router.post('/change-password', handleChangePassword);
router.use('/campaigns', campaignsAdminRoutes);
router.post('/machines/:machineId/qr', async (req, res) => {
    await generateMachineQr(req.params.machineId);
    (res as any).flash('success', 'QR code regenerated');
    res.redirect('/admin/machines');
});
export default router;
