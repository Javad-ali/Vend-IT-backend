import express from 'express';
const ASYNC_WRAPPED = Symbol('asyncWrappedHandler');
const patchHandler = (handler) => {
  if (typeof handler !== 'function') return handler;
  const fn = handler;
  if (fn.length >= 4 || fn[ASYNC_WRAPPED]) {
    return handler;
  }
  const wrapped = function (req, res, next) {
    try {
      const maybePromise = fn(req, res, next);
      if (maybePromise && typeof maybePromise.catch === 'function') {
        maybePromise.catch(next);
      }
      return maybePromise;
    } catch (error) {
      return next(error);
    }
  };
  wrapped[ASYNC_WRAPPED] = true;
  return wrapped;
};
const routerProto = express.Router().constructor.prototype;
['use', 'get', 'post', 'put', 'patch', 'delete', 'all', 'head', 'options'].forEach((method) => {
  const original = routerProto[method];
  if (typeof original !== 'function') return;
  routerProto[method] = function (...args) {
    const patchedArgs = args.map((arg) => patchHandler(arg));
    return original.apply(this, patchedArgs);
  };
});
