import { authenticateAdmin } from './admin-auth.service.js';
export const renderLogin = (req, res) => {
    if (req.session.admin)
        return res.redirect('/admin');
    return res.render('admin/login.njk', { title: 'Admin Login' });
};
export const handleLogin = async (req, res) => {
    try {
        const admin = await authenticateAdmin(req.body.email, req.body.password);
        req.session.admin = admin;
        res.flash('success', 'Welcome back!');
        return res.redirect('/admin');
    }
    catch (error) {
        res.flash('error', error.message);
        return res.redirect('/admin/login');
    }
};
export const handleLogout = (req, res) => {
    req.session.destroy(() => res.redirect('/admin/login'));
};
