'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Ban, Clock, FileText } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

export default function BannedPage() {
  const { user, logout } = useAuth();

  if (!user || !user.is_banned) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>
              Esta página é apenas para usuários banidos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button>Voltar para Início</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isBanPermanent = user.ban_type === 'PERMANENT';
  const banExpired = user.ban_expires_at && new Date(user.ban_expires_at) < new Date();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <Ban className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl text-red-900">Conta Bloqueada</CardTitle>
          <CardDescription>
            Sua conta foi bloqueada temporariamente ou permanentemente
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Ban Type */}
          <div className="flex items-center justify-center gap-2">
            <Badge variant={isBanPermanent ? "destructive" : "warning"} className="text-sm">
              {isBanPermanent ? (
                <>
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Banimento Permanente
                </>
              ) : (
                <>
                  <Clock className="h-3 w-3 mr-1" />
                  Banimento Temporário
                </>
              )}
            </Badge>
          </div>

          {/* Ban Reason */}
          {user.ban_reason && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Motivo do Banimento</AlertTitle>
              <AlertDescription className="mt-2">
                {user.ban_reason}
              </AlertDescription>
            </Alert>
          )}

          {/* Expiration Info */}
          {!isBanPermanent && user.ban_expires_at && (
            <Alert variant={banExpired ? "success" : "default"}>
              <Clock className="h-4 w-4" />
              <AlertTitle>
                {banExpired ? 'Banimento Expirado' : 'Data de Expiração'}
              </AlertTitle>
              <AlertDescription className="mt-2">
                {banExpired ? (
                  <div>
                    <p>Seu banimento expirou em {formatDateTime(user.ban_expires_at)}.</p>
                    <p className="mt-2">Você pode fazer logout e login novamente.</p>
                  </div>
                ) : (
                  <p>Seu banimento expira em {formatDateTime(user.ban_expires_at)}.</p>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Appeal Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-2">
                  Solicitar Revisão
                </h3>
                <p className="text-sm text-blue-800 mb-4">
                  {isBanPermanent
                    ? 'Você pode solicitar a revisão do seu banimento permanente. Nossa equipe analisará seu caso.'
                    : 'Você pode solicitar a revisão do seu banimento. Se aprovado, o banimento será removido antes do prazo.'}
                </p>
                <Link href="/ban-appeal">
                  <Button variant="default" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Enviar Apelação
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => logout()}
            >
              Sair da Conta
            </Button>
            
            {banExpired && (
              <Button
                variant="default"
                className="flex-1"
                onClick={() => {
                  logout().then(() => {
                    window.location.href = '/login';
                  });
                }}
              >
                Fazer Login Novamente
              </Button>
            )}
          </div>

          {/* Help Text */}
          <div className="text-center text-sm text-gray-600 pt-4 border-t">
            <p>
              Se você acredita que este banimento foi feito por engano, 
              entre em contato através do formulário de apelação.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
