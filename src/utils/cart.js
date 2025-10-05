export const addToCart = (product, quantity, size, store) => {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");

  const existingItemIndex = cart.findIndex(
    (item) =>
      item.product.id === product.id &&
      item.size === size &&
      item.store.id === store.id
  );

  if (existingItemIndex > -1) {
    cart[existingItemIndex].quantity += quantity;
  } else {
    cart.push({ product, quantity, size, store });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  window.dispatchEvent(new Event("cartUpdated"));
};