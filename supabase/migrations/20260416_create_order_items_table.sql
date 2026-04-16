-- Create order_items table for Mi Pastelería
-- This table stores individual items within each order

CREATE TABLE IF NOT EXISTS public.order_items (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign keys
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  variant_id UUID NOT NULL REFERENCES public.product_variants(id),
  
  -- Item details
  quantity INTEGER NOT NULL CHECK (quantity >= 1 AND quantity <= 10),
  price_cents INTEGER NOT NULL CHECK (price_cents > 0),
  custom_message TEXT CHECK (char_length(custom_message) <= 40),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Note: We store snapshot of price at order time for accounting
  -- If product price changes, this order keeps the original price
  CONSTRAINT fk_order FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_product FOREIGN KEY (product_id) REFERENCES public.products(id),
  CONSTRAINT fk_variant FOREIGN KEY (variant_id) REFERENCES public.product_variants(id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_variant_id ON public.order_items(variant_id);

-- Enable Row Level Security
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow users to view items from their orders only
CREATE POLICY "Allow select from user orders" ON public.order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND (auth.uid() = orders.user_id OR orders.user_id IS NULL)
    )
  );

-- Allow insert for any order (server-side validated)
CREATE POLICY "Allow insert for all" ON public.order_items
  FOR INSERT
  WITH CHECK (true);

-- Add comment to table
COMMENT ON TABLE public.order_items IS 'Individual items within each order. Stores snapshot of product/variant and quantity.';
COMMENT ON COLUMN public.order_items.order_id IS 'Reference to parent order';
COMMENT ON COLUMN public.order_items.product_id IS 'Product purchased';
COMMENT ON COLUMN public.order_items.variant_id IS 'Variant (size) selected';
COMMENT ON COLUMN public.order_items.price_cents IS 'Unit price in centavos ARS at time of order';
COMMENT ON COLUMN public.order_items.custom_message IS 'Personalized message on cake (max 40 chars)';
