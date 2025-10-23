"use client";

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from 'react-hot-toast';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Loader2,
} from "lucide-react";
import cartService from "../../services/cartService";

export default function Cart() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingItemId, setUpdatingItemId] = useState(null);
  const [selectedItems, setSelectedItems] = useState(new Set());

  useEffect(() => {
    fetchCart();
  }, []);

  // ✅ Auto-select all items when cart loads
  useEffect(() => {
    if (cart?.cartItems && cart.cartItems.length > 0) {
      setSelectedItems(new Set(cart.cartItems.map(item => item.id)));
    }
  }, [cart?.cartItems]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const cartData = await cartService.getCart();
      setCart(cartData);
    } catch (err) {
      console.error(err.message || "Failed to load cart");
      setCart({ cartItems: [], totalOriginalPrice: 0, totalDiscountedPrice: 0, discount: 0 });
    } finally {
      setLoading(false);
    }
  };

  const toggleItemSelection = (itemId) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === cart?.cartItems?.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(cart.cartItems.map(item => item.id)));
    }
  };

  const updateQuantity = async (item, newQuantity) => {
    if (newQuantity < 1 || updatingItemId === item.id) return;

    setUpdatingItemId(item.id);
    try {
      const response = await cartService.updateCartItem(item.id, newQuantity, item.productId, item.size);
      await fetchCart();
      window.dispatchEvent(new Event("cartUpdated"));
      if(response.message) {
        toast.success(response.message);
      }
    } catch (err) {
      toast.error(err.message || "Failed to update quantity");
    } finally {
      setUpdatingItemId(null);
    }
  };

  const removeItem = async (itemId) => {
    if (updatingItemId === itemId) return;

    setUpdatingItemId(itemId);
    try {
      const response = await cartService.removeCartItem(itemId);
      await fetchCart();
      window.dispatchEvent(new Event("cartUpdated"));
      toast.success(response.message || 'Item removed');
      
      // ✅ Remove from selected items if deleted
      setSelectedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    } catch (err) {
      toast.error(err.message || "Failed to remove item");
    } finally {
      setUpdatingItemId(null);
    }
  };

  // ✅ Calculate totals ONLY from selected items
  const selectedCartItems = cart?.cartItems?.filter(item => selectedItems.has(item.id)) || [];
  const subtotal = selectedCartItems.reduce((sum, item) => 
    sum + (item.discountedPrice || item.price) * item.quantity, 0);
  const originalTotal = selectedCartItems.reduce((sum, item) => 
    sum + item.price * item.quantity, 0);
  const discount = originalTotal - subtotal;
  const shipping = 0;
  const total = subtotal + shipping;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!cart || !cart.cartItems || cart.cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <ShoppingCart className="w-24 h-24 mx-auto text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Add some products to get started!</p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Continue Shopping
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items List */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 space-y-4">
            {/* Select All Checkbox */}
            <div className="flex items-center gap-3 mb-4 pb-3 border-b">
              <input
                type="checkbox"
                id="select-all"
                checked={selectedItems.size === cart?.cartItems?.length && cart?.cartItems?.length > 0}
                onChange={toggleSelectAll}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="select-all" className="text-sm font-medium text-gray-700 cursor-pointer">
                Select All ({cart?.cartItems?.length || 0} items)
              </label>
            </div>

            {/* Cart Items with Checkbox */}
            {cart.cartItems.map((item) => (
              <div key={item.id} className={`flex gap-4 py-4 border-b last:border-b-0 ${updatingItemId === item.id ? 'opacity-50' : ''}`}>
                {/* Checkbox */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id={`item-${item.id}`}
                    checked={selectedItems.has(item.id)}
                    onChange={() => toggleItemSelection(item.id)}
                    disabled={updatingItemId === item.id}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                  />
                </div>

                <img
                  src={item.imageUrl || "/placeholder.svg"}
                  alt={item.productName}
                  className="w-full sm:w-24 h-auto sm:h-24 object-cover rounded-lg flex-shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 truncate">{item.productName}</h4>
                  <p className="text-sm text-gray-600">Size: {item.size}</p>
                  {item.discountedPrice < item.price && (
                    <p className="text-sm text-gray-400 line-through">
                      {item.price.toLocaleString()}đ
                    </p>
                  )}
                  <p className="text-sm font-medium text-blue-600">
                    {(item.discountedPrice || item.price).toLocaleString()}đ / item
                  </p>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <button
                    onClick={() => updateQuantity(item, item.quantity - 1)}
                    disabled={updatingItemId === item.id || item.quantity <= 1}
                    className="p-2 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus className="w-4 h-4 text-gray-700" />
                  </button>
                  <span className="text-gray-900 font-medium w-8 text-center">
                    {updatingItemId === item.id ? <Loader2 className="w-4 h-4 animate-spin mx-auto"/> : item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item, item.quantity + 1)}
                    disabled={updatingItemId === item.id}
                    className="p-2 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4 text-gray-700" />
                  </button>
                </div>

                {/* Item Total Price */}
                <div className="text-right sm:text-left font-semibold text-gray-900 w-full sm:w-auto mt-2 sm:mt-0">
                  {((item.discountedPrice || item.price) * item.quantity).toLocaleString()}đ
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeItem(item.id)}
                  disabled={updatingItemId === item.id}
                  className="p-2 text-red-500 hover:text-red-700 rounded-md hover:bg-red-50 disabled:opacity-50 self-center sm:self-auto"
                  title="Remove item"
                >
                  {updatingItemId === item.id ? <Loader2 className="w-5 h-5 animate-spin"/> : <Trash2 className="w-5 h-5" />}
                </button>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="bg-white rounded-xl shadow-sm p-6 h-fit sticky top-24">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-3">Order Summary</h3>
            
            {/* Show selected items count */}
            <div className="mb-4 text-sm text-gray-600">
              {selectedItems.size} of {cart?.cartItems?.length || 0} items selected
            </div>

            <div className="space-y-3">
              {/* Original Total if there's a discount */}
              {discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Original Total</span>
                  <span className="text-gray-500 line-through">{originalTotal.toLocaleString()}đ</span>
                </div>
              )}
              {/* Discount Amount */}
              {discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-green-600">Discount</span>
                  <span className="text-green-600 font-medium">- {discount.toLocaleString()}đ</span>
                </div>
              )}
              {/* Subtotal */}
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900 font-medium">{subtotal.toLocaleString()}đ</span>
              </div>
              {/* Shipping */}
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className="text-gray-900 font-medium">{shipping > 0 ? `${shipping.toLocaleString()}đ` : 'Free'}</span>
              </div>
              {/* Total */}
              <div className="flex justify-between border-t pt-3 mt-3">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-lg font-bold text-blue-600">{total.toLocaleString()}đ</span>
              </div>
            </div>
            
            <button
              onClick={() => {
                if (selectedItems.size === 0) {
                  toast.error("Please select at least one item to checkout");
                  return;
                }
                sessionStorage.setItem('selectedCartItemIds', JSON.stringify(Array.from(selectedItems)));
                navigate("/checkout");
              }}
              disabled={!cart?.cartItems?.length || selectedItems.size === 0}
              className="mt-6 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Proceed to Checkout ({selectedItems.size} items) <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}