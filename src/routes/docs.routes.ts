import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { openapiSpec } from '../openapi.js';
const router = Router();
router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(openapiSpec));
router.get('/json', (_req, res) => res.json(openapiSpec));
export default router;
