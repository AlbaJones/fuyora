'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function EditProduct() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<any>(null)

  useEffect(() => {
    loadProduct()
  }, [params.id])

  const loadProduct = async () => {
    try {
      const response = await api.get(`/products/${params.id}`)
      setFormData(response.data)
    } catch (error) {
      console.error('Error loading product:', error)
      alert('Error loading product')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      await api.put(`/products/${params.id}`, {
        ...formData,
        price: parseFloat(formData.price)
      })
      alert('Product updated successfully!')
      router.push('/seller/products')
    } catch (error) {
      console.error('Error updating product:', error)
      alert('Error updating product')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      await api.delete(`/products/${params.id}`)
      alert('Product deleted successfully!')
      router.push('/seller/products')
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Error deleting product')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Skeleton className="h-10 w-48 mb-4" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (!formData) {
    return <div className="container mx-auto p-6">Product not found</div>
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Link href="/seller/products">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Products
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Edit Product</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="price">Price (R$) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <select
                id="category"
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full border rounded-md px-3 py-2"
              >
                <option value="electronics">Electronics</option>
                <option value="clothing">Clothing</option>
                <option value="books">Books</option>
                <option value="home">Home</option>
                <option value="digital">Digital Products</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full border rounded-md px-3 py-2"
              >
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
              </select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={saving} className="flex-1">
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
              >
                Delete
              </Button>
              <Link href="/seller/products">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
