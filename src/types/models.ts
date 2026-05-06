// Auth & User
export interface Profile {
  id: string
  user_id: string
  name: string
  business_name?: string | null
  whatsapp?: string | null
  created_at: string
  updated_at: string
}

// Clients
export interface Client {
  id: string
  user_id: string
  name: string
  whatsapp?: string | null
  instagram?: string | null
  address?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
  deleted_at?: string | null
  sync_status?: 'pending' | 'synced' | 'error'
}

// Product Categories
export interface ProductCategory {
  id: string
  user_id: string
  name: string
  description?: string | null
  created_at: string
  updated_at: string
  deleted_at?: string | null
  sync_status?: 'pending' | 'synced' | 'error'
}

// Products
export interface Product {
  id: string
  user_id: string
  category_id?: string | null
  name: string
  variation?: string | null
  base_price: number
  average_production_days?: number | null
  is_active: boolean
  notes?: string | null
  created_at: string
  updated_at: string
  deleted_at?: string | null
  sync_status?: 'pending' | 'synced' | 'error'
}

// Orders
export type OrderStatus =
  | 'quote'
  | 'awaiting_confirmation'
  | 'awaiting_payment'
  | 'in_production'
  | 'ready'
  | 'delivered'
  | 'cancelled'

export type PaymentStatus =
  | 'unpaid'
  | 'deposit_paid'
  | 'partially_paid'
  | 'paid'

export interface Order {
  id: string
  user_id: string
  client_id: string
  order_number?: string | null
  status: OrderStatus
  payment_status: PaymentStatus
  order_date: string
  due_date?: string | null
  due_time?: string | null
  total_amount: number
  paid_amount: number
  remaining_amount: number
  notes?: string | null
  created_at: string
  updated_at: string
  deleted_at?: string | null
  sync_status?: 'pending' | 'synced' | 'error'
}

// Order Items
export interface OrderItem {
  id: string
  user_id: string
  order_id: string
  product_id: string
  quantity: number
  embroidery_text?: string | null
  desired_colors?: string | null
  theme?: string | null
  notes?: string | null
  unit_price: number
  total_price: number
  created_at: string
  updated_at: string
  deleted_at?: string | null
  sync_status?: 'pending' | 'synced' | 'error'
}

// Production Steps
export interface ProductionStep {
  id: string
  user_id: string
  name: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
  deleted_at?: string | null
  sync_status?: 'pending' | 'synced' | 'error'
}

// Order Production Steps
export interface OrderProductionStep {
  id: string
  user_id: string
  order_id: string
  production_step_id: string
  is_completed: boolean
  completed_at?: string | null
  created_at: string
  updated_at: string
  deleted_at?: string | null
  sync_status?: 'pending' | 'synced' | 'error'
}

// Material Categories
export interface MaterialCategory {
  id: string
  user_id: string
  name: string
  description?: string | null
  created_at: string
  updated_at: string
  deleted_at?: string | null
  sync_status?: 'pending' | 'synced' | 'error'
}

// Materials
export type MaterialUnit =
  | 'unit'
  | 'meter'
  | 'roll'
  | 'package'
  | 'box'
  | 'gram'

export interface Material {
  id: string
  user_id: string
  category_id?: string | null
  name: string
  unit: MaterialUnit
  total_stock: number
  minimum_stock: number
  average_cost: number
  supplier?: string | null
  is_active: boolean
  notes?: string | null
  created_at: string
  updated_at: string
  deleted_at?: string | null
  sync_status?: 'pending' | 'synced' | 'error'
}

// Material Purchases
export interface MaterialPurchase {
  id: string
  user_id: string
  material_id: string
  quantity: number
  total_cost: number
  unit_cost: number
  purchase_date: string
  supplier?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
  deleted_at?: string | null
  sync_status?: 'pending' | 'synced' | 'error'
}

// Material Reservations
export type MaterialReservationStatus =
  | 'planned'
  | 'reserved'
  | 'consumed'
  | 'cancelled'

export interface MaterialReservation {
  id: string
  user_id: string
  order_id: string
  order_item_id?: string | null
  material_id: string
  quantity: number
  status: MaterialReservationStatus
  reserved_at?: string | null
  consumed_at?: string | null
  cancelled_at?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
  deleted_at?: string | null
  sync_status?: 'pending' | 'synced' | 'error'
}

// Payments
export type PaymentMethod =
  | 'cash'
  | 'pix'
  | 'credit_card'
  | 'debit_card'
  | 'bank_transfer'
  | 'other'

export interface Payment {
  id: string
  user_id: string
  order_id: string
  amount: number
  method: PaymentMethod
  payment_date: string
  notes?: string | null
  created_at: string
  updated_at: string
  deleted_at?: string | null
  sync_status?: 'pending' | 'synced' | 'error'
}

// Sync Queue (local only)
export type SyncOperation = 'create' | 'update' | 'delete'
export type SyncStatus = 'pending' | 'synced' | 'error'

export interface SyncQueueItem {
  id: string
  table_name: string
  record_id: string
  operation: SyncOperation
  payload: any
  status: 'pending' | 'processing' | 'synced' | 'error'
  error_message?: string | null
  retry_count: number
  created_at: string
  updated_at: string
}
