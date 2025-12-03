import { deleteAdminUser, getAdminDashboard, getAdminFeedback, getAdminMachineProducts, getAdminMachines, getAdminOrder, getAdminOrders, getAdminProduct, getAdminProducts, getAdminUserDetails, getAdminUsers, toggleUserStatus } from './admin.service.js';
import { changeAdminPassword } from './admin-auth.service.js';
export const renderDashboard = async (_req, res) => {
    const metrics = await getAdminDashboard();
    return res.render('admin/dashboard.njk', {
        title: 'Dashboard',
        metrics
    });
};
export const renderUsers = async (_req, res) => {
    const users = await getAdminUsers();
    return res.render('admin/users-list.njk', {
        title: 'Users',
        users
    });
};
export const handleDeleteUser = async (req, res) => {
    await deleteAdminUser(req.params.userId);
    res.flash('success', 'User deleted successfully');
    return res.redirect('/admin/users');
};
export const handleSuspendUser = async (req, res) => {
    const status = Number(req.body.status);
    await toggleUserStatus(req.params.userId, status);
    res.flash('success', status === 1 ? 'User unsuspended' : 'User suspended');
    return res.redirect('/admin/users');
};
export const renderUserDetails = async (req, res) => {
    const data = await getAdminUserDetails(req.params.userId);
    return res.render('admin/user-details.njk', {
        title: 'User Details',
        ...data
    });
};
export const renderMachines = async (_req, res) => {
    const machines = await getAdminMachines();
    return res.render('admin/machine-list.njk', {
        title: 'Machines',
        machines
    });
};
export const renderMachineProducts = async (req, res) => {
    const products = await getAdminMachineProducts(req.params.machineId);
    return res.render('admin/product-list.njk', {
        title: 'Machine Products',
        machineId: req.params.machineId,
        products
    });
};
export const renderProductDetails = async (req, res) => {
    const product = await getAdminProduct(req.params.productId);
    return res.render('admin/product-details.njk', {
        title: 'Product Details',
        product
    });
};
export const renderAllProducts = async (_req, res) => {
    const products = await getAdminProducts();
    return res.render('admin/all-product-list.njk', {
        title: 'Latest Products',
        products
    });
};
export const renderOrders = async (_req, res) => {
    const orders = await getAdminOrders();
    return res.render('admin/order-list.njk', {
        title: 'Orders',
        orders
    });
};
export const renderOrderDetails = async (req, res) => {
    const { order, items } = await getAdminOrder(req.params.orderId);
    return res.render('admin/order-details.njk', {
        title: 'Order Details',
        order,
        items
    });
};
export const renderFeedback = async (_req, res) => {
    const feedback = await getAdminFeedback();
    return res.render('admin/feedback.njk', {
        title: 'Feedback',
        feedback
    });
};
export const renderChangePassword = async (_req, res) => res.render('admin/change-password.njk', { title: 'Change Password' });
export const handleChangePassword = async (req, res) => {
    try {
        await changeAdminPassword(req.session.admin.id, req.body.currentPassword, req.body.newPassword);
        res.flash('success', 'Password updated successfully');
    }
    catch (error) {
        res.flash('error', error.message);
    }
    return res.redirect('/admin/change-password');
};
