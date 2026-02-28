import express from 'express';
const router = express.Router();

import { 
  createProduct, 
  getFoundFeed, 
  getProducts, 
  getProductById, 
  markProductAsSold, 
  reportProduct 
} from '../controllers/productController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js'; // 1. IMPORT MULTER

// Public Routes
router.get('/', getProducts);
router.get('/found-feed', getFoundFeed);
router.get('/:id', getProductById);

// Protected Routes
// 2. INJECT MULTER: 'images' matches the frontend input name, max 5 files
router.post('/', protect, upload.array('images', 5), createProduct); 

router.patch('/:id/sold', protect, markProductAsSold);
router.post('/:id/report', protect, reportProduct);

export default router;