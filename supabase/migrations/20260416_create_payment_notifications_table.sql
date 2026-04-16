-- Create payment_notifications table for Mercado Pago webhook tracking
-- This ensures idempotence: prevents processing the same webhook multiple times

CREATE TABLE IF NOT EXISTS public.payment_notifications (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Mercado Pago info
  external_reference TEXT NOT NULL, -- order_id
  mercadopago_payment_id TEXT NOT NULL,
  
  -- Webhook data (store raw payload for debugging)
  webhook_type TEXT, -- payment, plan, subscription, invoice, etc.
  webhook_data JSONB,
  
  -- Processing status
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  
  -- Timestamps
  received_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Index for uniqueness
  UNIQUE(external_reference, mercadopago_payment_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_payment_notifications_external_ref ON public.payment_notifications(external_reference);
CREATE INDEX IF NOT EXISTS idx_payment_notifications_mp_payment_id ON public.payment_notifications(mercadopago_payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_notifications_processed ON public.payment_notifications(processed);
CREATE INDEX IF NOT EXISTS idx_payment_notifications_received_at ON public.payment_notifications(received_at);

-- Enable Row Level Security
ALTER TABLE public.payment_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (admin only)
-- In practice, this table should only be accessible to backend services
CREATE POLICY "Allow insert for all" ON public.payment_notifications
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow select for admin" ON public.payment_notifications
  FOR SELECT
  USING (false); -- By default, nobody can select. Override with JWT claims for admin.

-- Add comment to table
COMMENT ON TABLE public.payment_notifications IS 'Tracks Mercado Pago webhooks for idempotence. Prevents duplicate payment processing.';
COMMENT ON COLUMN public.payment_notifications.external_reference IS 'Order ID (used for reconciliation)';
COMMENT ON COLUMN public.payment_notifications.mercadopago_payment_id IS 'Payment ID from Mercado Pago';
COMMENT ON COLUMN public.payment_notifications.processed IS 'True once webhook has been processed';
