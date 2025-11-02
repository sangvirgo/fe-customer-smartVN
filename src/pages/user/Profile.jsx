import { useState, useEffect } from "react";
import { User, MapPin, Package, Edit2, Plus, Trash2, Loader2, X, Check, ChevronLeft, ChevronRight, Search } from "lucide-react";
import userService from "../../services/userService";
import orderService from "../../services/orderService";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import toast from 'react-hot-toast';

// Edit/Add Address Modal Component
function AddressModal({ isOpen, onClose, onSuccess= null }) {
  const [addressData, setAddressData] = useState({
    fullName: "",
    phoneNumber: "",
    province: "",
    ward: "",
    street: "",
    note: "",
  });
  const [isSaving, setIsSaving] = useState(false);



  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAddressData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    
    if (!addressData.fullName || !addressData.phoneNumber || !addressData.province || !addressData.ward || !addressData.street) {
      toast.error("Please fill in all required fields.");
      return;
    }
    
    setIsSaving(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          {'Add New Address'}
        </h2>
        <form onSubmit={handleSaveAddress} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input 
                type="text" 
                name="fullName" 
                value={addressData.fullName} 
                onChange={handleInputChange} 
                required 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
              <input 
                type="tel" 
                name="phoneNumber" 
                value={addressData.phoneNumber} 
                onChange={handleInputChange} 
                required 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Province/City *</label>
            <input 
              type="text" 
              name="province" 
              value={addressData.province} 
              onChange={handleInputChange} 
              required 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">District/Ward *</label>
              <input 
                type="text" 
                name="ward" 
                value={addressData.ward} 
                onChange={handleInputChange} 
                required 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
              <input 
                type="text" 
                name="street" 
                value={addressData.street} 
                onChange={handleInputChange} 
                required 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note (Optional)</label>
            <textarea 
              name="note" 
              value={addressData.note} 
              onChange={handleInputChange} 
              rows={2} 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSaving} 
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />} 
              {'Save'} Address
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Main Profile Component
export default function Profile() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "profile");
  const [user, setUser] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
  });
  const [orderFilter, setOrderFilter] = useState("ALL");
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  
  // Pagination states
  const [orderPage, setOrderPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 5;

  // State cho Order Search
  const [searchOrderId, setSearchOrderId] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    setSearchParams({ tab: activeTab });

    if (activeTab === "profile" && !user) {
      fetchUserProfile();
    } else if (activeTab === "addresses") {
      fetchAddresses();
    } else if (activeTab === "orders") {
      setOrderPage(0);
      // Kiểm tra nếu đang search thì không fetch theo filter
      if (!isSearching) {
        fetchOrders(orderFilter === "ALL" ? null : orderFilter, 0);
      }
    }
  }, [activeTab]);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  useEffect(() => {
    // Chỉ fetch khi tab là 'orders' và *không* đang ở trạng thái searching
    if (activeTab === 'orders' && !isSearching) {
      fetchOrders(orderFilter === "ALL" ? null : orderFilter, orderPage);
    }
  }, [orderFilter, orderPage, activeTab, isSearching]); // Thêm isSearching vào dependency

  const fetchUserProfile = async () => {
    setIsLoading(true);
    try {
      const profileData = await userService.getProfile();
      setUser(profileData);
      setFormData({
        firstName: profileData.firstName || "",
        lastName: profileData.lastName || "",
        phoneNumber: profileData.mobile || "", // Sửa: Dùng profileData.mobile
      });
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      toast.error(error.message || "Failed to load profile");
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate('/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAddresses = async () => {
    setIsLoading(true);
    try {
      const addressesData = await userService.getAddresses();
      setAddresses(addressesData || []);
    } catch (error) {
      console.error("Failed to fetch addresses:", error);
      toast.error(error.message || "Failed to load addresses");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrders = async (status = null, page = 0) => {
    setLoadingOrders(true);
    try {
      const response = await orderService.getUserOrders({
        status: status,
        page: page,
        size: pageSize,
      });
      setOrders(response.orders || []);
      setTotalPages(response.totalPages || 0);
    } catch (error) {
      console.error(`Failed to fetch orders:`, error);
      if (error.response?.data?.code === 'EMPTY_ORDER') {
        setOrders([]);
        setTotalPages(0);
      } else {
        toast.error(error.message || `Failed to load orders`);
        setOrders([]);
      }
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await userService.updateProfile(
        formData.firstName, 
        formData.lastName, 
        formData.phoneNumber
      );
      toast.success(response.message || "Profile updated successfully!");
      setUser(response.data);
      setIsEditing(false);
      localStorage.setItem("user", JSON.stringify(response.data));
    } catch (error) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm("Are you sure you want to delete this address?")) return;
    
    try {
      await userService.deleteAddress(addressId);
      toast.success("Address deleted successfully");
      fetchAddresses();
    } catch (error) {
      toast.error(error.message || "Failed to delete address");
    }
  };


  const handleAddressModalClose = () => {
    setIsAddressModalOpen(false);
  };

  const handleAddressSuccess = () => {
    fetchAddresses();
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: "bg-yellow-100 text-yellow-800 border border-yellow-200",
      CONFIRMED: "bg-blue-100 text-blue-800 border border-blue-200",
      SHIPPED: "bg-purple-100 text-purple-800 border border-purple-200",
      DELIVERED: "bg-green-100 text-green-800 border border-green-200",
      CANCELLED: "bg-red-100 text-red-800 border border-red-200",
    };
    return colors[status] || "bg-gray-100 text-gray-800 border border-gray-200";
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'COMPLETED': return 'bg-green-100 text-green-800 border border-green-200';
      case 'FAILED': return 'bg-red-100 text-red-800 border border-red-200';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800 border border-gray-200';
      case 'REFUNDED': return 'bg-indigo-100 text-indigo-800 border border-indigo-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  // Hàm xử lý tìm kiếm đơn hàng
  const handleSearchOrder = async (e) => {
    e.preventDefault();
    if (!searchOrderId.trim()) return;
    
    setIsSearching(true);
    setLoadingOrders(true);
    
    try {
      const response = await orderService.searchOrderById(searchOrderId);
      setOrders(response.orders || []);
      setTotalPages(response.totalPages || 0);
      setOrderPage(0);
      
      if (response.orders.length === 0) {
        toast.error(`Không tìm thấy đơn hàng #${searchOrderId}`);
      }
    } catch (error) {
      console.error("Search order error:", error);
      toast.error(error.message || "Không thể tìm kiếm đơn hàng");
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Hàm xử lý xóa tìm kiếm
  const handleClearSearch = () => {
    setSearchOrderId("");
    setIsSearching(false);
    setOrderPage(0);
    fetchOrders(orderFilter === "ALL" ? null : orderFilter, 0); // Quay lại fetch theo filter
  };

  const renderProfileInfo = () => (
    <div className="max-w-2xl">
      <form onSubmit={handleUpdateProfile}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                disabled={!isEditing || isLoading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                disabled={!isEditing || isLoading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={user?.email || ""}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              type="tel"
              value={formData.phoneNumber || ""}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              disabled={!isEditing || isLoading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="mt-6">
          {isEditing ? (
            <div className="flex gap-3">
              <button 
                type="submit" 
                disabled={isLoading} 
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all font-medium disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin"/>}
                Save Changes
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    firstName: user?.firstName || "",
                    lastName: user?.lastName || "",
                    phoneNumber: user?.mobile || "",
                  });
                }} 
                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium" 
                disabled={isLoading}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button 
              type="button" 
              onClick={() => setIsEditing(true)} 
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all font-medium flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" /> Edit Profile
            </button>
          )}
        </div>
      </form>
    </div>
  );

  const renderAddresses = () => (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">My Addresses</h2>
        <button 
          onClick={() => {
            setIsAddressModalOpen(true);
          }} 
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all font-medium flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add New
        </button>
      </div>
      {isLoading && addresses.length === 0 ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      ) : addresses.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600">No addresses saved yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <div 
              key={address.id} 
              className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-800">{address.fullName}</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleDeleteAddress(address.id)}
                    className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                    title="Delete address"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600">{address.phoneNumber}</p>
              <p className="text-sm text-gray-600 mt-1">
                {[address.street, address.ward, address.province].filter(Boolean).join(", ")}
              </p>
              {address.note && (
                <p className="text-xs text-gray-500 mt-1 italic">Note: {address.note}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderOrders = () => (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">My Orders</h2>
        
        {/* Search Box */}
        <form onSubmit={handleSearchOrder} className="mb-4">
          <div className="relative">
            <input
              type="text"
              value={searchOrderId}
              onChange={(e) => setSearchOrderId(e.target.value.replace(/\D/g, ''))}
              placeholder="Tìm kiếm theo Order ID..."
              className="w-full pl-10 pr-24 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            
            {isSearching ? (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2 top-2 px-3 py-1 text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
              >
                <X className="w-4 h-4" /> Clear
              </button>
            ) : (
              <button
                type="submit"
                disabled={!searchOrderId.trim()}
                className="absolute right-2 top-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Search
              </button>
            )}
          </div>
        </form>
        
        {/* Status Filters - Hide when searching */}
        {!isSearching && (
          <div className="flex gap-2 overflow-x-auto pb-1 border-b border-gray-200">
            {["ALL", "PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"].map((filter) => (
              <button
                key={filter}
                onClick={() => {
                  setOrderFilter(filter);
                  setOrderPage(0);
                }}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  orderFilter === filter
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {filter.charAt(0) + filter.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        )}
        
        {/* Search Result Info */}
        {isSearching && orders.length > 0 && (
          <div className="mt-2 text-sm text-gray-600">
            Kết quả tìm kiếm cho Order #{searchOrderId}
          </div>
        )}
      </div>

      {loadingOrders ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600">
            {isSearching 
              ? `Không tìm thấy đơn hàng #${searchOrderId}` 
              : `No orders found with status ${orderFilter.toLowerCase()}.`}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {orders.map((order) => (
              <div 
                key={order.id} 
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-3 pb-3 border-b">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Order #{order.id}</p>
                    <p className="text-xs text-gray-500">
                      Placed on: {new Date(order.createdAt).toLocaleDateString('en-GB', { 
                        day: '2-digit', 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </p>
                  </div>
                  <div className='flex items-center gap-4 mt-2 sm:mt-0'>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.orderStatus)}`}>
                      {order.orderStatus}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                      {order.paymentStatus}
                    </span>
                    <Link 
                      to={`/order/${order.id}`} 
                      className="text-sm text-blue-600 hover:underline font-medium"
                    >
                      View Details
                    </Link>
                  </div>
                </div>

                {order.orderItems?.slice(0, 2).map((item) => (
                  <div key={item.id} className="flex items-center gap-3 mb-2 text-sm">
                    <img 
                      src={item.imageUrl || '/placeholder.svg?w=40&h=40'} 
                      alt={item.productTitle} 
                      className='w-10 h-10 object-cover rounded bg-gray-100'
                    />
                    <div className='flex-1 min-w-0'>
                      <p className='text-gray-700 line-clamp-1'>{item.productTitle}</p>
                      <p className='text-xs text-gray-500'>Qty: {item.quantity} | Size: {item.size}</p>
                    </div>
                    <p className='text-gray-800 font-medium whitespace-nowrap'>
                      {(item.discountedPrice || item.price).toLocaleString()}đ
                    </p>
                  </div>
                ))}
                {order.orderItems?.length > 2 && (
                  <p className="text-xs text-gray-500 text-center mt-1">
                    ... and {order.orderItems.length - 2} more item(s)
                  </p>
                )}

                <div className='mt-3 pt-3 border-t text-right'>
                  <p className="text-sm font-semibold text-gray-900">
                    Total: {order.totalPrice.toLocaleString()}đ
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination - Hide when searching */}
          {!isSearching && totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                onClick={() => setOrderPage(prev => Math.max(0, prev - 1))}
                disabled={orderPage === 0}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-gray-600">
                Page {orderPage + 1} of {totalPages}
              </span>
              <button
                onClick={() => setOrderPage(prev => Math.min(totalPages - 1, prev + 1))}
                disabled={orderPage >= totalPages - 1}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );

  const tabs = [
    { id: "profile", label: "Profile Info", icon: User },
    { id: "addresses", label: "Addresses", icon: MapPin },
    { id: "orders", label: "Orders", icon: Package },
  ];

  if (isLoading && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* User Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
              {user?.imageUrl ? (
                <img 
                  src={user.imageUrl} 
                  alt="User Avatar" 
                  className="w-full h-full rounded-full object-cover" 
                />
              ) : (
                <span className="text-white text-3xl font-bold">
                  {user?.firstName?.charAt(0).toUpperCase() || "U"}
                </span>
              )}
            </div>
            <div className='text-center sm:text-left'>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {user?.firstName} {user?.lastName}
              </h1>
              <p className="text-gray-600">{user?.email}</p>
              <span className="inline-block mt-1 px-3 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                {user?.role || "Customer"}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs & Content */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex flex-wrap -mb-px px-4" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'}`} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === "profile" && renderProfileInfo()}
            {activeTab === "addresses" && renderAddresses()}
            {activeTab === "orders" && renderOrders()}
          </div>
        </div>
      </div>

      {/* Address Modal */}
      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={handleAddressModalClose}
        onSuccess={handleAddressSuccess}
      />
    </div>
  );
}