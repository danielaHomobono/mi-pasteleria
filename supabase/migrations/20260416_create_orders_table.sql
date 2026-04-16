-- Create orders table for Mi Pastelería
-- This table stores all customer orders

CREATE TABLE IF NOT EXISTS public.orders (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Customer info
  user_id UUID,
  shipping_name TEXT NOT NULL,
  shipping_phone TEXT NOT NULL,
  shipping_email TEXT NOT NULL,
  
  -- Pickup details
  pickup_date DATE NOT NULL,
  pickup_time TIME NOT NULL,
  
  -- Payment info
  total_amount_cents INTEGER NOT NULL CHECK (total_amount_cents > 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('mercadopago', 'transfer', 'cash')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  
  -- Mercado Pago info
  mercadopago_payment_id TEXT,
  mercadopago_init_point TEXT,
  
  -- Order status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_production', 'ready', 'completed', 'cancelled')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign key
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_pickup_date ON public.orders(pickup_date);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_email ON public.orders(shipping_email);

-- Enable Row Level Security
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow anyone to insert their own orders (for guest checkout and authenticated users)
CREATE POLICY "Allow insert for all" ON public.orders
  FOR INSERT
  WITH CHECK (true);

-- Allow users to view their own orders
CREATE POLICY "Allow select own orders" ON public.orders
  FOR SELECT
  USING (
    auth.uid() = user_id OR user_id IS NULL
  );

-- Allow users to update their own orders (only admin can update in practice)
CREATE POLICY "Allow update own orders" ON public.orders
  FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL)
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at_trigger
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION update_orders_updated_at();

-- Add comment to table
COMMENT ON TABLE public.orders IS 'Customer orders for Mi Pastelería. Contains shipping info, pickup details, and payment status.';
COMMENT ON COLUMN public.orders.id IS 'Unique order identifier';
COMMENT ON COLUMN public.orders.user_id IS 'Optional: authenticated user; NULL for guest checkout';
COMMENT ON COLUMN public.orders.total_amount_cents IS 'Total order amount in centavos ARS (e.g., 150050 = $1.500,50)';
COMMENT ON COLUMN public.orders.payment_method IS 'Payment method selected: mercadopago, transfer, or cash';
COMMENT ON COLUMN public.orders.status IS 'Order workflow status';
