import { useState, useEffect } from "react";
import { User, MapPin, Package, Star, Edit2, Plus, Trash2, Loader2, Info, X } from "lucide-react"; // Added Info, X
import userService from "../../services/userService";
import orderService from "../../services/orderService"; // Added orderService
import { useNavigate, useSearchParams, Link } from "react-router-dom"; // Added Link
import { showToast } from "../../components/Toast";

// Add Address Modal Component (can be in a separate file)
function AddAddressModal({ isOpen, onClose, onAddressAdded }) {
  const [addressData, setAddressData] = useState({
    fullName: "",
    phoneNumber: "",
    province: "",
    ward: "",
    street: "",
    note: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState("");

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAddressData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setModalError("");
    // Basic validation
    if (!addressData.fullName || !addressData.phoneNumber || !addressData.province || !addressData.ward || !addressData.street) {
      setModalError("Please fill in all required fields.");
      return;
    }
    setIsSaving(true);
    try {
      await userService.addAddress(addressData);
      showToast("Address added successfully!", "success");
      onAddressAdded(); // Callback to refresh address list
      onClose(); // Close modal
      // Reset form
      setAddressData({ fullName: "", phoneNumber: "", province: "", ward: "", street: "", note: "" });
    } catch (error) {
      setModalError(error.message || "Failed to add address.");
      showToast(error.message || "Failed to add address", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 relative animate-fade-in max-h-[90vh] overflow-y-auto">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <h2 className="text-xl font-bold text-gray-900 mb-6">Add New Address</h2>
          <form onSubmit={handleSaveAddress} className="space-y-4">
             {/* Required fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input type="text" name="fullName" value={addressData.fullName} onChange={handleInputChange} required className="w-full input-style" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                <input type="tel" name="phoneNumber" value={addressData.phoneNumber} onChange={handleInputChange} required className="w-full input-style" />
              </div>
            </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Province/City *</label>
               <input type="text" name="province" value={addressData.province} onChange={handleInputChange} required className="w-full input-style" />
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">District/Ward *</label>
                 <input type="text" name="ward" value={addressData.ward} onChange={handleInputChange} required className="w-full input-style" />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
                 <input type="text" name="street" value={addressData.street} onChange={handleInputChange} required className="w-full input-style" />
               </div>
             </div>
             {/* Optional field */}
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Note (Optional)</label>
               <textarea name="note" value={addressData.note} onChange={handleInputChange} rows={2} className="w-full input-style resize-none"></textarea>
             </div>

             {modalError && (
               <p className="text-sm text-red-600 bg-red-50 p-2 rounded-md border border-red-200">{modalError}</p>
             )}

             <div className="flex justify-end gap-3 pt-4">
               <button type="button" onClick={onClose} className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">Cancel</button>
               <button type="submit" disabled={isSaving} className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 flex items-center gap-2">
                 {isSaving && <Loader2 className="w-4 h-4 animate-spin" />} Save Address
               </button>
             </div>
          </form>
          {/* Helper class for input styling */}
          <style jsx>{`
             .input-style {
               padding: 0.75rem 1rem;
               border: 1px solid #d1d5db; /* gray-300 */
               border-radius: 0.5rem; /* rounded-lg */
               outline: none;
             }
             .input-style:focus {
               ring: 2px;
               ring-color: #3b82f6; /* ring-blue-500 */
             }
           `}</style>
        </div>
      </div>
    );
}


// --- Profile Component ---
export default function Profile() {
  const [searchParams, setSearchParams] = useSearchParams(); // Use setSearchParams
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "profile");
  const [user, setUser] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [orders, setOrders] = useState([]); // State for orders
  const [loadingOrders, setLoadingOrders] = useState(false); // Loading state for orders
  const [reviews, setReviews] = useState([]); // Placeholder for reviews
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "", // Changed from mobile
  });
   const [orderFilter, setOrderFilter] = useState("ALL"); // State for order filter
   const [isAddAddressModalOpen, setIsAddAddressModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
     // Update URL when tab changes
     setSearchParams({ tab: activeTab });

    // Fetch data based on active tab
    if (activeTab === "profile" && !user) {
      fetchUserProfile();
    } else if (activeTab === "addresses") {
      fetchAddresses();
    } else if (activeTab === "orders") {
       fetchOrders(); // Fetch orders when tab is active
     }
    // Add logic for fetching reviews if needed
  }, [activeTab]); // Rerun effect when activeTab changes

  // Initial fetch for profile
   useEffect(() => {
     fetchUserProfile();
   }, []);

  const fetchUserProfile = async () => {
    setIsLoading(true);
    try {
      // Use the correct service function name
      const profileData = await userService.getProfile();
      setUser(profileData); // Assuming getProfile returns the user object directly
      setFormData({
        firstName: profileData.firstName || "",
        lastName: profileData.lastName || "",
        phoneNumber: profileData.mobile || "", // Use 'mobile' from UserDTO
      });
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      showToast(error.message || "Failed to load profile", "error");
      // Handle logout or redirect if unauthorized
       if (error.message.toLowerCase().includes('unauthorized')) {
         navigate('/login');
       }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAddresses = async () => {
     setIsLoading(true); // Indicate loading for addresses
    try {
      // Use the correct service function name
      const addressesData = await userService.getAddresses();
      setAddresses(addressesData || []); // Ensure it's an array
    } catch (error) {
      console.error("Failed to fetch addresses:", error);
       showToast(error.message || "Failed to load addresses", "error");
    } finally {
       setIsLoading(false);
     }
  };

   // Function to fetch orders based on filter
   const fetchOrders = async (status = null) => {
     setLoadingOrders(true);
     try {
       let response;
       if (!status || status === "ALL") {
         response = await orderService.getUserOrders();
       } else {
         response = await orderService.getOrdersByStatus(status);
       }
       setOrders(response.orders || []); // Assuming the response has an 'orders' array
     } catch (error) {
       console.error(`Failed to fetch orders with status ${status || 'ALL'}:`, error);
       showToast(error.message || `Failed to load ${status || 'all'} orders`, "error");
       setOrders([]); // Clear orders on error
     } finally {
       setLoadingOrders(false);
     }
   };

   // Effect to refetch orders when filter changes
   useEffect(() => {
     if (activeTab === 'orders') {
       fetchOrders(orderFilter === "ALL" ? null : orderFilter);
     }
   }, [orderFilter, activeTab]); // Depend on orderFilter and activeTab


  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      // Use the correct service function name and parameters
      const response = await userService.updateProfile(formData.firstName, formData.lastName, formData.phoneNumber);
      showToast("Profile updated successfully!", "success");
      setUser(response.data); // Update user state with the response data
      setIsEditing(false);
      // No need to call fetchUserProfile again if the service returns the updated user
    } catch (error) {
      showToast(error.message || "Failed to update profile", "error");
    }
  };

  const handleAddressAdded = () => {
     fetchAddresses(); // Refresh the address list
   };

  const tabs = [
    { id: "profile", label: "Profile Info", icon: User },
    { id: "addresses", label: "Addresses", icon: MapPin },
    { id: "orders", label: "Orders", icon: Package },
    // { id: "reviews", label: "My Reviews", icon: Star }, // Uncomment when reviews are implemented
  ];

  if (isLoading && !user) { // Show loading only initially
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  // --- Render Functions for Tabs ---

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
                 disabled={!isEditing}
                 className="w-full input-style disabled:bg-gray-100 disabled:cursor-not-allowed"
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
               <input
                 type="text"
                 value={formData.lastName}
                 onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                 disabled={!isEditing}
                 className="w-full input-style disabled:bg-gray-100 disabled:cursor-not-allowed"
               />
             </div>
           </div>
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
             <input
               type="email"
               value={user?.email || ""}
               disabled
               className="w-full input-style bg-gray-100 cursor-not-allowed"
             />
           </div>
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
             <input
               type="tel"
               value={formData.phoneNumber || ""}
               onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
               disabled={!isEditing}
               className="w-full input-style disabled:bg-gray-100 disabled:cursor-not-allowed"
             />
           </div>
         </div>
         <div className="mt-6">
           {isEditing ? (
             <div className="flex gap-3">
               <button type="submit" className="btn-primary">Save Changes</button>
               <button type="button" onClick={() => {
                 setIsEditing(false);
                 setFormData({ // Reset form on cancel
                   firstName: user?.firstName || "",
                   lastName: user?.lastName || "",
                   phoneNumber: user?.mobile || "",
                 });
               }} className="btn-secondary">Cancel</button>
             </div>
           ) : (
             <button type="button" onClick={() => setIsEditing(true)} className="btn-primary flex items-center gap-2">
               <Edit2 className="w-4 h-4" /> Edit Profile
             </button>
           )}
         </div>
       </form>
        {/* Helper class for input styling */}
         <style jsx>{`
           .input-style {
             padding: 0.75rem 1rem;
             border: 1px solid #d1d5db; /* gray-300 */
             border-radius: 0.5rem; /* rounded-lg */
             outline: none;
             transition: border-color 0.2s;
           }
           .input-style:focus {
             border-color: #3b82f6; /* blue-500 */
             box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3); /* ring-blue-500 */
           }
           .btn-primary {
             padding: 0.625rem 1.25rem; /* px-5 py-2.5 */
             background-image: linear-gradient(to right, #2563eb, #7c3aed); /* from-blue-600 to-purple-600 */
             color: white;
             border-radius: 0.5rem; /* rounded-lg */
             font-weight: 500; /* font-medium */
             transition: box-shadow 0.3s;
           }
           .btn-primary:hover {
             box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); /* hover:shadow-lg */
           }
            .btn-secondary {
             padding: 0.625rem 1.25rem;
             border: 1px solid #d1d5db; /* border-gray-300 */
             color: #374151; /* text-gray-700 */
             border-radius: 0.5rem;
             font-weight: 500;
             transition: background-color 0.2s;
           }
           .btn-secondary:hover {
             background-color: #f9fafb; /* hover:bg-gray-50 */
           }
         `}</style>
     </div>
  );

  const renderAddresses = () => (
     <div>
       <div className="flex justify-between items-center mb-6">
         <h2 className="text-xl font-bold text-gray-900">My Addresses</h2>
         <button onClick={() => setIsAddAddressModalOpen(true)} className="btn-primary flex items-center gap-2">
           <Plus className="w-4 h-4" /> Add New
         </button>
       </div>
        {isLoading && addresses.length === 0 ? ( // Show loader only when loading and no addresses yet
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
             <div key={address.id} className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-sm transition-shadow">
               <div className="flex justify-between items-start mb-2">
                 <h3 className="font-semibold text-gray-800">{address.fullName}</h3>
                 <div className="flex gap-2">
                   {/* Edit/Delete buttons (implement functionality later) */}
                   <button className="text-blue-500 hover:text-blue-700 p-1"><Edit2 className="w-4 h-4" /></button>
                   <button className="text-red-500 hover:text-red-700 p-1"><Trash2 className="w-4 h-4" /></button>
                 </div>
               </div>
               <p className="text-sm text-gray-600">{address.phoneNumber}</p>
               <p className="text-sm text-gray-600 mt-1">
                 {[address.street, address.ward, address.province].filter(Boolean).join(", ")}
               </p>
               {address.note && <p className="text-xs text-gray-500 mt-1 italic">Note: {address.note}</p>}
             </div>
           ))}
         </div>
       )}
        {/* Helper class for button styling */}
         <style jsx>{`
           .btn-primary {
             padding: 0.5rem 1rem; /* px-4 py-2 */
             background-image: linear-gradient(to right, #2563eb, #7c3aed); /* from-blue-600 to-purple-600 */
             color: white;
             border-radius: 0.5rem; /* rounded-lg */
             font-weight: 500; /* font-medium */
             transition: box-shadow 0.3s;
           }
           .btn-primary:hover {
             box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); /* hover:shadow-lg */
           }
         `}</style>
     </div>
  );

   const renderOrders = () => (
     <div>
       <div className="mb-6 border-b border-gray-200 pb-4">
         <h2 className="text-xl font-bold text-gray-900 mb-4">My Orders</h2>
         <div className="flex gap-2 overflow-x-auto pb-1">
           {["ALL", "PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"].map((filter) => (
             <button
               key={filter}
               onClick={() => setOrderFilter(filter)}
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
       </div>

       {loadingOrders ? (
         <div className="flex justify-center py-10">
           <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
         </div>
       ) : orders.length === 0 ? (
         <div className="text-center py-12 bg-gray-50 rounded-lg">
           <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
           <p className="text-gray-600">No orders found with status <span className='font-medium'>{orderFilter.toLowerCase()}</span>.</p>
         </div>
       ) : (
         <div className="space-y-4">
           {orders.map((order) => (
             <div key={order.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-3 pb-3 border-b">
                   <div>
                     <p className="text-sm font-semibold text-gray-800">Order #{order.id}</p>
                     <p className="text-xs text-gray-500">
                       Placed on: {new Date(order.createdAt).toLocaleDateString()}
                     </p>
                   </div>
                   <div className='flex items-center gap-4 mt-2 sm:mt-0'>
                     <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.orderStatus)}`}>
                       {order.orderStatus}
                     </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                         {order.paymentStatus} ({order.paymentMethod})
                      </span>
                     <Link to={`/order/${order.id}`} className="text-sm text-blue-600 hover:underline font-medium">View Details</Link>
                   </div>
                </div>

                {/* Simplified item display */}
                {order.orderItems?.slice(0, 2).map((item) => ( // Show first 2 items
                   <div key={item.id} className="flex items-center gap-3 mb-2 text-sm">
                      <img src={item.imageUrl || '/placeholder.svg'} alt={item.productTitle} className='w-10 h-10 object-cover rounded'/>
                      <div className='flex-1'>
                         <p className='text-gray-700 line-clamp-1'>{item.productTitle}</p>
                         <p className='text-xs text-gray-500'>Qty: {item.quantity} | Size: {item.size}</p>
                      </div>
                      <p className='text-gray-800 font-medium'>{(item.discountedPrice || item.price).toLocaleString()}đ</p>
                   </div>
                 ))}
                 {order.orderItems?.length > 2 && (
                    <p className="text-xs text-gray-500 text-center mt-1">... and {order.orderItems.length - 2} more item(s)</p>
                 )}

                 <div className='mt-3 pt-3 border-t text-right'>
                   <p className="text-sm font-semibold text-gray-900">Total: {order.totalPrice.toLocaleString()}đ</p>
                 </div>
             </div>
           ))}
         </div>
       )}
     </div>
   );

  // Helper functions for status colors (adjust colors as needed)
  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800';
      case 'SHIPPED': return 'bg-purple-100 text-purple-800';
      case 'DELIVERED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  const getPaymentStatusColor = (status) => {
     switch (status) {
       case 'PENDING': return 'bg-yellow-100 text-yellow-800';
       case 'COMPLETED': return 'bg-green-100 text-green-800';
       case 'FAILED': return 'bg-red-100 text-red-800';
       case 'CANCELLED': return 'bg-gray-100 text-gray-800';
       case 'REFUNDED': return 'bg-indigo-100 text-indigo-800';
       default: return 'bg-gray-100 text-gray-800';
     }
   };


  const renderReviews = () => (
    <div className="text-center py-12 bg-gray-50 rounded-lg">
      <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
      <h3 className="text-xl font-semibold text-gray-900 mb-2">My Reviews</h3>
      <p className="text-gray-600">Reviews functionality is not yet implemented.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* User Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
             <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
               {user?.imageUrl ? (
                   <img src={user.imageUrl} alt="User Avatar" className="w-full h-full rounded-full object-cover" />
               ) : (
                  <span className="text-white text-3xl font-bold">{user?.firstName?.charAt(0).toUpperCase() || "U"}</span>
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
           {/* Tab Navigation */}
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
                    aria-current={activeTab === tab.id ? 'page' : undefined}
                  >
                    <Icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'}`} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

           {/* Tab Content */}
          <div className="p-6">
            {activeTab === "profile" && renderProfileInfo()}
            {activeTab === "addresses" && renderAddresses()}
            {activeTab === "orders" && renderOrders()}
            {/* {activeTab === "reviews" && renderReviews()} */}
          </div>
        </div>
      </div>
       {/* Add Address Modal */}
       <AddAddressModal
         isOpen={isAddAddressModalOpen}
         onClose={() => setIsAddAddressModalOpen(false)}
         onAddressAdded={handleAddressAdded}
       />
    </div>
  );
}