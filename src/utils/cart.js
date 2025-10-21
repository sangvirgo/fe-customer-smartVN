// src/utils/cart.js

const CART_KEY = "cart";

// Lấy giỏ hàng từ localStorage
export const getCartFromStorage = () => {
  const cartJson = localStorage.getItem(CART_KEY);
  try {
    const cart = JSON.parse(cartJson);
    // Validate cart structure (optional but recommended)
    if (cart && Array.isArray(cart.items) && typeof cart.total === 'number') {
      return cart;
    }
  } catch (e) {
    console.error("Error parsing cart from localStorage", e);
  }
  // Return a default empty cart structure if invalid or not found
  return { items: [], total: 0 };
};

// Lưu giỏ hàng vào localStorage
const saveCartToStorage = (cart) => {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    // Dispatch an event so other parts of the app (like header) can update
    window.dispatchEvent(new Event("cartUpdated"));
  } catch (e) {
    console.error("Error saving cart to localStorage", e);
  }
};

// Thêm sản phẩm vào giỏ hàng (logic này có thể cần điều chỉnh dựa trên cấu trúc API và component)
// Phiên bản này giả định bạn muốn cập nhật localStorage *sau khi* API call thành công
// Component sẽ gọi API trước, sau đó có thể gọi hàm này để cập nhật local state (nếu cần)
export const addToCartStorage = (product, quantity = 1, size, storeVariant) => {
   if (!product || !size || !storeVariant) {
      console.error("Missing product, size, or storeVariant for addToCartStorage");
      return;
   }
  const cart = getCartFromStorage();
  // Find item by product ID, size, AND store ID to make it unique
  const existingItemIndex = cart.items.findIndex(
    (item) => item.productId === product.id && item.size === size && item.inventoryId === storeVariant.inventoryId
  );

  if (existingItemIndex > -1) {
    // Update quantity if item already exists
    cart.items[existingItemIndex].quantity += quantity;
     // Ensure quantity doesn't exceed stock (optional, API should handle this primarily)
     if (cart.items[existingItemIndex].quantity > storeVariant.quantity) {
        console.warn("Attempted to add more than available stock to local cart.");
        cart.items[existingItemIndex].quantity = storeVariant.quantity;
     }
  } else {
    // Add new item
    cart.items.push({
      // Use inventoryId as a unique key for this specific variant/store combo
      id: `${product.id}-${size}-${storeVariant.inventoryId}`, // Create a composite local ID
      inventoryId: storeVariant.inventoryId,
      productId: product.id,
      title: product.title,
      imageUrl: product.imageUrls?.[0] || "/placeholder.svg",
      price: storeVariant.price,
      discountedPrice: storeVariant.discountedPrice,
      size: size,
      quantity: Math.min(quantity, storeVariant.quantity), // Start with requested qty or max stock
      storeName: storeVariant.storeName, // Add store info if available in variant
      brand: product.brand,
    });
  }

  // Recalculate total (simple subtotal for local storage)
  cart.total = cart.items.reduce((sum, item) => sum + (item.discountedPrice || item.price) * item.quantity, 0);

  saveCartToStorage(cart);
};

// Cập nhật số lượng item trong localStorage
export const updateCartItemQuantityStorage = (compositeId, newQuantity) => {
  const cart = getCartFromStorage();
   const itemIndex = cart.items.findIndex((item) => item.id === compositeId);

   if (itemIndex > -1) {
      if (newQuantity <= 0) {
         // Remove item if quantity is 0 or less
         cart.items.splice(itemIndex, 1);
      } else {
          // Update quantity (add stock check if necessary, though API is primary)
          cart.items[itemIndex].quantity = newQuantity;
      }
       cart.total = cart.items.reduce((sum, item) => sum + (item.discountedPrice || item.price) * item.quantity, 0);
       saveCartToStorage(cart);
   } else {
      console.warn(`Item with composite ID ${compositeId} not found in local storage for update.`);
   }
};


// Xóa item khỏi localStorage
export const removeCartItemStorage = (compositeId) => {
  const cart = getCartFromStorage();
  const initialLength = cart.items.length;
  cart.items = cart.items.filter((item) => item.id !== compositeId);

   if (cart.items.length < initialLength) {
      cart.total = cart.items.reduce((sum, item) => sum + (item.discountedPrice || item.price) * item.quantity, 0);
      saveCartToStorage(cart);
   } else {
      console.warn(`Item with composite ID ${compositeId} not found in local storage for removal.`);
   }
};

// Xóa toàn bộ giỏ hàng localStorage
export const clearCartStorage = () => {
  saveCartToStorage({ items: [], total: 0 });
};