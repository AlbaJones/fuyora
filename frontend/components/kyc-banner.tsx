'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Button } from './ui/button';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';

export function KYCBanner() {
  const { user } = useAuth();

  // Only show for sellers
  if (!user || user.role !== 'seller') return null;

  // Seller without KYC - needs to submit
  if (!user.kyc_status) {
    return (
      <Alert variant="warning" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>KYC Pendente</AlertTitle>
        <AlertDescription className="mt-2 flex items-center justify-between">
          <span>Você precisa completar o KYC para poder vender produtos na plataforma.</span>
          <Link href="/seller/kyc">
            <Button size="sm" variant="default">
              Enviar KYC
            </Button>
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  // KYC pending review
  if (user.kyc_status === 'PENDING') {
    return (
      <Alert variant="default" className="mb-6">
        <Clock className="h-4 w-4" />
        <AlertTitle>KYC em Análise</AlertTitle>
        <AlertDescription>
          Seu KYC está sendo analisado pela nossa equipe. Você será notificado assim que for aprovado.
        </AlertDescription>
      </Alert>
    );
  }

  // KYC rejected
  if (user.kyc_status === 'REJECTED') {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>KYC Rejeitado</AlertTitle>
        <AlertDescription className="mt-2 flex flex-col gap-2">
          {user.kyc_rejection_reason && (
            <div className="text-sm">
              <strong>Motivo:</strong> {user.kyc_rejection_reason}
            </div>
          )}
          <div className="flex items-center gap-2">
            <span>Por favor, corrija as informações e envie novamente.</span>
            <Link href="/seller/kyc">
              <Button size="sm" variant="default">
                Reenviar KYC
              </Button>
            </Link>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // KYC approved - show success (optional, can be removed to be subtle)
  if (user.kyc_status === 'APPROVED') {
    return (
      <Alert variant="success" className="mb-6">
        <CheckCircle className="h-4 w-4" />
        <AlertTitle>KYC Aprovado</AlertTitle>
        <AlertDescription>
          Seu KYC foi aprovado! Você já pode vender produtos na plataforma.
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
