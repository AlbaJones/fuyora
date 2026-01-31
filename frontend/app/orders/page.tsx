'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Package, Clock, CheckCircle, XCircle } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export default function OrdersPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadOrders()
    }
  }, [user])

  async function loadOrders() {
    try {
      setLoading(true)
      const response = await api.get('/orders')
      setOrders(response.data || [])
    } catch (error) {
      console.error('Failed to load orders:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCancel(orderId: string) {
    if (!confirm('Deseja realmente cancelar este pedido?')) return

    try {
      await api.post(`/orders/${orderId}/cancel`)
      loadOrders()
    } catch (error) {
      console.error('Failed to cancel order:', error)
      alert('Erro ao cancelar pedido')
    }
  }

  async function handleComplete(orderId: string) {
    try {
      await api.post(`/orders/${orderId}/complete`)
      loadOrders()
    } catch (error) {
      console.error('Failed to complete order:', error)
      alert('Erro ao marcar pedido como recebido')
    }
  }

  function getStatusBadge(status: string) {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      PENDING: { variant: 'secondary', icon: Clock, label: 'Aguardando Pagamento' },
      PAID: { variant: 'default', icon: CheckCircle, label: 'Pago' },
      PROCESSING: { variant: 'default', icon: Package, label: 'Processando' },
      SHIPPED: { variant: 'default', icon: Package, label: 'Enviado' },
      DELIVERED: { variant: 'default', icon: CheckCircle, label: 'Entregue' },
      COMPLETED: { variant: 'default', icon: CheckCircle, label: 'Concluído' },
      CANCELLED: { variant: 'destructive', icon: XCircle, label: 'Cancelado' },
    }

    const config = variants[status] || variants.PENDING
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8">Meus Pedidos</h1>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-24 w-full" />
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Meus Pedidos</h1>

        {orders.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum pedido encontrado</h3>
            <p className="text-gray-500 mb-4">Você ainda não fez nenhuma compra</p>
            <Button onClick={() => router.push('/products')}>Explorar Produtos</Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <Card key={order.id} className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex gap-4">
                    {order.product?.images?.[0] && (
                      <div className="w-20 h-20 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                        <img
                          src={order.product.images[0]}
                          alt={order.product.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{order.product?.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        Pedido #{order.id?.slice(0, 8)} • {new Date(order.created_at).toLocaleDateString('pt-BR')}
                      </p>
                      {getStatusBadge(order.status)}
                    </div>
                  </div>

                  <div className="flex flex-col md:items-end gap-2">
                    <span className="text-2xl font-bold text-blue-600">
                      R$ {order.total?.toFixed(2)}
                    </span>
                    <div className="flex gap-2">
                      {order.status === 'PENDING' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancel(order.id)}
                        >
                          Cancelar
                        </Button>
                      )}
                      {order.status === 'DELIVERED' && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleComplete(order.id)}
                        >
                          Marcar como Recebido
                        </Button>
                      )}
                      {order.status === 'COMPLETED' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/products/${order.product_id}/review`)}
                        >
                          Avaliar Produto
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
