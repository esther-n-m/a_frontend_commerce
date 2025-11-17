/**
  Shopping Cart Logic (cart.js)
  Manages all cart operations using the deployed backend API (Render).
  All core functions are now API-based and require a JWT token.
 */

// !!! CRITICAL: Set this to your actual live Render backend URL !!!
const BACKEND_URL = "https://backend-commerce-7ncw.onrender.com"; 
window.BASE_URL = BACKEND_URL;

// --- Utility Functions ---

/**
 * @desc Formats a number into Kenyan Shillings (KSh) currency string.
 * @param {number} amount - The price amount.
 * @returns {string} The formatted currency string.
 */
window.formatCurrency = (amount)  => {
    // Uses the Kenyan Shilling (KES) locale and currency code.
    // maximumFractionDigits: 0 is used because the prices in products.json are whole numbers.
    return new Intl.NumberFormat('en-KE', { 
        style: 'currency', 
        currency: 'KES', 
        maximumFractionDigits: 2
    }).format(amount);
};
//window.formatCurrency = formatCurrency; // Expose globally

/*function getToken() {
    // Fetches the JWT token stored by auth.html after successful login
    return localStorage.getItem('userToken'); 
}*/

// checkAuthAndRedirect 
// This function can't reliably check for a secure HttpOnly cookie. 
// You should rely on the API calls themselves to return a 401 error, 
// or write a dedicated function to check a protected route. 
 // For now, let's simplify to prevent the crash. 
function checkAuthAndRedirect() { 
    /* Remove or rewrite this check, as the frontend cannot read the secure token. To prevent a crash: */
     return true; 
     // Allows the page to load and rely on API calls to fail/redirect
      }

window.checkAuthAndRedirect = checkAuthAndRedirect; // Expose globally 

// Utility for UI Feedback (Must be defined globally for all pages)
function displayMessage(message, type = 'default') {
    const container = document.getElementById('message-container');
    if (!container) {
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
    container.prepend(msgBox); 

    setTimeout(() => {
        msgBox.classList.add('opacity-0');
        setTimeout(() => msgBox.remove(), 300);
    }, 5000);
}
window.displayMessage = displayMessage;


// --- API-BASED CART FUNCTIONS ---

/**
 * @desc Fetches the user's cart from the backend (GET /api/cart)
 * @returns {Array} Array of cart items or empty array on failure/no token
 */
window.getCartAPI = async function() {
    // const token = getToken();
    // if (!token) {
    //     // If no token, user is not logged in.
    //     return []; 
    // }

    try {
        const response = await fetch(`${window.BASE_URL}/api/cart`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json' 
            },
            
        });

        if (response.ok) {
            const cartData = await response.json();
            // The backend returns the whole cart object, we want the items array
            return cartData.items || []; 
        } 
        
        if (response.status === 401) {
             console.error("Authentication failed. Token expired or invalid.");
             // Clear token so user is forced to log in
             localStorage.removeItem('userToken');
             window.displayMessage('Session expired. Please log in again.', 'error');
        }

        return []; 

    } catch (error) {
        console.error("Network error fetching cart:", error);
        return [];
    }
}

/**
 * @desc Adds an item to the backend cart (POST /api/cart/add)
 * @param {object} item - { productId, name, price, quantity, size, scent }
 */
