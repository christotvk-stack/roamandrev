const { createModel } = require('./modelWrapper');

const categorySchema = {
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
  itemCount: { type: Number, default: 0 }
};

const Category = createModel('Category', categorySchema, 'categories');

module.exports = Category;
