/* Single source of truth for user-facing messages. */

export const MSG = {
  success: {
    categoryCreated: "Category created.",
    categoryUpdated: "Category updated.",
    categoryDeleted: "Category deleted.",
    productCreated: "Product created.",
    productUpdated: "Product updated.",
    productDeleted: "Product deleted.",
    userCreated: "User created.",
    userUpdated: "User updated.",
    userDeleted: "User deleted.",
    cartAdded: (name) => `"${name}" added to cart.`,
    cartUpdated: "Cart updated.",
    loggedOut: "Logged out.",
    loginOk: "Welcome back!",
    registerOk: "Account created — welcome!"
  },
  error: {
    generic: "Something went wrong. Please try again.",
    loadFailed: (what) => `Failed to load ${what}.`,
    saveFailed: (what) => `Failed to save ${what}.`,
    deleteFailed: (what) => `Failed to delete ${what}.`,
    network: "Network error — please check your connection."
  },
  warning: {
    confirmDelete: (name) => `Are you sure you want to delete "${name}"? This cannot be undone.`,
    emptyName: "Name is required.",
    emptyCart: "Your cart is empty."
  },
  info: {
    nothingHere: "Nothing here yet."
  }
};
