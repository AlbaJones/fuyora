'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Star, User, ArrowLeft } from 'lucide-react'
import { api } from '@/lib/api'
import { Product } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)

  useEffect(() => {
    loadProduct()
  }, [params.id])

  async function loadProduct() {
    try {
      setLoading(true)
      const response = await api.get(`/products/${params.id}`)
      setProduct(response.data)
    } catch (error) {
      console.error('Failed to load product:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleBuy() {
    if (!product) return
    
    try {
      setPurchasing(true)
      const response = await api.post('/orders', { product_id: product.id })
      router.push(`/checkout?order=${response.data.id}`)
    } catch (error) {
      console.error('Failed to create order:', error)
      alert('Erro ao criar pedido. Tente novamente.')
    } finally {
      setPurchasing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <Skeleton className="h-8 w-24 mb-6" />
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="aspect-square w-full" />
            <div>
              <Skeleton className="h-10 w-3/4 mb-4" />
              <Skeleton className="h-8 w-1/4 mb-6" />
              <Skeleton className="h-32 w-full mb-6" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Produto não encontrado</h2>
          <Button onClick={() => router.push('/products')}>Voltar para o Marketplace</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden mb-4">
              {product.images && product.images[0] ? (
                <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">Sem imagem</div>
              )}
            </div>
          </div>

          <div>
            <div className="mb-4">
              {product.category && <Badge variant="secondary" className="mb-2">{product.category}</Badge>}
              <h1 className="text-3xl font-bold mb-2">{product.title}</h1>
              <div className="flex items-center gap-4 text-gray-600 mb-4">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span>4.5</span>
                </div>
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>Vendido por {product.seller_name || 'Vendedor'}</span>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <span className="text-4xl font-bold text-blue-600">R$ {product.price.toFixed(2)}</span>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-2">Descrição</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{product.description}</p>
            </div>

            {product.is_digital && (
              <div className="mb-6">
                <Badge variant="outline">Produto Digital</Badge>
                <p className="text-sm text-gray-600 mt-2">
                  Você receberá o link para download após a confirmação do pagamento
                </p>
              </div>
            )}

            <Button size="lg" className="w-full" onClick={handleBuy} disabled={purchasing || product.status !== 'ACTIVE'}>
              <ShoppingCart className="mr-2 h-5 w-5" />
              {purchasing ? 'Processando...' : 'Comprar Agora'}
            </Button>

            {product.status !== 'ACTIVE' && (
              <p className="text-sm text-red-600 mt-2 text-center">
                Este produto não está disponível no momento
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
