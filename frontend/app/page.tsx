'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { UserMenu } from '@/components/user-menu';
import { Button } from '@/components/ui/button';
import { Shield, DollarSign, TrendingUp, ShoppingBag, Users, Star } from 'lucide-react';

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            Fuyora
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/products" className="text-gray-700 hover:text-blue-600">
              Explorar
            </Link>
            <Link href="#como-funciona" className="text-gray-700 hover:text-blue-600">
              Como Funciona
            </Link>
            <Link href="#vantagens" className="text-gray-700 hover:text-blue-600">
              Vantagens
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <UserMenu />
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">Entrar</Button>
                </Link>
                <Link href="/register">
                  <Button>Criar Conta</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
          Marketplace C2C
          <span className="block text-blue-600 mt-2">100% Brasileiro</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Compre e venda produtos digitais e físicos com segurança,
          pagamentos via PIX, e proteção completa para compradores e vendedores.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/products">
            <Button size="lg" className="w-full sm:w-auto">
              <ShoppingBag className="mr-2 h-5 w-5" />
              Explorar Produtos
            </Button>
          </Link>
          <Link href="/register">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              <TrendingUp className="mr-2 h-5 w-5" />
              Começar a Vender
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section id="vantagens" className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Por Que Escolher o Fuyora?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-lg shadow-sm border">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Segurança Total</h3>
            <p className="text-gray-600">
              KYC para vendedores, sistema de disputas, e proteção do comprador.
              Suas transações estão sempre protegidas.
            </p>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-sm border">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Pagamentos Brasileiros</h3>
            <p className="text-gray-600">
              PIX instantâneo, Boleto, e Cartão de Crédito via PagSeguro.
              Receba seu dinheiro de forma rápida e segura.
            </p>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-sm border">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Cresça Seu Negócio</h3>
            <p className="text-gray-600">
              Ferramentas profissionais para vendedores, analytics, e suporte
              dedicado para fazer seu negócio crescer.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-blue-600 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">1000+</div>
              <div className="text-blue-100">Produtos Ativos</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-blue-100">Vendedores</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">R$ 1M+</div>
              <div className="text-blue-100">Em Transações</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">4.8/5</div>
              <div className="text-blue-100">Avaliação Média</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold mb-6">Pronto para Começar?</h2>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Junte-se a milhares de usuários que já confiam no Fuyora para suas transações.
        </p>
        <Link href="/register">
          <Button size="lg">
            Criar Conta Grátis
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4">Fuyora</h3>
              <p className="text-gray-600 text-sm">
                Marketplace C2C brasileiro com foco em segurança e facilidade.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Comprar</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/products" className="hover:text-blue-600">Explorar Produtos</Link></li>
                <li><Link href="#" className="hover:text-blue-600">Categorias</Link></li>
                <li><Link href="#" className="hover:text-blue-600">Como Comprar</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Vender</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/register" className="hover:text-blue-600">Começar a Vender</Link></li>
                <li><Link href="#" className="hover:text-blue-600">Taxas</Link></li>
                <li><Link href="#" className="hover:text-blue-600">Guia do Vendedor</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="#" className="hover:text-blue-600">Central de Ajuda</Link></li>
                <li><Link href="#" className="hover:text-blue-600">Contato</Link></li>
                <li><Link href="#" className="hover:text-blue-600">Termos de Uso</Link></li>
                <li><Link href="#" className="hover:text-blue-600">Privacidade</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-gray-600">
            <p>&copy; 2026 Fuyora. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
