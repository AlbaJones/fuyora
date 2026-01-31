'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import {
  Avatar,
  AvatarFallback,
} from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  User,
  ShoppingBag,
  Package,
  TrendingUp,
  Wallet,
  Shield,
  LayoutDashboard,
  Users,
  LogOut,
  FileCheck,
} from 'lucide-react';

export function UserMenu() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <div className="flex items-center gap-2">
          <Avatar>
            <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
          </Avatar>
          <div className="hidden md:block text-left">
            <div className="text-sm font-medium">{user.full_name}</div>
            <div className="text-xs text-gray-500">{user.email}</div>
          </div>
        </div>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent>
        <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <Link href="/profile">
          <DropdownMenuItem>
            <User className="h-4 w-4" />
            Perfil
          </DropdownMenuItem>
        </Link>

        {user.role === 'buyer' && (
          <>
            <Link href="/orders">
              <DropdownMenuItem>
                <ShoppingBag className="h-4 w-4" />
                Meus Pedidos
              </DropdownMenuItem>
            </Link>
          </>
        )}

        {user.role === 'seller' && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Vendedor</DropdownMenuLabel>
            
            <Link href="/seller/products">
              <DropdownMenuItem>
                <Package className="h-4 w-4" />
                Meus Produtos
              </DropdownMenuItem>
            </Link>
            
            <Link href="/seller/sales">
              <DropdownMenuItem>
                <TrendingUp className="h-4 w-4" />
                Vendas
              </DropdownMenuItem>
            </Link>
            
            <Link href="/seller/balance">
              <DropdownMenuItem>
                <Wallet className="h-4 w-4" />
                Saldo e Saques
              </DropdownMenuItem>
            </Link>
            
            <Link href="/seller/kyc">
              <DropdownMenuItem>
                <FileCheck className="h-4 w-4" />
                Status KYC
              </DropdownMenuItem>
            </Link>
          </>
        )}

        {user.role === 'admin' && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Admin</DropdownMenuLabel>
            
            <Link href="/admin/dashboard">
              <DropdownMenuItem>
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </DropdownMenuItem>
            </Link>
            
            <Link href="/admin/kyc">
              <DropdownMenuItem>
                <FileCheck className="h-4 w-4" />
                Revisar KYC
              </DropdownMenuItem>
            </Link>
            
            <Link href="/admin/products">
              <DropdownMenuItem>
                <Package className="h-4 w-4" />
                Moderar Produtos
              </DropdownMenuItem>
            </Link>
            
            <Link href="/admin/users">
              <DropdownMenuItem>
                <Users className="h-4 w-4" />
                Usuários
              </DropdownMenuItem>
            </Link>
          </>
        )}

        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
