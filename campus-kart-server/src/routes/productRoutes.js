import express from 'express';
const router = express.Router();

import { 
  createProduct, 
  getFoundFeed, 
  getProducts, 
  getMyProducts, // ADDED THIS
  getProductById, 
  markProductAsSold, 
  reportProduct,
  deleteProduct
} from '../controllers/productController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

// Public Routes
router.get('/', getProducts);
router.get('/found-feed', getFoundFeed);

// Protected Route for Dashboard (MUST be above /:id to avoid "me" being read as an ID)
router.get('/me', protect, getMyProducts);

// Route for specific product
router.get('/:id', getProductById);

// Protected Action Routes
router.post('/', protect, upload.array('images', 5), createProduct); 
router.patch('/:id/sold', protect, markProductAsSold);
router.post('/:id/report', protect, reportProduct);
router.delete('/:id', protect, deleteProduct);

export default router;