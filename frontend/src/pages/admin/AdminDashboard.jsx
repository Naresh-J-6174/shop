import React, { useEffect, useState } from 'react';
import api from '../../api/axios';

const TABS = ['Pending Sellers', 'Pending Products', 'All Products', 'All Users'];

const AdminDashboard = () => {
  const [tab, setTab] = useState(TABS[0]);
  const [pendingSellers, setPendingSellers] = useState([]);
  const [pendingProducts, setPendingProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    setLoading(true);
    const [s, p, ap, u] = await Promise.all([
      api.get('/users/admin/pending-sellers'),
      api.get('/products/admin/pending'),
      api.get('/products/admin/all'),
      api.get('/users/admin/all')
    ]);
    setPendingSellers(s.data);
    setPendingProducts(p.data);
    setAllProducts(ap.data);
    setAllUsers(u.data);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const approveSeller = async (id) => {
    await api.put(`/users/admin/approve-seller/${id}`);
    loadAll();
  };
  const rejectSeller = async (id) => {
    if (!window.confirm('Reject and remove this seller account?')) return;
    await api.delete(`/users/admin/reject-seller/${id}`);
    loadAll();
  };
  const approveProduct = async (id) => {
    await api.put(`/products/admin/approve/${id}`);
    loadAll();
  };
  const rejectProduct = async (id) => {
    if (!window.confirm('Reject and remove this product?')) return;
    await api.delete(`/products/admin/reject/${id}`);
    loadAll();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Panel</h1>

      <div className="flex gap-2 mb-8 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === t ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            {t}
            {t === 'Pending Sellers' && pendingSellers.length > 0 && (
              <span className="ml-2 bg-amber-400 text-gray-900 text-xs rounded-full px-2">
                {pendingSellers.length}
              </span>
            )}
            {t === 'Pending Products' && pendingProducts.length > 0 && (
              <span className="ml-2 bg-amber-400 text-gray-900 text-xs rounded-full px-2">
                {pendingProducts.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : (
        <>
          {tab === 'Pending Sellers' && (
            <div className="bg-white rounded-2xl shadow-sm divide-y">
              {pendingSellers.length === 0 && (
                <p className="p-6 text-gray-400">No sellers waiting for approval.</p>
              )}
              {pendingSellers.map((s) => (
                <div key={s._id} className="p-5 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">{s.shopName || s.name}</p>
                    <p className="text-sm text-gray-500">
                      {s.name} · {s.email}
                    </p>
                  </div>
                  <div className="space-x-3">
                    <button
                      onClick={() => approveSeller(s._id)}
                      className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => rejectSeller(s._id)}
                      className="bg-red-50 text-red-600 text-sm font-medium px-4 py-2 rounded-lg hover:bg-red-100"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'Pending Products' && (
            <div className="bg-white rounded-2xl shadow-sm divide-y">
              {pendingProducts.length === 0 && (
                <p className="p-6 text-gray-400">No products waiting for approval.</p>
              )}
              {pendingProducts.map((p) => (
                <div key={p._id} className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img src={p.image} alt={p.name} className="w-12 h-12 object-contain" />
                    <div>
                      <p className="font-semibold text-gray-800">{p.name}</p>
                      <p className="text-sm text-gray-500">
                        ₹{p.price} · by {p.seller?.shopName || p.seller?.name}
                      </p>
                    </div>
                  </div>
                  <div className="space-x-3">
                    <button
                      onClick={() => approveProduct(p._id)}
                      className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => rejectProduct(p._id)}
                      className="bg-red-50 text-red-600 text-sm font-medium px-4 py-2 rounded-lg hover:bg-red-100"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'All Products' && (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-left">
                  <tr>
                    <th className="p-4">Product</th>
                    <th className="p-4">Seller</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {allProducts.map((p) => (
                    <tr key={p._id}>
                      <td className="p-4">{p.name}</td>
                      <td className="p-4">{p.seller?.shopName || p.seller?.name}</td>
                      <td className="p-4">₹{p.price}</td>
                      <td className="p-4">
                        <span
                          className={`text-xs font-semibold px-3 py-1 rounded-full ${
                            p.isApproved
                              ? 'bg-green-100 text-green-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {p.isApproved ? 'Approved' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'All Users' && (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-left">
                  <tr>
                    <th className="p-4">Name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {allUsers.map((u) => (
                    <tr key={u._id}>
                      <td className="p-4">{u.name}</td>
                      <td className="p-4">{u.email}</td>
                      <td className="p-4 capitalize">{u.role}</td>
                      <td className="p-4">
                        {u.role === 'seller' ? (
                          <span
                            className={`text-xs font-semibold px-3 py-1 rounded-full ${
                              u.isApproved
                                ? 'bg-green-100 text-green-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {u.isApproved ? 'Approved' : 'Pending'}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
