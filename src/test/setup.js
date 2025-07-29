import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Firebase
const mockFirebase = {
  auth: {
    currentUser: null,
    onAuthStateChanged: vi.fn(),
    signInWithEmailAndPassword: vi.fn(),
    createUserWithEmailAndPassword: vi.fn(),
    signOut: vi.fn(),
  },
  firestore: {
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        get: vi.fn(() => Promise.resolve({ 
          exists: true, 
          data: () => ({ id: '1', name: 'Test Product' }) 
        })),
        set: vi.fn(() => Promise.resolve()),
        update: vi.fn(() => Promise.resolve()),
        delete: vi.fn(() => Promise.resolve()),
      })),
      get: vi.fn(() => Promise.resolve({ 
        docs: [
          { id: '1', data: () => ({ name: 'Test Product', price: 299 }) }
        ] 
      })),
      add: vi.fn(() => Promise.resolve({ id: 'new-doc-id' })),
    })),
  },
};

// Mock Stripe
global.Stripe = vi.fn(() => ({
  elements: vi.fn(() => ({
    create: vi.fn(() => ({
      mount: vi.fn(),
      unmount: vi.fn(),
      on: vi.fn(),
    })),
  })),
  confirmCardPayment: vi.fn(() => Promise.resolve({
    paymentIntent: { status: 'succeeded' }
  })),
}));

// Mock environment variables
vi.mock('../config/stripe', () => ({
  default: Promise.resolve(global.Stripe())
}));

// Mock Firebase modules
vi.mock('../firebase/firebase', () => ({
  auth: mockFirebase.auth,
  db: mockFirebase.firestore,
  default: mockFirebase,
}));

// Mock React Router
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({ id: '1' }),
    useLocation: () => ({ pathname: '/' }),
  };
});

global.firebase = mockFirebase;