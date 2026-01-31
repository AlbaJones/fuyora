'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DollarSign, TrendingUp, TrendingDown, Clock } from 'lucide-react'

export default function SellerBalance() {
  const [loading, setLoading] = useState(true)
  const [balance, setBalance] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [withdrawData, setWithdrawData] = useState({ pix_key: '', amount: '' })

  useEffect(() => {
    loadBalanceData()
  }, [])

  const loadBalanceData = async () => {
    try {
      const [balanceRes, transRes, withdrawRes] = await Promise.all([
        api.get('/seller/balance'),
        api.get('/seller/transactions'),
        api.get('/seller/withdrawals')
      ])
      setBalance(balanceRes.data)
      setTransactions(transRes.data.transactions || [])
      setWithdrawals(withdrawRes.data.withdrawals || [])
    } catch (error) {
      console.error('Error loading balance data:', error)
    } finally {
      setLoading(false)
    }
  }

  const requestWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await api.post('/seller/withdrawals/request', {
        pix_key: withdrawData.pix_key,
        amount: parseFloat(withdrawData.amount)
      })
      alert('Withdrawal requested! It will be processed in 48h.')
      setShowForm(false)
      setWithdrawData({ pix_key: '', amount: '' })
      loadBalanceData()
    } catch (error) {
      console.error('Error requesting withdrawal:', error)
      alert('Error requesting withdrawal')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Balance & Withdrawals</h1>

      <Alert className="mb-6">
        <Clock className="h-4 w-4" />
        <AlertDescription>
          Withdrawals have a 48h processing delay for security.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {(balance?.available || 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Can be withdrawn</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              R$ {(balance?.pending || 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">72h release</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Held</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R$ {(balance?.held || 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">In disputes</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Request Withdrawal</CardTitle>
          </CardHeader>
          <CardContent>
            {!showForm ? (
              <Button onClick={() => setShowForm(true)} className="w-full">
                New Withdrawal Request
              </Button>
            ) : (
              <form onSubmit={requestWithdrawal} className="space-y-4">
                <div>
                  <Label htmlFor="pix_key">PIX Key *</Label>
                  <Input
                    id="pix_key"
                    required
                    value={withdrawData.pix_key}
                    onChange={(e) => setWithdrawData({ ...withdrawData, pix_key: e.target.value })}
                    placeholder="email@example.com or CPF"
                  />
                </div>
                <div>
                  <Label htmlFor="amount">Amount (R$) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    required
                    max={balance?.available || 0}
                    value={withdrawData.amount}
                    onChange={(e) => setWithdrawData({ ...withdrawData, amount: e.target.value })}
                    placeholder="0.00"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Max: R$ {(balance?.available || 0).toFixed(2)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">Request</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Withdrawals</CardTitle>
          </CardHeader>
          <CardContent>
            {withdrawals.length === 0 ? (
              <p className="text-muted-foreground text-sm">No withdrawals yet</p>
            ) : (
              <div className="space-y-3">
                {withdrawals.slice(0, 5).map((w: any) => (
                  <div key={w.id} className="flex justify-between items-center text-sm">
                    <div>
                      <p className="font-medium">R$ {w.amount.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(w.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={w.status === 'COMPLETED' ? 'default' : 'secondary'}>
                      {w.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-muted-foreground">No transactions yet</p>
          ) : (
            <div className="space-y-3">
              {transactions.slice(0, 10).map((t: any) => (
                <div key={t.id} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <p className="font-medium">{t.type}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(t.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <p className={`font-semibold ${t.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {t.amount > 0 ? '+' : ''}R$ {Math.abs(t.amount).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
