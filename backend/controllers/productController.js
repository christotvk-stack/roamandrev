const Product = require('../models/Product');
const Review = require('../models/Review');

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

async function getProducts(req, res) {
  try {
    const {
      search,
      q,
      category,
      bike,
      minPrice,
      maxPrice,
      rating,
      inStock,
      featured,
      newArrival,
      sort,
      page = 1,
      limit = 20
    } = req.query;

    const searchTerm = (search || q || '').trim();
    let allProducts = await Product.find({}).exec();

    // In-memory filter processing for maximum flexibility across Mongo and local store
    let filtered = allProducts.filter(item => {
      // Search query filter
      if (searchTerm) {
        const queryLower = searchTerm.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(queryLower);
        const matchesDesc = (item.description || '').toLowerCase().includes(queryLower);
        const matchesBrand = (item.brand || '').toLowerCase().includes(queryLower);
        const matchesCategory = (item.category || '').toLowerCase().includes(queryLower);
        const matchesTags = (item.tags || []).some(t => t.toLowerCase().includes(queryLower));
        const matchesBike = (item.bikeCompatibility || []).some(b => b.toLowerCase().includes(queryLower.replace(/\s/g, '')));

        if (!matchesName && !matchesDesc && !matchesBrand && !matchesCategory && !matchesTags && !matchesBike) {
          return false;
        }
      }

      // Category filter
      if (category && category !== 'all') {
        if (item.category !== category) return false;
      }

      // Bike compatibility filter
      if (bike && bike !== 'all') {
        const bikeClean = bike.toUpperCase().replace(/\s/g, '');
        const itemBikes = (item.bikeCompatibility || []).map(b => b.toUpperCase().replace(/\s/g, ''));
        const isMatch = itemBikes.includes(bikeClean) || itemBikes.includes('UNIVERSAL');
        if (!isMatch) return false;
      }

      // Price range filter
      if (minPrice && item.price < Number(minPrice)) return false;
      if (maxPrice && item.price > Number(maxPrice)) return false;

      // Rating filter
      if (rating && (item.rating || 0) < Number(rating)) return false;

      // Stock filter
      if (inStock === 'true' && (item.stock || 0) <= 0) return false;

      // Featured filter
      if (featured === 'true' && !item.isFeatured) return false;

      // New arrivals filter
      if (newArrival === 'true' && !item.isNewArrival) return false;

      return true;
    });

    // Sorting
    switch (sort) {
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        break;
      case 'discount':
        filtered.sort((a, b) => (b.discountPercent || 0) - (a.discountPercent || 0));
        break;
      default: // recommended / featured
        filtered.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
        break;
    }

    const total = filtered.length;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const startIndex = (pageNum - 1) * limitNum;
    const paginated = filtered.slice(startIndex, startIndex + limitNum);

    return res.json({
      success: true,
      count: paginated.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      products: paginated
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function getProductById(req, res) {
  try {
    const { id } = req.params;
    let product = await Product.findById(id);

    // If not found by ID, attempt lookup by slug
    if (!product) {
      product = await Product.findOne({ slug: id });
    }

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // Fetch reviews for this product
    const reviews = await Review.find({ productId: product._id }).exec();

    // Fetch related products (same category, different ID)
    const allCategoryProducts = await Product.find({ category: product.category }).exec();
    const related = allCategoryProducts
      .filter(p => p._id !== product._id)
      .slice(0, 4);

    return res.json({
      success: true,
      product,
      reviews,
      related
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function createProduct(req, res) {
  try {
    const {
      name,
      category,
      bikeCompatibility,
      brand,
      price,
      originalPrice,
      stock,
      images,
      description,
      features,
      specifications,
      isFeatured,
      isNewArrival,
      tags
    } = req.body;

    if (!name || !category || !price || !originalPrice || !description) {
      return res.status(400).json({
        success: false,
        message: 'Name, category, price, original price, and description are required.'
      });
    }

    const slug = slugify(name);
    const discountPercent = originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : 0;

    const newProduct = await Product.create({
      name: name.trim(),
      slug: `${slug}-${Date.now().toString().slice(-4)}`,
      category,
      bikeCompatibility: Array.isArray(bikeCompatibility) ? bikeCompatibility : ['Universal'],
      brand: brand || 'ROAM & REV',
      price: Number(price),
      originalPrice: Number(originalPrice),
      discountPercent,
      stock: Number(stock) || 10,
      images: Array.isArray(images) && images.length > 0 ? images : [
        'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=900&q=80'
      ],
      description,
      features: Array.isArray(features) ? features : [],
      specifications: specifications || {
        material: 'High-Density Polymer & Aluminum',
        dimensions: 'Standard fit',
        weight: '450 grams',
        capacity: 'N/A',
        compatibility: Array.isArray(bikeCompatibility) ? bikeCompatibility.join(', ') : 'Universal',
        warranty: '1 Year Warranty',
        packageContents: '1 x Unit, Hardware kit'
      },
      isFeatured: !!isFeatured,
      isNewArrival: !!isNewArrival,
      tags: Array.isArray(tags) ? tags : [name.toLowerCase(), category]
    });

    return res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      product: newProduct
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const existing = await Product.findById(id);

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found to update.' });
    }

    const updateData = { ...req.body };
    if (updateData.price && updateData.originalPrice) {
      updateData.discountPercent = Math.round(
        ((updateData.originalPrice - updateData.price) / updateData.originalPrice) * 100
      );
    }

    const updated = await Product.findByIdAndUpdate(id, updateData);
    return res.json({
      success: true,
      message: 'Product updated successfully.',
      product: updated
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function deleteProduct(req, res) {
  try {
    const { id } = req.params;
    const deleted = await Product.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    return res.json({
      success: true,
      message: 'Product deleted successfully.'
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
