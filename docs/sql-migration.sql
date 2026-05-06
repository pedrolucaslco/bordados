-- Bordados POC - Supabase SQL Migration
-- Copy and paste this entire file into the SQL Editor of your Supabase project
-- Then execute it

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PROFILES / USERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  business_name text,
  whatsapp text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own profile"
  ON public.profiles
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- CLIENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.clients (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  whatsapp text,
  instagram text,
  address text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX idx_clients_user_id ON public.clients(user_id);
CREATE INDEX idx_clients_name ON public.clients(name);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own clients"
  ON public.clients
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- PRODUCT CATEGORIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.product_categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX idx_product_categories_user_id ON public.product_categories(user_id);

ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own product categories"
  ON public.product_categories
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- PRODUCTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.product_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  variation text,
  base_price numeric(10,2) NOT NULL DEFAULT 0,
  average_production_days integer,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX idx_products_user_id ON public.products(user_id);
CREATE INDEX idx_products_category_id ON public.products(category_id);
CREATE INDEX idx_products_is_active ON public.products(is_active);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own products"
  ON public.products
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- ORDERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  order_number text,
  status text NOT NULL DEFAULT 'quote' CHECK (status IN ('quote', 'awaiting_confirmation', 'awaiting_payment', 'in_production', 'ready', 'delivered', 'cancelled')),
  payment_status text NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'deposit_paid', 'partially_paid', 'paid')),
  order_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  due_time time,
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  paid_amount numeric(10,2) NOT NULL DEFAULT 0,
  remaining_amount numeric(10,2) NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_client_id ON public.orders(client_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_due_date ON public.orders(due_date);
CREATE INDEX idx_orders_payment_status ON public.orders(payment_status);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own orders"
  ON public.orders
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- ORDER ITEMS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity numeric(10,2) NOT NULL DEFAULT 1,
  embroidery_text text,
  desired_colors text,
  theme text,
  notes text,
  unit_price numeric(10,2) NOT NULL DEFAULT 0,
  total_price numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX idx_order_items_user_id ON public.order_items(user_id);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_order_items_product_id ON public.order_items(product_id);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own order items"
  ON public.order_items
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- PRODUCTION STEPS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.production_steps (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX idx_production_steps_user_id ON public.production_steps(user_id);
CREATE INDEX idx_production_steps_sort_order ON public.production_steps(sort_order);

ALTER TABLE public.production_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own production steps"
  ON public.production_steps
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- ORDER PRODUCTION STEPS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.order_production_steps (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  production_step_id uuid NOT NULL REFERENCES public.production_steps(id) ON DELETE RESTRICT,
  is_completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX idx_order_production_steps_user_id ON public.order_production_steps(user_id);
CREATE INDEX idx_order_production_steps_order_id ON public.order_production_steps(order_id);

ALTER TABLE public.order_production_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own order production steps"
  ON public.order_production_steps
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- MATERIAL CATEGORIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.material_categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX idx_material_categories_user_id ON public.material_categories(user_id);

ALTER TABLE public.material_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own material categories"
  ON public.material_categories
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- MATERIALS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.materials (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.material_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  unit text NOT NULL DEFAULT 'unit' CHECK (unit IN ('unit', 'meter', 'roll', 'package', 'box', 'gram')),
  total_stock numeric(10,2) NOT NULL DEFAULT 0,
  minimum_stock numeric(10,2) NOT NULL DEFAULT 0,
  average_cost numeric(10,2) NOT NULL DEFAULT 0,
  supplier text,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX idx_materials_user_id ON public.materials(user_id);
CREATE INDEX idx_materials_category_id ON public.materials(category_id);
CREATE INDEX idx_materials_is_active ON public.materials(is_active);

ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own materials"
  ON public.materials
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- MATERIAL PURCHASES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.material_purchases (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  material_id uuid NOT NULL REFERENCES public.materials(id) ON DELETE RESTRICT,
  quantity numeric(10,2) NOT NULL,
  total_cost numeric(10,2) NOT NULL,
  unit_cost numeric(10,2) NOT NULL,
  purchase_date date NOT NULL DEFAULT CURRENT_DATE,
  supplier text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX idx_material_purchases_user_id ON public.material_purchases(user_id);
CREATE INDEX idx_material_purchases_material_id ON public.material_purchases(material_id);

ALTER TABLE public.material_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own material purchases"
  ON public.material_purchases
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- MATERIAL RESERVATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.material_reservations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  order_item_id uuid REFERENCES public.order_items(id) ON DELETE SET NULL,
  material_id uuid NOT NULL REFERENCES public.materials(id) ON DELETE RESTRICT,
  quantity numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'reserved', 'consumed', 'cancelled')),
  reserved_at timestamptz,
  consumed_at timestamptz,
  cancelled_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX idx_material_reservations_user_id ON public.material_reservations(user_id);
CREATE INDEX idx_material_reservations_order_id ON public.material_reservations(order_id);
CREATE INDEX idx_material_reservations_material_id ON public.material_reservations(material_id);
CREATE INDEX idx_material_reservations_status ON public.material_reservations(status);

ALTER TABLE public.material_reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own material reservations"
  ON public.material_reservations
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- PAYMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  method text NOT NULL DEFAULT 'pix' CHECK (method IN ('cash', 'pix', 'credit_card', 'debit_card', 'bank_transfer', 'other')),
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_order_id ON public.payments(order_id);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own payments"
  ON public.payments
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Note: Seeds will be user-specific after they sign up
-- To add initial product categories and production steps for a user,
-- run similar INSERT statements after user signup in your app

-- Example seed function (optional, for admin setup):
CREATE OR REPLACE FUNCTION seed_initial_data(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert product categories
  INSERT INTO public.product_categories (user_id, name, sort_order) VALUES
    (p_user_id, 'Bastidor', 1),
    (p_user_id, 'Ecobag', 2)
  ON CONFLICT DO NOTHING;

  -- Insert products
  INSERT INTO public.products (user_id, name, base_price, average_production_days, is_active) VALUES
    (p_user_id, 'Bastidor 16cm', 45.00, 3, true),
    (p_user_id, 'Bastidor 20cm', 65.00, 3, true),
    (p_user_id, 'Ecobag bordada', 55.00, 2, true)
  ON CONFLICT DO NOTHING;

  -- Insert production steps
  INSERT INTO public.production_steps (user_id, name, sort_order, is_active) VALUES
    (p_user_id, 'Arte recebida', 1, true),
    (p_user_id, 'Arte aprovada', 2, true),
    (p_user_id, 'Material separado', 3, true),
    (p_user_id, 'Bordado iniciado', 4, true),
    (p_user_id, 'Bordado finalizado', 5, true),
    (p_user_id, 'Revisado', 6, true),
    (p_user_id, 'Embalado', 7, true)
  ON CONFLICT DO NOTHING;

  -- Insert material categories
  INSERT INTO public.material_categories (user_id, name) VALUES
    (p_user_id, 'Bastidores'),
    (p_user_id, 'Tecidos'),
    (p_user_id, 'Linhas'),
    (p_user_id, 'Agulhas'),
    (p_user_id, 'Embalagens'),
    (p_user_id, 'Ecobags')
  ON CONFLICT DO NOTHING;
END;
$$;

-- ============================================================================
-- HELPFUL FUNCTIONS
-- ============================================================================

-- Get available stock for a material (total_stock - reserved_stock)
CREATE OR REPLACE FUNCTION get_available_stock(p_material_id uuid)
RETURNS numeric
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(m.total_stock, 0) - COALESCE(
    (SELECT SUM(quantity) FROM public.material_reservations 
     WHERE material_id = p_material_id AND status = 'reserved'),
    0
  )
  FROM public.materials m
  WHERE m.id = p_material_id;
$$;

-- Trigger to update order remaining_amount when paid_amount changes
CREATE OR REPLACE FUNCTION update_order_remaining()
RETURNS TRIGGER AS $$
BEGIN
  NEW.remaining_amount := NEW.total_amount - NEW.paid_amount;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_order_remaining ON public.orders;
CREATE TRIGGER trigger_update_order_remaining
BEFORE INSERT OR UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION update_order_remaining();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_updated_at_clients ON public.clients;
CREATE TRIGGER trigger_update_updated_at_clients BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_update_updated_at_orders ON public.orders;
CREATE TRIGGER trigger_update_updated_at_orders BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_update_updated_at_order_items ON public.order_items;
CREATE TRIGGER trigger_update_updated_at_order_items BEFORE UPDATE ON public.order_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_update_updated_at_products ON public.products;
CREATE TRIGGER trigger_update_updated_at_products BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_update_updated_at_materials ON public.materials;
CREATE TRIGGER trigger_update_updated_at_materials BEFORE UPDATE ON public.materials FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_update_updated_at_material_reservations ON public.material_reservations;
CREATE TRIGGER trigger_update_updated_at_material_reservations BEFORE UPDATE ON public.material_reservations FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_update_updated_at_payments ON public.payments;
CREATE TRIGGER trigger_update_updated_at_payments BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