window.addToCartAPI = async function(item) {
    // const token = getToken();
    // if (!token) {
    //     window.displayMessage('Please log in to add items to your cart.', 'error');
    //     return;
    // }

    // The backend's /api/cart/add expects: productId, name, price, quantity, size, scent
    const payload = {
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity || 1,
        // Ensure size and scent are passed, even if null/undefined, 
        // to match the Cart model structure
        size: item.size || null,
        scent: item.scent || null
    };

    try {
        const response = await fetch(`${window.BASE_URL}/api/cart/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            window.displayMessage(`Added ${payload.name} to cart.`, 'success');
            // Update cart count in the header
            window.updateCartCount(); 
        } else {
            window.displayMessage(`Failed to add item: ${data.message || 'Server error.'}`, 'error');
        }
    } catch (error) {
        console.error("Network error adding item:", error);
        window.displayMessage('Network error. Check your backend connection.', 'error');
    }
}

/**
 * @desc Updates the quantity of a specific item in the cart (PUT /api/cart/update)
 * @param {string} itemId - The MongoDB _id of the item in the cart array.
 * @param {number} newQuantity 
 */
window.updateCartItemAPI = async function(itemId, newQuantity) {
    // const token = getToken();
    // if (!token) { return; } 

    try {
        const response = await fetch(`${window.BASE_URL}/api/cart/update`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json' 
            },
            
            body: JSON.stringify({ itemId, quantity: newQuantity })
        });
        
        const data = await response.json();
        
        if (response.ok) {
             // Re-fetch and re-render the cart page to update totals (only if on cart.html)
             if (window.fetchCart) window.fetchCart(); 
             window.updateCartCount();
        } else {
            window.displayMessage(`Update failed: ${data.message || 'Server error.'}`, 'error');
            if (window.fetchCart) window.fetchCart(); // Re-render to restore previous quantity on failure
        }

    } catch (error) {
        console.error("Network error updating item:", error);
        window.displayMessage('Network error. Could not update cart.', 'error');
    }
}

/**
 * @desc Removes an item entirely from the cart (DELETE /api/cart/remove/:itemId)
 * @param {string} itemId - The MongoDB _id of the item in the cart array.
 */
window.removeFromCartAPI = async function(itemId) {
    // const token = getToken();
    // if (!token) { return; }

    try {
        const response = await fetch(`${window.BASE_URL}/api/cart/remove/${itemId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json' 
            },
            
        });

        const data = await response.json();

        if (response.ok) {
            window.displayMessage('Item removed from cart.', 'info');
            if (window.fetchCart) window.fetchCart(); // Re-render cart page
            window.updateCartCount(); 
        } else {
            window.displayMessage(`Removal failed: ${data.message || 'Server error.'}`, 'error');
        }
    } catch (error) {
        console.error("Network error removing item:", error);
        window.displayMessage('Network error. Could not remove item.', 'error');
    }
}


/**
 * @desc Clears all items from the cart (DELETE /api/cart/clear)
 */
window.clearCartAPI = async function() {
    // const token = getToken();
    // if (!token) { return; }

    if (!confirm("Are you sure you want to clear your cart?")) {
        return;
    }

    try {
        const response = await fetch(`${window.BASE_URL}/api/cart/clear`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json' 
            },
        });

        const data = await response.json();

        if (response.ok) {
            window.displayMessage('Cart cleared successfully.', 'info');
            if (window.fetchCart) window.fetchCart(); 
            window.updateCartCount(); 
        } else {
            window.displayMessage(`Clear cart failed: ${data.message || 'Server error.'}`, 'error');
        }
    } catch (error) {
        console.error("Network error clearing cart:", error);
        window.displayMessage('Network error. Could not clear cart.', 'error');
    }
}

// --- Total Calculation and Cart Count ---

function calculateCartTotal(cartItems) {
    return cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
}
window.calculateCartTotal = calculateCartTotal;


/**
 * @desc Updates the cart count shown in the header/nav bar
 */
window.updateCartCount = async function() {
    const cartCountElement = document.getElementById('cart-count');
    if (!cartCountElement) return;

    try {
        const cartItems = await window.getCartAPI();
        const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);
        
        cartCountElement.textContent = totalItems;
        if (totalItems > 0) {
            cartCountElement.classList.remove('hidden');
        } else {
            cartCountElement.classList.add('hidden');
        }
    } catch (error) {
        cartCountElement.classList.add('hidden'); 
        console.error("Could not update cart count:", error);
    }
}

// --- Expose API functions using generic names for HTML compatibility ---
window.getCart = window.getCartAPI; 
window.addToCart = window.addToCartAPI;
window.clearCart = window.clearCartAPI; 
// Note: removeFromCart and updateCartItemQuantity are handled directly by cart.html script