import { create } from 'zustand'
import { db } from '@/services/db/schema'
import { addToSyncQueue } from '@/services/sync/sync'
import type { Product, ProductCategory } from '@/types/models'
import { useAuthStore } from '@/stores/auth'

interface ProductsState {
  products: Product[]
  categories: ProductCategory[]
  isLoading: boolean
  error: string | null
  
  fetchData: () => Promise<void>
  
  addProduct: (product: Omit<Product, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>
  deleteProduct: (id: string) => Promise<void>
  
  addCategory: (category: Omit<ProductCategory, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>
  updateCategory: (id: string, category: Partial<ProductCategory>) => Promise<void>
  deleteCategory: (id: string) => Promise<void>
}

export const useProductsStore = create<ProductsState>((set, get) => ({
  products: [],
  categories: [],
  isLoading: false,
  error: null,

  fetchData: async () => {
    set({ isLoading: true, error: null })
    try {
      const [products, categories] = await Promise.all([
        db.products.filter(p => !p.deleted_at).reverse().sortBy('updated_at'),
        db.product_categories.filter(c => !c.deleted_at).reverse().sortBy('updated_at')
      ])
      set({ products, categories, isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  addProduct: async (productData) => {
    const userId = useAuthStore.getState().userId
    if (!userId) throw new Error('User not authenticated')

    const now = new Date().toISOString()
    const id = crypto.randomUUID()
    
    const newProduct: Product = {
      ...productData,
      id,
      user_id: userId,
      created_at: now,
      updated_at: now,
      sync_status: 'pending'
    }

    await db.products.add(newProduct)
    await addToSyncQueue('products', id, 'create', newProduct)
    
    get().fetchData()
  },

  updateProduct: async (id, productData) => {
    const now = new Date().toISOString()
    
    await db.products.update(id, {
      ...productData,
      updated_at: now,
      sync_status: 'pending'
    })

    const updatedProduct = await db.products.get(id)
    if (updatedProduct) {
      await addToSyncQueue('products', id, 'update', updatedProduct)
    }

    get().fetchData()
  },

  deleteProduct: async (id) => {
    const now = new Date().toISOString()
    
    await db.products.update(id, {
      deleted_at: now,
      updated_at: now,
      sync_status: 'pending'
    })

    await addToSyncQueue('products', id, 'delete', null)

    get().fetchData()
  },

  addCategory: async (categoryData) => {
    const userId = useAuthStore.getState().userId
    if (!userId) throw new Error('User not authenticated')

    const now = new Date().toISOString()
    const id = crypto.randomUUID()
    
    const newCategory: ProductCategory = {
      ...categoryData,
      id,
      user_id: userId,
      created_at: now,
      updated_at: now,
      sync_status: 'pending'
    }

    await db.product_categories.add(newCategory)
    await addToSyncQueue('product_categories', id, 'create', newCategory)
    
    get().fetchData()
  },

  updateCategory: async (id, categoryData) => {
    const now = new Date().toISOString()
    
    await db.product_categories.update(id, {
      ...categoryData,
      updated_at: now,
      sync_status: 'pending'
    })

    const updatedCategory = await db.product_categories.get(id)
    if (updatedCategory) {
      await addToSyncQueue('product_categories', id, 'update', updatedCategory)
    }

    get().fetchData()
  },

  deleteCategory: async (id) => {
    const now = new Date().toISOString()
    const productsInCategory = await db.products
      .where('category_id')
      .equals(id)
      .filter(product => !product.deleted_at)
      .toArray()
    
    await db.product_categories.update(id, {
      deleted_at: now,
      updated_at: now,
      sync_status: 'pending'
    })
    await Promise.all(productsInCategory.map(async product => {
      await db.products.update(product.id, {
        category_id: null,
        updated_at: now,
        sync_status: 'pending',
      })
      const updatedProduct = await db.products.get(product.id)
      if (updatedProduct) {
        await addToSyncQueue('products', product.id, 'update', updatedProduct)
      }
    }))

    await addToSyncQueue('product_categories', id, 'delete', null)

    get().fetchData()
  }
}))
