import 'express-session';
export const requireAdmin = (req, res, next) => {
    if (req.session?.admin)
        return next();
    return res.redirect('/admin/login');
};
export const attachAdmin = (_req, res, next) => {
    res.locals.admin = _req.session?.admin ?? null;
    next();
};
