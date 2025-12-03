import { Router } from 'express';
import { handleLogin, handleLogout, renderLogin } from '../modules/admin/admin-auth.controller.js';
const router = Router();
router.get('/login', renderLogin);
router.post('/login', handleLogin);
router.post('/logout', handleLogout);
export default router;
