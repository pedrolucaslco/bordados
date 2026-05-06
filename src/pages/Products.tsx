import { useEffect, useState } from 'react'
import { useProductsStore } from '@/stores/products'
import type { Product, ProductCategory } from '@/types/models'

export default function ProductsPage() {
  const { products, categories, isLoading, fetchData, addProduct, updateProduct, deleteProduct, addCategory } = useProductsStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  // Form state - Product
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [variation, setVariation] = useState('')
  const [basePrice, setBasePrice] = useState('')
  const [avgProductionDays, setAvgProductionDays] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [notes, setNotes] = useState('')

  // Form state - Category
  const [categoryName, setCategoryName] = useState('')

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product)
      setName(product.name)
      setCategoryId(product.category_id || '')
      setVariation(product.variation || '')
      setBasePrice(product.base_price.toString())
      setAvgProductionDays(product.average_production_days?.toString() || '')
      setIsActive(product.is_active)
      setNotes(product.notes || '')
    } else {
      setEditingProduct(null)
      setName('')
      setCategoryId('')
      setVariation('')
      setBasePrice('')
      setAvgProductionDays('')
      setIsActive(true)
      setNotes('')
    }
    setIsModalOpen(true)
  }

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !basePrice) return

    const productData = {
      name,
      category_id: categoryId || null,
      variation: variation || null,
      base_price: parseFloat(basePrice),
      average_production_days: avgProductionDays ? parseInt(avgProductionDays) : null,
      is_active: isActive,
      notes
    }

    if (editingProduct) {
      await updateProduct(editingProduct.id, productData)
    } else {
      await addProduct(productData)
    }

    setIsModalOpen(false)
  }

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!categoryName.trim()) return

    await addCategory({ name: categoryName })
    setCategoryName('')
    setIsCategoryModalOpen(false)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      await deleteProduct(id)
    }
  }

  const getCategoryName = (id?: string | null) => {
    if (!id) return 'Sem categoria'
    return categories.find(c => c.id === id)?.name || 'Desconhecida'
  }

  return (
    <div className="p-4 pb-24">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Produtos</h2>
        <div className="flex gap-2">
          <button className="btn btn-outline" onClick={() => setIsCategoryModalOpen(true)}>
            + Categoria
          </button>
          <button className="btn btn-primary" onClick={() => openModal()}>
            Novo Produto
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center"><span className="loading loading-spinner loading-lg"></span></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(product => (
            <div key={product.id} className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="flex justify-between items-start">
                  <h2 className="card-title">{product.name}</h2>
                  <div className={`badge ${product.is_active ? 'badge-success' : 'badge-error'}`}>
                    {product.is_active ? 'Ativo' : 'Inativo'}
                  </div>
                </div>
                <p className="text-sm opacity-70">{getCategoryName(product.category_id)}</p>
                <div className="mt-2">
                  <span className="text-xl font-bold">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.base_price)}
                  </span>
                </div>
                {product.variation && <p className="text-sm mt-1">Variação: {product.variation}</p>}
                
                <div className="card-actions justify-end mt-4">
                  <button className="btn btn-sm btn-ghost" onClick={() => openModal(product)}>Editar</button>
                  <button className="btn btn-sm btn-error" onClick={() => handleDelete(product.id)}>Excluir</button>
                </div>
              </div>
            </div>
          ))}
          {products.length === 0 && (
            <div className="col-span-full text-center py-8 text-base-content/60">
              Nenhum produto cadastrado.
            </div>
          )}
        </div>
      )}

      {/* Product Modal */}
      {isModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">
              {editingProduct ? 'Editar Produto' : 'Novo Produto'}
            </h3>
            <form onSubmit={handleProductSubmit}>
              <div className="form-control mb-2">
                <label className="label"><span className="label-text">Nome *</span></label>
                <input type="text" className="input input-bordered" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-2">
                <div className="form-control">
                  <label className="label"><span className="label-text">Categoria</span></label>
                  <select className="select select-bordered" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
                    <option value="">Selecione...</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text">Preço Base (R$) *</span></label>
                  <input type="number" step="0.01" className="input input-bordered" value={basePrice} onChange={e => setBasePrice(e.target.value)} required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-2">
                <div className="form-control">
                  <label className="label"><span className="label-text">Variação/Tamanho</span></label>
                  <input type="text" className="input input-bordered" value={variation} onChange={e => setVariation(e.target.value)} />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text">Tempo Prod. (dias)</span></label>
                  <input type="number" className="input input-bordered" value={avgProductionDays} onChange={e => setAvgProductionDays(e.target.value)} />
                </div>
              </div>

              <div className="form-control mb-4">
                <label className="label cursor-pointer justify-start gap-4">
                  <span className="label-text">Produto Ativo</span> 
                  <input type="checkbox" className="toggle toggle-primary" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
                </label>
              </div>

              <div className="modal-action">
                <button type="button" className="btn" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {isCategoryModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Nova Categoria</h3>
            <form onSubmit={handleCategorySubmit}>
              <div className="form-control mb-4">
                <label className="label"><span className="label-text">Nome da Categoria *</span></label>
                <input type="text" className="input input-bordered" value={categoryName} onChange={e => setCategoryName(e.target.value)} required />
              </div>
              <div className="modal-action">
                <button type="button" className="btn" onClick={() => setIsCategoryModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Adicionar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
