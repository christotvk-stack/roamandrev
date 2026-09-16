const mongoose = require('mongoose');
const { getStore, isMongo } = require('../config/db');

function generateId() {
  return new mongoose.Types.ObjectId().toString();
}

function matchesFilter(item, filter) {
  if (!filter || Object.keys(filter).length === 0) return true;
  for (const key of Object.keys(filter)) {
    const val = filter[key];
    if (key === '_id' || key === 'id') {
      if (item._id !== val && item.id !== val) return false;
    } else if (key === '$or') {
      const matchAny = val.some(subFilter => matchesFilter(item, subFilter));
      if (!matchAny) return false;
    } else if (val && typeof val === 'object' && val.$regex) {
      const regex = new RegExp(val.$regex, val.$options || 'i');
      if (!regex.test(String(item[key] || ''))) return false;
    } else if (val && typeof val === 'object' && (val.$gte !== undefined || val.$lte !== undefined)) {
      const itemVal = Number(item[key]);
      if (val.$gte !== undefined && itemVal < Number(val.$gte)) return false;
      if (val.$lte !== undefined && itemVal > Number(val.$lte)) return false;
    } else if (val && typeof val === 'object' && val.$in) {
      const itemVal = item[key];
      if (Array.isArray(itemVal)) {
        const hasOverlap = itemVal.some(v => val.$in.includes(v));
        if (!hasOverlap) return false;
      } else {
        if (!val.$in.includes(itemVal)) return false;
      }
    } else if (Array.isArray(item[key])) {
      if (!item[key].includes(val)) return false;
    } else if (item[key] !== val) {
      return false;
    }
  }
  return true;
}

class LocalQuery {
  constructor(collectionKey, filter = {}) {
    this.collectionKey = collectionKey;
    this.filter = filter;
    this._sort = null;
    this._skip = 0;
    this._limit = null;
    this._select = null;
  }

  sort(sortObj) {
    this._sort = sortObj;
    return this;
  }

  skip(n) {
    this._skip = Number(n) || 0;
    return this;
  }

  limit(n) {
    this._limit = Number(n) || null;
    return this;
  }

  select(fields) {
    this._select = fields;
    return this;
  }

  async exec() {
    const store = getStore();
    const items = store.data[this.collectionKey] || [];
    let results = items.filter(item => matchesFilter(item, this.filter));

    if (this._sort) {
      const sortKeys = Object.keys(this._sort);
      results.sort((a, b) => {
        for (const k of sortKeys) {
          const dir = this._sort[k] === -1 || this._sort[k] === 'desc' ? -1 : 1;
          if (a[k] < b[k]) return -1 * dir;
          if (a[k] > b[k]) return 1 * dir;
        }
        return 0;
      });
    }

    if (this._skip) {
      results = results.slice(this._skip);
    }
    if (this._limit !== null) {
      results = results.slice(0, this._limit);
    }

    return JSON.parse(JSON.stringify(results));
  }

  then(resolve, reject) {
    return this.exec().then(resolve, reject);
  }
}

function createModel(modelName, schemaDef, collectionKey) {
  let mongooseModel;
  try {
    mongooseModel = mongoose.model(modelName, new mongoose.Schema(schemaDef, { timestamps: true }));
  } catch (err) {
    mongooseModel = mongoose.model(modelName);
  }

  return {
    mongooseModel,
    collectionKey,

    find(filter = {}) {
      if (isMongo()) {
        return mongooseModel.find(filter);
      }
      return new LocalQuery(collectionKey, filter);
    },

    findOne(filter = {}) {
      if (isMongo()) {
        return mongooseModel.findOne(filter);
      }
      const store = getStore();
      const items = store.data[collectionKey] || [];
      const found = items.find(item => matchesFilter(item, filter));
      return {
        async exec() {
          return found ? JSON.parse(JSON.stringify(found)) : null;
        },
        then(resolve, reject) {
          return this.exec().then(resolve, reject);
        }
      };
    },

    findById(id) {
      if (isMongo()) {
        return mongooseModel.findById(id);
      }
      return this.findOne({ _id: String(id) });
    },

    async countDocuments(filter = {}) {
      if (isMongo()) {
        return await mongooseModel.countDocuments(filter);
      }
      const store = getStore();
      const items = store.data[collectionKey] || [];
      return items.filter(item => matchesFilter(item, filter)).length;
    },

    async create(docData) {
      if (isMongo()) {
        return await mongooseModel.create(docData);
      }
      const store = getStore();
      const newDoc = {
        _id: docData._id || generateId(),
        ...docData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      if (!store.data[collectionKey]) {
        store.data[collectionKey] = [];
      }
      store.data[collectionKey].push(newDoc);
      store.save();
      return JSON.parse(JSON.stringify(newDoc));
    },

    async findByIdAndUpdate(id, updateData, options = {}) {
      if (isMongo()) {
        return await mongooseModel.findByIdAndUpdate(id, updateData, { new: true, ...options });
      }
      const store = getStore();
      const items = store.data[collectionKey] || [];
      const idx = items.findIndex(item => item._id === String(id) || item.id === String(id));
      if (idx === -1) return null;

      const current = items[idx];
      const updated = {
        ...current,
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      items[idx] = updated;
      store.save();
      return JSON.parse(JSON.stringify(updated));
    },

    async findByIdAndDelete(id) {
      if (isMongo()) {
        return await mongooseModel.findByIdAndDelete(id);
      }
      const store = getStore();
      const items = store.data[collectionKey] || [];
      const idx = items.findIndex(item => item._id === String(id) || item.id === String(id));
      if (idx === -1) return null;
      const removed = items.splice(idx, 1)[0];
      store.save();
      return JSON.parse(JSON.stringify(removed));
    },

    async deleteOne(filter) {
      if (isMongo()) {
        return await mongooseModel.deleteOne(filter);
      }
      const store = getStore();
      const items = store.data[collectionKey] || [];
      const idx = items.findIndex(item => matchesFilter(item, filter));
      if (idx !== -1) {
        items.splice(idx, 1);
        store.save();
        return { deletedCount: 1 };
      }
      return { deletedCount: 0 };
    }
  };
}

module.exports = {
  createModel,
  generateId
};
