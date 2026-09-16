const Category = require('../models/Category');
const Product = require('../models/Product');

async function getCategories(req, res) {
  try {
    const categories = await Category.find({}).exec();
    const products = await Product.find({}).exec();

    // Dynamically calculate current item count per category
    const categoriesWithCount = categories.map(cat => {
      const count = products.filter(p => p.category === cat.slug).length;
      return {
        ...cat,
        itemCount: count
      };
    });

    return res.json({
      success: true,
      categories: categoriesWithCount
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  getCategories
};
