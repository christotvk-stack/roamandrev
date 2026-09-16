const { createModel } = require('./modelWrapper');

const userSchema = {
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
  phone: { type: String, default: '' },
  addresses: [
    {
      fullName: String,
      street: String,
      city: String,
      state: String,
      postalCode: String,
      phone: String,
      landmark: String,
      isDefault: { type: Boolean, default: false }
    }
  ]
};

const User = createModel('User', userSchema, 'users');

module.exports = User;
