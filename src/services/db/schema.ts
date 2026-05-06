import Dexie, { Table } from 'dexie'
import * as Models from '@/types/models'

export class BordadosDB extends Dexie {
  clients!: Table<Models.Client, string>
  product_categories!: Table<Models.ProductCategory, string>
  products!: Table<Models.Product, string>
  orders!: Table<Models.Order, string>
  order_items!: Table<Models.OrderItem, string>
  production_steps!: Table<Models.ProductionStep, string>
  order_production_steps!: Table<Models.OrderProductionStep, string>
  material_categories!: Table<Models.MaterialCategory, string>
  materials!: Table<Models.Material, string>
  material_purchases!: Table<Models.MaterialPurchase, string>
  material_reservations!: Table<Models.MaterialReservation, string>
  payments!: Table<Models.Payment, string>
  sync_queue!: Table<Models.SyncQueueItem, string>

  constructor() {
    super('bordados-db')

    this.version(1).stores({
      clients:
        'id, user_id, name, whatsapp, updated_at, sync_status, deleted_at',
      product_categories:
        'id, user_id, name, updated_at, sync_status, deleted_at',
      products:
        'id, user_id, category_id, name, is_active, updated_at, sync_status, deleted_at',
      orders:
        'id, user_id, client_id, status, payment_status, due_date, updated_at, sync_status, deleted_at',
      order_items:
        'id, user_id, order_id, product_id, updated_at, sync_status, deleted_at',
      production_steps:
        'id, user_id, sort_order, is_active, updated_at, sync_status, deleted_at',
      order_production_steps:
        'id, user_id, order_id, production_step_id, is_completed, updated_at, sync_status, deleted_at',
      material_categories:
        'id, user_id, name, updated_at, sync_status, deleted_at',
      materials:
        'id, user_id, category_id, name, is_active, updated_at, sync_status, deleted_at',
      material_purchases:
        'id, user_id, material_id, purchase_date, updated_at, sync_status, deleted_at',
      material_reservations:
        'id, user_id, order_id, order_item_id, material_id, status, updated_at, sync_status, deleted_at',
      payments:
        'id, user_id, order_id, payment_date, updated_at, sync_status, deleted_at',
      sync_queue:
        'id, table_name, record_id, operation, status, created_at, updated_at',
    })
  }
}

export const db = new BordadosDB()
