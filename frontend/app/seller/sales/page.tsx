'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Package } from 'lucide-react'

export default function SellerSales() {
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<any[]>([])
  const [filter, setFilter] = useState('ALL')

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      const response = await api.get('/seller/orders')
      setOrders(response.data.orders || [])
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsShipped = async (orderId: string) => {
    try {
      await api.post(`/seller/orders/${orderId}/ship`)
      setOrders(orders.map(o => 
        o.id === orderId ? { ...o, status: 'SHIPPED' } : o
      ))
      alert('Order marked as shipped')
    } catch (error) {
      console.error('Error:', error)
      alert('Error updating order')
    }
  }

  const filteredOrders = orders.filter(order => 
    filter === 'ALL' || order.status === filter
  )

  const getStatusColor = (status: string) => {
    const colors: any = {
      PENDING: 'secondary',
      PAID: 'default',
      SHIPPED: 'default',
      DELIVERED: 'default',
      COMPLETED: 'default'
    }
    return colors[status] || 'secondary'
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">My Sales</h1>

      <div className="mb-6">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border rounded-md px-4 py-2"
        >
          <option value="ALL">All Orders</option>
          <option value="PENDING">Pending</option>
          <option value="PAID">Paid</option>
          <option value="SHIPPED">Shipped</option>
          <option value="DELIVERED">Delivered</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No sales yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredOrders.map((order) => (
            <Card key={order.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">Order #{order.id.substring(0, 8)}</h3>
                      <Badge variant={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Product: {order.product_title || 'N/A'}
                    </p>
                    <p className="text-sm text-muted-foreground mb-2">
                      Buyer: {order.buyer_email || 'N/A'}
                    </p>
                    <p className="text-sm text-muted-foreground mb-2">
                      Date: {new Date(order.created_at).toLocaleDateString()}
                    </p>
                    <p className="font-bold text-blue-600">
                      Total: R$ {order.total?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <div>
                    {order.status === 'PAID' && (
                      <Button
                        size="sm"
                        onClick={() => markAsShipped(order.id)}
                      >
                        Mark as Shipped
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
