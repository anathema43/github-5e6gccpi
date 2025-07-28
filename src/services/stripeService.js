import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export const createPaymentIntent = async (amount, currency = 'inr', metadata = {}) => {
  try {
    const response = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        metadata
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create payment intent');
    }

    const { clientSecret } = await response.json();
    return clientSecret;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
};

export const confirmPayment = async (clientSecret, paymentMethod) => {
  const stripe = await stripePromise;
  
  const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
    payment_method: paymentMethod
  });

  if (error) {
    throw error;
  }

  return paymentIntent;
};

export const createSetupIntent = async (customerId) => {
  try {
    const response = await fetch('/api/create-setup-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ customerId }),
    });

    const { clientSecret } = await response.json();
    return clientSecret;
  } catch (error) {
    console.error('Error creating setup intent:', error);
    throw error;
  }
};

export const processRefund = async (paymentIntentId, amount) => {
  try {
    const response = await fetch('/api/process-refund', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to process refund');
    }

    return await response.json();
  } catch (error) {
    console.error('Error processing refund:', error);
    throw error;
  }
};

export default stripePromise;