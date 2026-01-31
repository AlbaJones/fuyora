'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CreditCard, QrCode, FileText } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function CheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order')
  
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'boleto' | 'card'>('pix')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (orderId) {
      loadOrder()
    }
  }, [orderId])

  async function loadOrder() {
    try {
      setLoading(true)
      const response = await api.get(`/orders/${orderId}`)
      setOrder(response.data)
    } catch (error) {
      console.error('Failed to load order:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handlePayment() {
    if (!order) return

    try {
      setProcessing(true)
      
      let response
      if (paymentMethod === 'pix') {
        response = await api.post('/payments/pix', {
          order_id: order.id,
          amount: order.total
        })
      } else if (paymentMethod === 'boleto') {
        response = await api.post('/payments/boleto', {
          order_id: order.id,
          amount: order.total
        })
      } else {
        response = await api.post('/payments/card', {
          order_id: order.id,
          amount: order.total
        })
      }

      router.push(`/orders?payment=success`)
    } catch (error) {
      console.error('Payment failed:', error)
      alert('Erro ao processar pagamento. Tente novamente.')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4"><p>Carregando...</p></div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Pedido não encontrado</h2>
          <Button onClick={() => router.push('/products')}>Voltar para o Marketplace</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Finalizar Compra</h1>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Forma de Pagamento</h2>
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => setPaymentMethod('pix')}
                  className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 ${
                    paymentMethod === 'pix' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <QrCode className="h-8 w-8" />
                  <span className="font-medium">PIX</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('boleto')}
                  className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 ${
                    paymentMethod === 'boleto' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <FileText className="h-8 w-8" />
                  <span className="font-medium">Boleto</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 ${
                    paymentMethod === 'card' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <CreditCard className="h-8 w-8" />
                  <span className="font-medium">Cartão</span>
                </button>
              </div>
            </Card>
          </div>

          <div>
            <Card className="p-6 sticky top-4">
              <h2 className="text-xl font-semibold mb-4">Resumo</h2>
              <div className="space-y-4">
                <div>
                  <p className="font-medium">{order.product?.title}</p>
                  <p className="text-sm text-gray-600">Por {order.product?.seller_name}</p>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between mb-2">
                    <span>Subtotal</span>
                    <span>R$ {order.total?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-blue-600">R$ {order.total?.toFixed(2)}</span>
                  </div>
                </div>
                <Button size="lg" className="w-full" onClick={handlePayment} disabled={processing}>
                  {processing ? 'Processando...' : 'Confirmar Pagamento'}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
