interface PaddleCheckoutOptions {
  items: { priceId: string; quantity: number }[];
  customer?: { email: string; [key: string]: any };
  customData?: Record<string, any>;
  successURL?: string;
  passthrough?: string;
  [key: string]: any;
}

interface PaddleCheckout {
  open(options: PaddleCheckoutOptions): void;
}

interface PaddleInstance {
  Checkout: PaddleCheckout;
  [key: string]: any;
}

interface Window {
  Paddle?: PaddleInstance;
} 