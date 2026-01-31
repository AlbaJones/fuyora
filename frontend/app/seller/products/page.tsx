'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, Plus, Edit, Trash2 } from 'lucide-react'

export default function SellerProducts() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('ALL')

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      const response = await api.get('/seller/products')
      setProducts(response.data.products || [])
    } catch (error) {
      console.error('Error loading products:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteProduct = async (id: string) => {
    if (!confirm('Delete this product?')) return
    
    try {
      await api.delete(`/products/${id}`)
      setProducts(products.filter(p => p.id !== id))
      alert('Product deleted')
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Error deleting product')
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === 'ALL' || product.status === filter
    return matchesSearch && matchesFilter
  })

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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Products</h1>
        <Link href="/seller/products/new">
          <Button><Plus className="mr-2 h-4 w-4" /> New Product</Button>
        </Link>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border rounded-md px-4"
        >
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="DRAFT">Draft</option>
          <option value="SOLD">Sold</option>
        </select>
      </div>

      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground mb-4">No products found</p>
            <Link href="/seller/products/new">
              <Button>Create Your First Product</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredProducts.map((product) => (
            <Card key={product.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{product.title}</h3>
                      <Badge variant={product.status === 'ACTIVE' ? 'default' : 'secondary'}>
                        {product.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {product.description?.substring(0, 100)}...
                    </p>
                    <p className="text-lg font-bold text-blue-600">
                      R$ {product.price.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/seller/products/${product.id}/edit`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteProduct(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
