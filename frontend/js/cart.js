/**
 
 * Manages all cart operations using the secure Express backend and JWT authentication.
 * All core functions (getCart, addToCart, removeFromCart, clearCart) now make async API calls.
 */

// Ensure this matches your running Express backend URL
const BACKEND_URL = "http://localhost:5000";

// --- Utility for UI Feedback (Unchanged) ---

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

    // Fixed positioning for visibility on mobile and desktop
    container.style.position = 'fixed';
    container.style.top = '1rem';
    container.style.right = '1rem';
    container.style.zIndex = '50';
    container.style.maxWidth = '300px';

    container.appendChild(msgBox);

    // Auto-remove after 3 seconds
    setTimeout(() => {
        msgBox.style.opacity = '0';
        msgBox.addEventListener('transitionend', () => msgBox.remove());
    }, 3000);
}

// --- JWT Authentication Helper ---

/**
 * Retrieves the JWT token from localStorage and prepares the Authorization header.
 * If no token is found, it prompts the user to log in and redirects.
 * @returns {object|null} The headers object including the Authorization header, or null if unauthorized.
 */
function getAuthHeaders() {
    const token = localStorage.getItem('userToken'); // ASSUMPTION: Token is stored here after successful login

    if (!token) {
        displayMessage("You must be logged in to manage your cart.", 'error');
        // Redirect to login page for better UX
        // We will update auth.html next to save the token here!
        setTimeout(() => { window.location.href = 'auth.html'; }, 1000); 
        return null;
    }

    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// --- Core Cart Functions (Now ASYNC API Calls) ---

/**
 * Retrieves the current cart items from the secure backend.
 * @returns {Promise<Array>} The cart items array or an empty array.
 */
async function getCart() {
    const headers = getAuthHeaders();
    if (!headers) return [];

    try {
        const response = await fetch(`${BACKEND_URL}/api/cart`, { headers });
        const data = await response.json();

        if (response.ok) {
            // The server returns the cart object, which contains an 'items' array
            return data.items || [];
        } else {
            console.error('Failed to fetch cart from server:', data.message);
            // This might happen if the user is logged in but the cart hasn't been created yet.
            return [];
        }
    } catch (error) {
        console.error('Network error fetching cart:', error);
        displayMessage('Could not connect to cart service.', 'error');
        return [];
    }
}

/**
 * Central function to add a product or update the quantity of an existing item.
 * @param {number} productId - The product's ID.
 * @param {string} name - Product name.
 * @param {number} price - Product price.
 * @param {string} image - Product image URL.
 * @param {number} quantity - The quantity to add/set for this item.
 * @param {object} options - Optional selected options (e.g., { size: 'Large', scent: 'Rose' }).
 */
async function updateCartItem(productId, name, price, image, quantity, options = {}) {
    const headers = getAuthHeaders();
    if (!headers) return false;

    if (quantity < 1) {
        // Delegate removal to the DELETE endpoint if quantity is set to zero/negative
        return removeFromCart(productId, options);
    }

    const payload = {
        productId: parseInt(productId), // Ensure ID is a number
        name,
        price,
        image,
        quantity,
        ...options // Spreading size/scent options
    };

    try {
        // The backend POST endpoint handles both ADD and UPDATE logic
        const response = await fetch(`${BACKEND_URL}/api/cart`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (response.ok) {
            displayMessage(`Cart updated! ${data.message}`, 'success');
            // Notify all listeners (e.g., cart.html rendering function)
            window.dispatchEvent(new Event('cartUpdated')); 
            return true;
        } else {
            displayMessage(`Error updating cart: ${data.message || 'Server error.'}`, 'error');
            return false;
        }
    } catch (error) {
        console.error('Network error updating cart:', error);
        displayMessage('Network error updating cart.', 'error');
        return false;
    }
}


/**
 * Removes an item completely from the cart by product ID.
 * @param {number} productId - The ID of the item to remove.
 * @param {object} options - Optional options to identify the specific item variant.
 */
async function removeFromCart(productId, options = {}) {
    const headers = getAuthHeaders();
    if (!headers) return false;

    try {
        // The backend DELETE endpoint handles finding and removing the item
        const response = await fetch(`${BACKEND_URL}/api/cart/${productId}`, {
            method: 'DELETE',
            headers,
            // Send options in the body to correctly identify the item variant (e.g., 'Large Rose Candle')
            body: JSON.stringify(options)
        });

        const data = await response.json();

        if (response.ok) {
            displayMessage('Item removed from cart.', 'info');
            window.dispatchEvent(new Event('cartUpdated'));
            return true;
        } else {
            displayMessage(`Error removing item: ${data.message || 'Server error.'}`, 'error');
            return false;
        }
    } catch (error) {
        console.error('Network error removing item:', error);
        displayMessage('Network error removing item.', 'error');
        return false;
    }
}

/**
 * Completely clears all items from the cart.
 */
async function clearCart() {
    const headers = getAuthHeaders();
    if (!headers) return false;

    try {
        // The backend DELETE endpoint clears the whole cart for the user
        const response = await fetch(`${BACKEND_URL}/api/cart/clear`, {
            method: 'DELETE',
            headers
        });

        const data = await response.json();

        if (response.ok) {
            displayMessage('Cart cleared successfully.', 'info');
            window.dispatchEvent(new Event('cartUpdated'));
            return true;
        } else {
            displayMessage(`Error clearing cart: ${data.message || 'Server error.'}`, 'error');
            return false;
        }
    } catch (error) {
        console.error('Network error clearing cart:', error);
        displayMessage('Network error clearing cart.', 'error');
        return false;
    }
}

/*
 * Calculates the total price of all items in the cart (local calculation).
 * @param {Array} cart - The cart array from the server.
 * @returns {number} The total price.
 */
function calculateCartTotal(cart) {
    // Reduce the array to calculate the total sum (price * quantity)
    return cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
}


// --- Exported Functions ---

// The `addToCart` wrapper makes calling from HTML simple by assuming quantity = 1 and passing all necessary fields.
async function addToCart(product, quantity = 1, options = {}) {
    return updateCartItem(
        product.id,
        product.name,
        product.price,
        product.image,
        quantity,
        options
    );
}

// Expose the core functions and constants globally for use in other HTML files
window.getCart = getCart;
window.addToCart = addToCart;
window.updateCartItem = updateCartItem; // Exposed for granular quantity control
window.removeFromCart = removeFromCart;
window.clearCart = clearCart;
window.calculateCartTotal = calculateCartTotal;
window.displayMessage = displayMessage;
window.BACKEND_URL = BACKEND_URL;
window.getAuthHeaders = getAuthHeaders; // Useful for other secure requests
