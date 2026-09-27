import Product from '../models/Product.js';

// @desc Get all APPROVED products (public storefront) with optional search/category
// @route GET /api/products
export const getProducts = async (req, res) => {
  const { search, category } = req.query;

  const filter = { isApproved: true };
  if (search) filter.name = { $regex: search, $options: 'i' };
  if (category && category !== 'All') filter.category = category;

  const products = await Product.find(filter)
    .populate('seller', 'name shopName')
    .sort({ createdAt: -1 });

  res.json({ products, total: products.length });
};

// @desc Get single product by id (public, must be approved unless owner/admin)
// @route GET /api/products/:id
export const getProductById = async (req, res) => {
  const product = await Product.findById(req.params.id).populate('seller', 'name shopName');
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json(product);
};

// @desc Get distinct categories (for filter UI)
// @route GET /api/products/categories
export const getCategories = async (req, res) => {
  const categories = await Product.distinct('category', { isApproved: true });
  res.json(categories);
};

// ---------- SELLER ----------

// @desc Create a new product (goes in as pending approval)
// @route POST /api/products
export const createProduct = async (req, res) => {
  const { name, image, description, category, price, countInStock, lowStockThreshold } = req.body;

  const product = await Product.create({
    seller: req.user._id,
    name,
    image,
    description,
    category,
    price,
    countInStock,
    lowStockThreshold: lowStockThreshold ?? 5,
    isApproved: false
  });

  res.status(201).json(product);
};

// @desc Update own product (resets to pending approval again on edit)
// @route PUT /api/products/:id
export const updateProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });

  const isOwner = product.seller.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized to edit this product' });
  }

  const { name, image, description, category, price, countInStock, lowStockThreshold } = req.body;
  product.name = name ?? product.name;
  product.image = image ?? product.image;
  product.description = description ?? product.description;
  product.category = category ?? product.category;
  product.price = price ?? product.price;
  product.countInStock = countInStock ?? product.countInStock;
  product.lowStockThreshold = lowStockThreshold ?? product.lowStockThreshold;

  // Re-editing a product sends it back for re-approval (unless admin is editing)
  if (req.user.role !== 'admin') {
    product.isApproved = false;
  }

  const updated = await product.save();
  res.json(updated);
};

// @desc Delete own product
// @route DELETE /api/products/:id
export const deleteProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });

  const isOwner = product.seller.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized to delete this product' });
  }

  await product.deleteOne();
  res.json({ message: 'Product removed' });
};

// @desc Get all of the logged-in seller's own products (any approval status)
// @route GET /api/products/seller/mine
export const getMyProducts = async (req, res) => {
  const products = await Product.find({ seller: req.user._id }).sort({ createdAt: -1 });
  res.json(products);
};

// ---------- ADMIN ----------

// @desc Get all products pending approval
// @route GET /api/products/admin/pending
export const getPendingProducts = async (req, res) => {
  const products = await Product.find({ isApproved: false }).populate('seller', 'name shopName email');
  res.json(products);
};

// @desc Approve a product
// @route PUT /api/products/admin/approve/:id
export const approveProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  product.isApproved = true;
  product.rejectionReason = '';
  await product.save();
  res.json({ message: 'Product approved', product });
};

// @desc Reject a product (deletes it, with an optional reason logged to console/response)
// @route DELETE /api/products/admin/reject/:id
export const rejectProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  await product.deleteOne();
  res.json({ message: 'Product rejected and removed' });
};

// @desc Get every product in the system (admin overview, any status)
// @route GET /api/products/admin/all
export const getAllProductsAdmin = async (req, res) => {
  const products = await Product.find({}).populate('seller', 'name shopName email');
  res.json(products);
};
