const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const { connectDB } = require('./config/db');
const { seedDatabase } = require('./config/seedData');
const Product = require('./models/Product');

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const couponRoutes = require('./routes/couponRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Body Parsers & CORS
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static assets
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/admin', adminRoutes);

// Search convenience alias
app.get('/api/search', (req, res) => {
  res.redirect(`/api/products?search=${encodeURIComponent(req.query.q || '')}`);
});

// Clean friendly page routes fallback
app.get('/shop', (req, res) => res.sendFile(path.join(frontendPath, 'shop.html')));
app.get('/product', (req, res) => res.sendFile(path.join(frontendPath, 'product.html')));
app.get('/cart', (req, res) => res.sendFile(path.join(frontendPath, 'cart.html')));
app.get('/checkout', (req, res) => res.sendFile(path.join(frontendPath, 'checkout.html')));
app.get('/wishlist', (req, res) => res.sendFile(path.join(frontendPath, 'wishlist.html')));
app.get('/login', (req, res) => res.sendFile(path.join(frontendPath, 'login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(frontendPath, 'register.html')));
app.get('/profile', (req, res) => res.sendFile(path.join(frontendPath, 'profile.html')));
app.get('/orders', (req, res) => res.sendFile(path.join(frontendPath, 'orders.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(frontendPath, 'admin.html')));

// Error Handlers
app.use(notFound);
app.use(errorHandler);

async function startServer() {
  await connectDB();

  // Auto-seed if products collection is empty
  const productCount = await Product.countDocuments();
  if (productCount === 0) {
    console.log('[Server] Database is unpopulated. Running automated seed routine...');
    await seedDatabase();
  } else {
    console.log(`[Server] Database ready with ${productCount} active products.`);
  }

  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(` ROAM & REV MOTO & TRAVEL STORE SERVER ACTIVE`);
    console.log(` -> Storefront URL : http://localhost:${PORT}`);
    console.log(` -> Admin Dashboard: http://localhost:${PORT}/admin.html`);
    console.log(` -> API Base Endpoint: http://localhost:${PORT}/api/products`);
    console.log(`====================================================`);
  });
}

startServer();
