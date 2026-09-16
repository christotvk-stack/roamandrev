const { createModel } = require('./modelWrapper');

const productSchema = {
  name: { type: String, required: true },
  slug: { type: String, required: true },
  category: { type: String, required: true },
  bikeCompatibility: [{ type: String }],
  brand: { type: String, default: 'ROAM & REV' },
  price: { type: Number, required: true },
  originalPrice: { type: Number, required: true },
  discountPercent: { type: Number, default: 0 },
  rating: { type: Number, default: 4.8 },
  reviewCount: { type: Number, default: 0 },
  stock: { type: Number, default: 15 },
  isFeatured: { type: Boolean, default: false },
  isNewArrival: { type: Boolean, default: false },
  images: [{ type: String }],
  description: { type: String, required: true },
  features: [{ type: String }],
  specifications: {
    material: { type: String, default: 'High Grade' },
    dimensions: { type: String, default: 'Standard' },
    weight: { type: String, default: 'N/A' },
    capacity: { type: String, default: 'N/A' },
    compatibility: { type: String, default: 'Universal' },
    warranty: { type: String, default: '1 Year Manufacturer Warranty' },
    packageContents: { type: String, default: '1 x Unit, Mounting Hardware, User Manual' }
  },
  tags: [{ type: String }]
};

const Product = createModel('Product', productSchema, 'products');

module.exports = Product;
