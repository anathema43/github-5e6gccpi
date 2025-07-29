// src/config/stripe.js
import { loadStripe } from '@stripe/stripe-js';

// Check if Stripe key is configured
const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripeKey || stripeKey.includes('placeholder') || stripeKey.includes('your_') || stripeKey === '') {
  console.warn('⚠️ Stripe publishable key is not configured. Please check your .env file and set VITE_STRIPE_PUBLISHABLE_KEY.');
}

// Initialize Stripe
const stripePromise = stripeKey && !stripeKey.includes('placeholder') && !stripeKey.includes('your_') && stripeKey !== ''
  ? loadStripe(stripeKey)
  : null;

export default stripePromise;