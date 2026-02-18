import express from 'express';
const router = express.Router();
import { 
  createProduct, 
  getProducts, 
  getFoundFeed, 
  getProductById, 
  markProductAsSold ,
  reportProduct
} from '../controllers/productController.js';
import { protect } from '../middleware/authMiddleware.js';

// --- PUBLIC ROUTES ---
// These are for everyone to browse the "Midnight" marketplace
router.get('/', getProducts);
router.get('/found-feed', getFoundFeed);
router.get('/:id', getProductById);

// --- PRIVATE ROUTES ---
// Only verified NITJ students can post or mark items as sold
router.post('/', protect, createProduct);
router.patch('/:id/sold', protect, markProductAsSold);
router.post('/:id/report', protect, reportProduct); 
export default router;