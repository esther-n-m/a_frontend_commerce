/**
  Shopping Cart Logic (cart.js)
  Manages all cart operations using localStorage for persistence.
  All core functions (addToCart, getCart, clearCart) are defined here.
 */

const CART_STORAGE_KEY = 'ecom_cart';
// !!! CRITICAL CHANGE: Update this with your actual live Render backend URL !!!
// Example: https://my-ecom-backend-abc12345.onrender.com
// You MUST use HTTPS here.
const BACKEND_URL = "https://backend-commerce-7ncw.onrender.com"; 

// Expose the BASE_URL globally so other files can use it (e.g., auth.html)
window.BASE_URL = BACKEND_URL;

// Utility for UI Feedback (since we can't use alert()) 
function displayMessage(message, type = 'default') {
    const container = document.getElementById('message-container');
    if (!container) {
        // Fallback for pages without the container (like index.html before update)
        console.log(`[Message: ${type}] ${message}`);
        return;
    }

    const msgBox = document.createElement('div');
    msgBox.className = `p-3 mb-2 rounded-lg text-sm transition-opacity duration-300 shadow-xl ${
        type === 'success' ? 'bg-green-500 text-white' :
        type === 'error' ? 'bg-red-500 text-white' :
        'bg-blue-500 text-white'
    }`;
    msgBox.textContent = message;

    // Fixed positioning for visibility on mobile and desktop
    container.style.position = 'fixed';
    container.style.top = '1rem';
    container.style.right = '1rem';
    container.style.zIndex = '50';
    container.style.maxWidth = '300px';

    container.appendChild(msgBox);

    // Automatically remove the message after 5 seconds
    setTimeout(() => {
        msgBox.style.opacity = '0';
        setTimeout(() => {
            container.removeChild(msgBox);
        }, 300); // Wait for fade-out transition
    }, 5000);
}

/*
  Loads the cart data from localStorage.
  @returns {Array} The current cart items array, or an empty array if none exists.
 */
function getCart() {
    try {
        const cartJson = localStorage.getItem(CART_STORAGE_KEY);
        // Ensure we return an array if localStorage is empty or corrupted
        return cartJson ? JSON.parse(cartJson) : [];
    } catch (e) {
        console.error("Error reading cart from localStorage:", e);
        return [];
    }
}

/*
  Saves the current cart array to localStorage.
  @param {Array} cart - The cart array to save.
 */
function saveCart(cart) {
    try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
        console.error("Error writing cart to localStorage:", e);
    }
}

/*
  Adds or increments a product in the cart.
  @param {Object} product - The product object to add (must include id, name, price, image, quantity, size, scent).
 */
function addToCart(product) {
    let cart = getCart();

    // Create a unique identifier for the item based on product ID and options
    // This allows the user to have the same product with different options in the cart
    const itemIdentifier = `${product.productId}-${product.size}-${product.scent}`;

    const existingItem = cart.find(item => 
        `${item.productId}-${item.size}-${item.scent}` === itemIdentifier
    );

    if (existingItem) {
        // Increment quantity if item with same options already exists
        existingItem.quantity += product.quantity;
    } else {
        // Add new item to cart
        cart.push(product);
    }

    saveCart(cart);
    displayMessage(`Added ${product.quantity} x ${product.name} to cart!`, 'success');
}

/*
  Removes an item completely from the cart by product ID and options.
 */
function removeFromCart(itemIdentifier) {
    let cart = getCart();
    const initialLength = cart.length;
    
    // Filter out the item based on the unique identifier
    cart = cart.filter(item => `${item.productId}-${item.size}-${item.scent}` !== itemIdentifier);

    if (cart.length < initialLength) {
        saveCart(cart);
        displayMessage('Item removed from cart.', 'info');
    }
}

/*
  Completely clears all items from the cart.
 */
function clearCart() {
    saveCart([]);
    displayMessage('Cart cleared successfully.', 'info');
}

/*
  Updates the quantity of a specific item in the cart.
 */
function updateCartItemQuantity(itemIdentifier, newQuantity) {
    let cart = getCart();
    
    const item = cart.find(item => 
        `${item.productId}-${item.size}-${item.scent}` === itemIdentifier
    );

    if (item) {
        item.quantity = newQuantity;
        saveCart(cart);
    }
}

/*
  Calculates the total price of all items in the cart.
  @param {Array} cart - The cart array.
  @returns {number} The total price.
 */
function calculateCartTotal(cart) {
    // Reduce the array to calculate the total sum (price * quantity)
    return cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
}

// Expose these core functions and constants globally so they can be called from other HTML files
window.addToCart = addToCart;
window.getCart = getCart;
window.clearCart = clearCart;
window.removeFromCart = removeFromCart;
window.updateCartItemQuantity = updateCartItemQuantity;
window.calculateCartTotal = calculateCartTotal;
window.displayMessage = displayMessage;
