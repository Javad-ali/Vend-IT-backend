import { apiError } from '../../utils/response.js';
import { getDashboardMetrics, listUsers, removeUser, setUserStatus, getUserProfile, getUserPayments, listMachines, listMachineProducts, getProduct, listProducts, listOrders, getOrder, listOrderProducts, listFeedback } from './admin.repository.js';
const formatUser = (user) => ({
    id: user.id,
    name: [user.first_name, user.last_name].filter(Boolean).join(' '),
    email: user.email,
    phone: user.phone_number,
    country: user.country,
    dob: user.dob,
    avatar: user.user_profile,
    isOtpVerified: Boolean(user.is_otp_verify),
    status: user.status,
    createdAt: user.created_at
});
const unwrapSingle = (value) => {
    if (Array.isArray(value)) {
        return value[0];
    }
    return value ?? undefined;
};
export const getAdminDashboard = async () => getDashboardMetrics();
export const getAdminUsers = async () => {
    const users = await listUsers();
    return users.map(formatUser);
};
export const deleteAdminUser = async (userId) => {
    await removeUser(userId);
};
export const toggleUserStatus = async (userId, status) => {
    await setUserStatus(userId, status);
};
export const getAdminUserDetails = async (userId) => {
    const profile = await getUserProfile(userId);
    if (!profile)
        throw new apiError(404, 'User not found');
    const purchases = await getUserPayments(userId);
    const wallet = unwrapSingle(profile?.wallet);
    const loyalty = unwrapSingle(profile?.loyalty);
    const walletBalance = Number(wallet?.balance ?? 0);
    const loyaltyPoints = Number(loyalty?.points ?? 0);
    return {
        user: {
            ...formatUser(profile),
            wallet: walletBalance,
            loyalty: loyaltyPoints
        },
        history: purchases
    };
};
export const getAdminMachines = async () => listMachines();
export const getAdminMachineProducts = async (machineUId) => {
    const slots = await listMachineProducts(machineUId);
    return slots.map(slot => ({
        slot: slot.slot_number,
        quantity: slot.quantity,
        maxQuantity: slot.max_quantity,
        product: (() => {
            const product = unwrapSingle(slot?.product);
            if (!product)
                return null;
            const rawCategory = unwrapSingle(product.category);
            return {
                id: product.product_u_id,
                description: product.description,
                image: product.product_image_url,
                brand: product.brand_name,
                category: rawCategory?.category_name ?? 'Uncategorised'
            };
        })()
    }));
};
export const getAdminProduct = async (productId) => {
    const product = await getProduct(productId);
    if (!product)
        throw new apiError(404, 'Product not found');
    return product;
};
export const getAdminProducts = async () => listProducts();
export const getAdminOrders = async () => listOrders();
export const getAdminOrder = async (orderId) => {
    const order = await getOrder(orderId);
    if (!order)
        throw new apiError(404, 'Order not found');
    const items = await listOrderProducts(orderId);
    return { order, items };
};
export const getAdminFeedback = async () => listFeedback();
