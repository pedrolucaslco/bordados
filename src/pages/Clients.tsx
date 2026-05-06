import { useEffect, useState } from 'react'
import { useClientsStore } from '@/stores/clients'
import type { Client } from '@/types/models'

export default function ClientsPage() {
  const { clients, isLoading, fetchClients, addClient, updateClient, deleteClient } = useClientsStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Form state
  const [name, setName] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [instagram, setInstagram] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  const openModal = (client?: Client) => {
    if (client) {
      setEditingClient(client)
      setName(client.name)
      setWhatsapp(client.whatsapp || '')
      setInstagram(client.instagram || '')
      setAddress(client.address || '')
      setNotes(client.notes || '')
    } else {
      setEditingClient(null)
      setName('')
      setWhatsapp('')
      setInstagram('')
      setAddress('')
      setNotes('')
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    const clientData = {
      name,
      whatsapp,
      instagram,
      address,
      notes
    }

    if (editingClient) {
      await updateClient(editingClient.id, clientData)
    } else {
      await addClient(clientData)
    }

    setIsModalOpen(false)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      await deleteClient(id)
    }
  }

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.whatsapp?.includes(searchTerm)
  )

  return (
    <div className="p-4 pb-24">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Clientes</h2>
        <button className="btn btn-primary" onClick={() => openModal()}>
          Novo Cliente
        </button>
      </div>

      <div className="form-control mb-6">
        <div className="input-group">
          <input 
            type="text" 
            placeholder="Buscar por nome ou WhatsApp..." 
            className="input input-bordered w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center"><span className="loading loading-spinner loading-lg"></span></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map(client => (
            <div key={client.id} className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">{client.name}</h2>
                {client.whatsapp && <p className="text-sm">WhatsApp: {client.whatsapp}</p>}
                {client.instagram && <p className="text-sm">Instagram: {client.instagram}</p>}
                <div className="card-actions justify-end mt-4">
                  <button className="btn btn-sm btn-ghost" onClick={() => openModal(client)}>Editar</button>
                  <button className="btn btn-sm btn-error" onClick={() => handleDelete(client.id)}>Excluir</button>
                </div>
              </div>
            </div>
          ))}
          {filteredClients.length === 0 && (
            <div className="col-span-full text-center py-8 text-base-content/60">
              Nenhum cliente encontrado.
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">
              {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="form-control mb-2">
                <label className="label"><span className="label-text">Nome *</span></label>
                <input type="text" className="input input-bordered" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="form-control mb-2">
                <label className="label"><span className="label-text">WhatsApp</span></label>
                <input type="text" className="input input-bordered" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} />
              </div>
              <div className="form-control mb-2">
                <label className="label"><span className="label-text">Instagram</span></label>
                <input type="text" className="input input-bordered" value={instagram} onChange={e => setInstagram(e.target.value)} />
              </div>
              <div className="form-control mb-2">
                <label className="label"><span className="label-text">Endereço</span></label>
                <input type="text" className="input input-bordered" value={address} onChange={e => setAddress(e.target.value)} />
              </div>
              <div className="form-control mb-4">
                <label className="label"><span className="label-text">Observações</span></label>
                <textarea className="textarea textarea-bordered" value={notes} onChange={e => setNotes(e.target.value)}></textarea>
              </div>
              <div className="modal-action">
                <button type="button" className="btn" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
