import React, { useState, useEffect } from 'react';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import stripePromise, { createPaymentIntent } from '../services/stripeService';
import { useCartStore } from '../store/cartStore';
import { useOrderStore } from '../store/orderStore';
import { useAuthStore } from '../store/authStore';
import formatCurrency from '../utils/formatCurrency';

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#333333',
      fontFamily: 'Inter, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: '#aab7c4'
      }
    },
    invalid: {
      color: '#fa755a',
      iconColor: '#fa755a'
    }
  }
};

function CheckoutForm({ orderData, onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const { createOrder } = useOrderStore();
  const { clearCart } = useCartStore();

  useEffect(() => {
    // Create payment intent when component mounts
    const initializePayment = async () => {
      try {
        const secret = await createPaymentIntent(
          orderData.total,
          'inr',
          {
            orderId: `order_${Date.now()}`,
            customerEmail: orderData.shipping.email
          }
        );
        setClientSecret(secret);
      } catch (error) {
        onError('Failed to initialize payment. Please try again.');
      }
    };

    if (orderData.total > 0) {
      initializePayment();
    }
  }, [orderData.total, orderData.shipping.email, onError]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setIsProcessing(true);

    const cardElement = elements.getElement(CardElement);

    try {
      // Confirm payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: `${orderData.shipping.firstName} ${orderData.shipping.lastName}`,
            email: orderData.shipping.email,
            phone: orderData.shipping.phone,
            address: {
              line1: orderData.shipping.address,
              city: orderData.shipping.city,
              state: orderData.shipping.state,
              postal_code: orderData.shipping.zipCode,
              country: orderData.shipping.country || 'IN'
            }
          }
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (paymentIntent.status === 'succeeded') {
        // Create order in database
        const order = await createOrder({
          ...orderData,
          paymentIntentId: paymentIntent.id,
          paymentStatus: 'completed',
          paymentMethod: 'card'
        });

        // Clear cart
        clearCart();

        // Call success callback
        onSuccess(order);
      }
    } catch (error) {
      onError(error.message || 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Information
        </label>
        <div className="bg-white p-3 border rounded-lg">
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-center justify-between text-sm text-blue-800">
          <span>Total Amount:</span>
          <span className="font-bold text-lg">{formatCurrency(orderData.total)}</span>
        </div>
      </div>

      <button
        type="submit"
        disabled={!stripe || isProcessing || !clientSecret}
        className="w-full bg-organic-primary text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Processing Payment...
          </div>
        ) : (
          `Pay ${formatCurrency(orderData.total)}`
        )}
      </button>

      <div className="text-xs text-gray-500 text-center">
        <p>🔒 Your payment information is secure and encrypted</p>
        <p>Powered by Stripe</p>
      </div>
    </form>
  );
}

export default function StripeCheckout({ orderData, onSuccess, onError }) {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm 
        orderData={orderData} 
        onSuccess={onSuccess} 
        onError={onError} 
      />
    </Elements>
  );
}