// Script to clear browser session and force fresh login
console.log('=== CLEARING BROWSER SESSION ===');

// Clear localStorage
localStorage.removeItem('client_session');
console.log('✅ Cleared client_session from localStorage');

// Clear any other related storage
sessionStorage.clear();
console.log('✅ Cleared sessionStorage');

console.log('🔄 Please refresh the page and log in again to get fresh client data');
console.log('💡 This will ensure the frontend has the correct user_id from the database');
