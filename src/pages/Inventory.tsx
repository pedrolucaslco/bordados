import { useEffect, useState } from 'react'
import { useInventoryStore } from '@/stores/inventory'
import type { MaterialUnit } from '@/types/models'

const unitLabels: Record<MaterialUnit, string> = {
  unit: 'un',
  meter: 'm',
  roll: 'rolo',
  package: 'pacote',
  box: 'caixa',
  gram: 'g',
}

export default function InventoryPage() {
  const {
    materials,
    categories,
    isLoading,
    fetchInventory,
    addMaterial,
    updateMaterial,
    deleteMaterial,
    addMaterialPurchase,
  } = useInventoryStore()

  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false)
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false)
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null)
  const [purchaseMaterialId, setPurchaseMaterialId] = useState('')

  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [unit, setUnit] = useState<MaterialUnit>('unit')
  const [totalStock, setTotalStock] = useState('0')
  const [minimumStock, setMinimumStock] = useState('0')
  const [averageCost, setAverageCost] = useState('0')
  const [supplier, setSupplier] = useState('')

  const [purchaseQuantity, setPurchaseQuantity] = useState('')
  const [purchaseTotalCost, setPurchaseTotalCost] = useState('')
  const [purchaseSupplier, setPurchaseSupplier] = useState('')

  useEffect(() => {
    fetchInventory()
  }, [fetchInventory])

  const openMaterialModal = (materialId?: string) => {
    const material = materialId ? materials.find(item => item.id === materialId) : null
    setEditingMaterialId(material?.id || null)
    setName(material?.name || '')
    setCategoryId(material?.category_id || '')
    setUnit(material?.unit || 'unit')
    setTotalStock(String(material?.total_stock ?? 0))
    setMinimumStock(String(material?.minimum_stock ?? 0))
    setAverageCost(String(material?.average_cost ?? 0))
    setSupplier(material?.supplier || '')
    setIsMaterialModalOpen(true)
  }

  const openPurchaseModal = (materialId: string) => {
    setPurchaseMaterialId(materialId)
    setPurchaseQuantity('')
    setPurchaseTotalCost('')
    setPurchaseSupplier(materials.find(material => material.id === materialId)?.supplier || '')
    setIsPurchaseModalOpen(true)
  }

  const handleMaterialSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const materialData = {
      name,
      category_id: categoryId || null,
      unit,
      total_stock: Number(totalStock || 0),
      minimum_stock: Number(minimumStock || 0),
      average_cost: Number(averageCost || 0),
      supplier: supplier || null,
      is_active: true,
      notes: null,
    }

    if (editingMaterialId) {
      await updateMaterial(editingMaterialId, materialData)
    } else {
      await addMaterial(materialData)
    }
    setIsMaterialModalOpen(false)
  }

  const handlePurchaseSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!purchaseMaterialId) return

    await addMaterialPurchase({
      material_id: purchaseMaterialId,
      quantity: Number(purchaseQuantity || 0),
      total_cost: Number(purchaseTotalCost || 0),
      purchase_date: new Date().toISOString().slice(0, 10),
      supplier: purchaseSupplier || null,
      notes: null,
    })
    setIsPurchaseModalOpen(false)
  }

  const getCategoryName = (id?: string | null) => {
    if (!id) return 'Sem categoria'
    return categories.find(category => category.id === id)?.name || 'Sem categoria'
  }

  return (
    <div className="p-4 pb-24">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Estoque</h2>
          <p className="text-sm text-base-content/60">Materiais, compras e disponibilidade</p>
        </div>
        <button className="btn btn-primary" onClick={() => openMaterialModal()}>
          Novo
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center"><span className="loading loading-spinner loading-lg"></span></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {materials.map(material => {
            const isLow = material.available_stock <= material.minimum_stock
            return (
              <div key={material.id} className="card bg-base-100 border border-base-300">
                <div className="card-body p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold">{material.name}</h3>
                      <p className="text-sm text-base-content/60">{getCategoryName(material.category_id)}</p>
                    </div>
                    {isLow && <span className="badge badge-warning">Baixo</span>}
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-box bg-base-200 p-2">
                      <div className="text-xs text-base-content/60">Total</div>
                      <div className="font-bold">{material.total_stock} {unitLabels[material.unit]}</div>
                    </div>
                    <div className="rounded-box bg-base-200 p-2">
                      <div className="text-xs text-base-content/60">Reservado</div>
                      <div className="font-bold">{material.reserved_stock}</div>
                    </div>
                    <div className="rounded-box bg-base-200 p-2">
                      <div className="text-xs text-base-content/60">Disponivel</div>
                      <div className={`font-bold ${isLow ? 'text-warning' : ''}`}>{material.available_stock}</div>
                    </div>
                  </div>

                  <div className="card-actions justify-end">
                    <button className="btn btn-sm btn-ghost" onClick={() => openMaterialModal(material.id)}>Editar</button>
                    <button className="btn btn-sm btn-outline" onClick={() => openPurchaseModal(material.id)}>Compra</button>
                    <button className="btn btn-sm btn-error" onClick={() => deleteMaterial(material.id)}>Excluir</button>
                  </div>
                </div>
              </div>
            )
          })}

          {materials.length === 0 && (
            <div className="col-span-full text-center py-12 text-base-content/60">
              Nenhum material cadastrado.
            </div>
          )}
        </div>
      )}

      {isMaterialModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">{editingMaterialId ? 'Editar Material' : 'Novo Material'}</h3>
            <form onSubmit={handleMaterialSubmit}>
              <fieldset className="fieldset mb-2">
                <label className="label" htmlFor="material-name">Nome *</label>
                <input id="material-name" className="input w-full" value={name} onChange={event => setName(event.target.value)} required />
              </fieldset>
              <div className="grid grid-cols-2 gap-4 mb-2">
                <fieldset className="fieldset">
                  <label className="label" htmlFor="material-category">Categoria</label>
                  <select id="material-category" className="select w-full" value={categoryId} onChange={event => setCategoryId(event.target.value)}>
                    <option value="">Sem categoria</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </fieldset>
                <fieldset className="fieldset">
                  <label className="label" htmlFor="material-unit">Unidade</label>
                  <select id="material-unit" className="select w-full" value={unit} onChange={event => setUnit(event.target.value as MaterialUnit)}>
                    {Object.entries(unitLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </fieldset>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-2">
                <fieldset className="fieldset">
                  <label className="label" htmlFor="material-total">Total</label>
                  <input id="material-total" type="number" step="0.01" className="input w-full" value={totalStock} onChange={event => setTotalStock(event.target.value)} />
                </fieldset>
                <fieldset className="fieldset">
                  <label className="label" htmlFor="material-minimum">Minimo</label>
                  <input id="material-minimum" type="number" step="0.01" className="input w-full" value={minimumStock} onChange={event => setMinimumStock(event.target.value)} />
                </fieldset>
                <fieldset className="fieldset">
                  <label className="label" htmlFor="material-cost">Custo medio</label>
                  <input id="material-cost" type="number" step="0.01" className="input w-full" value={averageCost} onChange={event => setAverageCost(event.target.value)} />
                </fieldset>
              </div>
              <fieldset className="fieldset mb-4">
                <label className="label" htmlFor="material-supplier">Fornecedor</label>
                <input id="material-supplier" className="input w-full" value={supplier} onChange={event => setSupplier(event.target.value)} />
              </fieldset>
              <div className="modal-action">
                <button type="button" className="btn" onClick={() => setIsMaterialModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isPurchaseModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Registrar compra</h3>
            <form onSubmit={handlePurchaseSubmit}>
              <fieldset className="fieldset mb-2">
                <label className="label" htmlFor="purchase-quantity">Quantidade *</label>
                <input id="purchase-quantity" type="number" step="0.01" className="input w-full" value={purchaseQuantity} onChange={event => setPurchaseQuantity(event.target.value)} required />
              </fieldset>
              <fieldset className="fieldset mb-2">
                <label className="label" htmlFor="purchase-total-cost">Custo total *</label>
                <input id="purchase-total-cost" type="number" step="0.01" className="input w-full" value={purchaseTotalCost} onChange={event => setPurchaseTotalCost(event.target.value)} required />
              </fieldset>
              <fieldset className="fieldset mb-4">
                <label className="label" htmlFor="purchase-supplier">Fornecedor</label>
                <input id="purchase-supplier" className="input w-full" value={purchaseSupplier} onChange={event => setPurchaseSupplier(event.target.value)} />
              </fieldset>
              <div className="modal-action">
                <button type="button" className="btn" onClick={() => setIsPurchaseModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Registrar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
