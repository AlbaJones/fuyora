import Link from "next/link";
import { ShoppingBag, Shield, Zap, TrendingUp } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">Fuyora</span>
          </div>
          <nav className="hidden md:flex gap-6">
            <Link href="/products" className="text-gray-600 hover:text-gray-900">
              Produtos
            </Link>
            <Link href="/how-it-works" className="text-gray-600 hover:text-gray-900">
              Como Funciona
            </Link>
            <Link href="/sell" className="text-gray-600 hover:text-gray-900">
              Vender
            </Link>
          </nav>
          <div className="flex gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Cadastrar
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
          O Marketplace de
          <span className="text-blue-600"> Produtos Digitais </span>
          do Brasil
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Compre e venda cursos, ebooks, templates e serviços digitais com
          segurança e praticidade. Pagamento via PIX, Boleto ou Cartão.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/products"
            className="px-8 py-4 bg-blue-600 text-white rounded-lg text-lg font-semibold hover:bg-blue-700 transition"
          >
            Explorar Produtos
          </Link>
          <Link
            href="/register"
            className="px-8 py-4 bg-gray-100 text-gray-900 rounded-lg text-lg font-semibold hover:bg-gray-200 transition"
          >
            Começar a Vender
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          Por que escolher a Fuyora?
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-xl shadow-sm border">
            <Shield className="h-12 w-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Segurança Total</h3>
            <p className="text-gray-600">
              KYC obrigatório para vendedores, sistema de disputas e proteção
              ao comprador. Seu dinheiro seguro com ledger interno.
            </p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-sm border">
            <Zap className="h-12 w-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Pagamentos Rápidos</h3>
            <p className="text-gray-600">
              PIX instantâneo, boleto bancário ou cartão de crédito.
              PagSeguro como gateway oficial. 100% brasileiro.
            </p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-sm border">
            <TrendingUp className="h-12 w-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Crescimento Real</h3>
            <p className="text-gray-600">
              Sistema de reviews, dashboard completo para vendedores e
              ferramentas para crescer seu negócio digital.
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
              <div className="text-4xl font-bold mb-2">5000+</div>
              <div className="text-blue-100">Transações</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">4.8★</div>
              <div className="text-blue-100">Avaliação Média</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-4xl font-bold mb-6">Pronto para começar?</h2>
        <p className="text-xl text-gray-600 mb-8">
          Junte-se a milhares de criadores que já estão vendendo na Fuyora
        </p>
        <Link
          href="/register"
          className="inline-block px-8 py-4 bg-blue-600 text-white rounded-lg text-lg font-semibold hover:bg-blue-700 transition"
        >
          Criar Conta Grátis
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <ShoppingBag className="h-6 w-6 text-blue-600" />
                <span className="text-xl font-bold">Fuyora</span>
              </div>
              <p className="text-gray-600">
                Marketplace de produtos digitais 100% brasileiro
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-gray-600">
                <li>
                  <Link href="/products">Explorar</Link>
                </li>
                <li>
                  <Link href="/sell">Vender</Link>
                </li>
                <li>
                  <Link href="/pricing">Preços</Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-gray-600">
                <li>
                  <Link href="/about">Sobre</Link>
                </li>
                <li>
                  <Link href="/blog">Blog</Link>
                </li>
                <li>
                  <Link href="/careers">Carreiras</Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-gray-600">
                <li>
                  <Link href="/help">Central de Ajuda</Link>
                </li>
                <li>
                  <Link href="/terms">Termos de Uso</Link>
                </li>
                <li>
                  <Link href="/privacy">Privacidade</Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-gray-600">
            <p>&copy; 2026 Fuyora. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
