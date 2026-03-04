// TEST FILE - Check if JavaScript is loading
console.log('=== MAIN.JS LOADING ===');
console.log('Environment check - script is executing');

// Import CSS first
import './style.css';
console.log('✓ CSS imported');

// Test if DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('✓ DOM Content Loaded');
});

// Try to add something to the page immediately
const app = document.querySelector('#app');
if (app) {
    console.log('✓ #app element found');
    app.innerHTML = '<div style="color: white; padding: 50px; font-size: 24px;">TEST: If you see this, JavaScript is working!</div>';
    console.log('✓ Content added to #app');
} else {
    console.error('✗ #app element NOT found!');
}

console.log('=== MAIN.JS LOADED ===');
