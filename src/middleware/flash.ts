import 'express-session';
export const flash = (req, res, next) => {
  res.locals.flash = req.session.flash ?? null;
  if (req.session.flash) delete req.session.flash;
  res.flash = (type, message) => {
    req.session.flash = { type, message };
  };
  next();
};
