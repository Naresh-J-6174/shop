import React, { useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';
import { mergeSort, sortComparators } from '../utils/mergeSort';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'priceLowToHigh', label: 'Price: Low to High' },
  { value: 'priceHighToLow', label: 'Price: High to Low' },
  { value: 'ratingHighToLow', label: 'Rating: High to Low' },
  { value: 'nameAZ', label: 'Name: A to Z' }
];

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/products', {
        params: { search, category: activeCategory }
      });
      setProducts(data.products);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    api.get('/products/categories').then(({ data }) => setCategories(data));
  }, []);

  useEffect(() => {
    const timeout = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, activeCategory]);

  // Price range filter + merge sort are applied client-side on top of what
  // the server already returned (search + category), so switching sort/price
  // doesn't need another network round trip.
  const visibleProducts = useMemo(() => {
    let filtered = products;

    const min = minPrice !== '' ? Number(minPrice) : null;
    const max = maxPrice !== '' ? Number(maxPrice) : null;
    if (min !== null) filtered = filtered.filter((p) => p.price >= min);
    if (max !== null) filtered = filtered.filter((p) => p.price <= max);

    return mergeSort(filtered, sortComparators[sortBy]);
  }, [products, sortBy, minPrice, maxPrice]);

  return (
    <div>
      {/* Hero */}
      <div className="bg-gradient-to-r from-brand-700 via-brand-600 to-indigo-500 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-3">
            Shop from Independent Sellers
          </h1>
          <p className="text-brand-100 max-w-xl mx-auto">
            Every product here is listed by a verified seller and approved by our team.
          </p>
          <div className="mt-8 max-w-lg mx-auto">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full px-5 py-3 rounded-full text-gray-800 focus:outline-none focus:ring-4 focus:ring-brand-300"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Category chips */}
        <div className="flex flex-wrap gap-2 mb-6">
          {['All', ...categories].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                activeCategory === cat
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-brand-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sort + price range filter bar */}
        <div className="flex flex-wrap items-center gap-4 mb-8 bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500 font-medium">Sort by</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500 font-medium">Price</label>
            <input
              type="number"
              min="0"
              placeholder="Min"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-24 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
            <span className="text-gray-400">–</span>
            <input
              type="number"
              min="0"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-24 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
            {(minPrice || maxPrice) && (
              <button
                onClick={() => {
                  setMinPrice('');
                  setMaxPrice('');
                }}
                className="text-xs text-brand-600 font-medium hover:underline"
              >
                Clear
              </button>
            )}
          </div>

          <span className="ml-auto text-sm text-gray-400">
            {visibleProducts.length} product{visibleProducts.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <p className="text-center text-gray-400 py-20">Loading products...</p>
        ) : visibleProducts.length === 0 ? (
          <p className="text-center text-gray-400 py-20">No products found.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {visibleProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
