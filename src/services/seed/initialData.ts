import { db } from '@/services/db/schema'
import { addToSyncQueue } from '@/services/sync/sync'
import type { MaterialCategory, Product, ProductCategory, ProductionStep } from '@/types/models'

function nowIso() {
  return new Date().toISOString()
}

function makeBaseRecord(userId: string) {
  const now = nowIso()
  return {
    id: crypto.randomUUID(),
    user_id: userId,
    created_at: now,
    updated_at: now,
    sync_status: 'pending' as const,
  }
}

function getSeedDisabledKey(userId: string) {
  return `bordados-disable-initial-seed:${userId}`
}

export function setInitialDataSeedDisabled(userId: string, disabled: boolean): void {
  if (disabled) {
    localStorage.setItem(getSeedDisabledKey(userId), 'true')
  } else {
    localStorage.removeItem(getSeedDisabledKey(userId))
  }
}

export function isInitialDataSeedDisabled(userId: string): boolean {
  return localStorage.getItem(getSeedDisabledKey(userId)) === 'true'
}

export async function ensureInitialData(userId: string): Promise<void> {
  if (isInitialDataSeedDisabled(userId)) return

  const [categoryCount, productCount, productionStepCount, materialCategoryCount] = await Promise.all([
    db.product_categories.where('user_id').equals(userId).filter(item => !item.deleted_at).count(),
    db.products.where('user_id').equals(userId).filter(item => !item.deleted_at).count(),
    db.production_steps.where('user_id').equals(userId).filter(item => !item.deleted_at).count(),
    db.material_categories.where('user_id').equals(userId).filter(item => !item.deleted_at).count(),
  ])

  let bastidorCategoryId: string | undefined
  let ecobagCategoryId: string | undefined

  if (categoryCount === 0) {
    const categories: ProductCategory[] = [
      { ...makeBaseRecord(userId), name: 'Bastidor', description: null },
      { ...makeBaseRecord(userId), name: 'Ecobag', description: null },
    ]

    await db.product_categories.bulkAdd(categories)
    await Promise.all(categories.map(category =>
      addToSyncQueue('product_categories', category.id, 'create', category)
    ))

    bastidorCategoryId = categories[0].id
    ecobagCategoryId = categories[1].id
  } else {
    const categories = await db.product_categories.where('user_id').equals(userId).toArray()
    bastidorCategoryId = categories.find(category => category.name.toLowerCase() === 'bastidor')?.id
    ecobagCategoryId = categories.find(category => category.name.toLowerCase() === 'ecobag')?.id
  }

  if (productCount === 0) {
    const products: Product[] = [
      {
        ...makeBaseRecord(userId),
        category_id: bastidorCategoryId || null,
        name: 'Bastidor 16cm',
        variation: '16cm',
        base_price: 45,
        average_production_days: 3,
        is_active: true,
        notes: null,
      },
      {
        ...makeBaseRecord(userId),
        category_id: bastidorCategoryId || null,
        name: 'Bastidor 20cm',
        variation: '20cm',
        base_price: 65,
        average_production_days: 3,
        is_active: true,
        notes: null,
      },
      {
        ...makeBaseRecord(userId),
        category_id: ecobagCategoryId || null,
        name: 'Ecobag bordada',
        variation: null,
        base_price: 55,
        average_production_days: 2,
        is_active: true,
        notes: null,
      },
    ]

    await db.products.bulkAdd(products)
    await Promise.all(products.map(product =>
      addToSyncQueue('products', product.id, 'create', product)
    ))
  }

  if (productionStepCount === 0) {
    const steps: ProductionStep[] = ['Arte recebida', 'Bordado iniciado', 'Embalado'].map((name, index) => ({
      ...makeBaseRecord(userId),
      name,
      sort_order: index + 1,
      is_active: true,
    }))

    await db.production_steps.bulkAdd(steps)
    await Promise.all(steps.map(step =>
      addToSyncQueue('production_steps', step.id, 'create', step)
    ))
  }

  if (materialCategoryCount === 0) {
    const categories: MaterialCategory[] = ['Bastidores', 'Linhas', 'Tecidos', 'Ecobags'].map(name => ({
      ...makeBaseRecord(userId),
      name,
      description: null,
    }))

    await db.material_categories.bulkAdd(categories)
    await Promise.all(categories.map(category =>
      addToSyncQueue('material_categories', category.id, 'create', category)
    ))
  }
}
