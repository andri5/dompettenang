/**
 * Maintenance — Web sedang dalam perawatan
 */

import { Construction, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui';
import { PageTransition } from '@/components/layout';
import { StatusPageShell } from './StatusPageShell';

export function MaintenancePage() {
  return (
    <PageTransition>
      <StatusPageShell
        badge="Maintenance"
        title="Sedang dalam perawatan"
        description="Dompet Tenang sementara tidak bisa diakses sementara kami menyiapkan peningkatan. Data kamu aman — silakan coba lagi beberapa saat lagi."
        icon={<Construction className="h-7 w-7" />}
        actions={
          <Button
            type="button"
            variant="gradient"
            leftIcon={<RefreshCw className="h-4 w-4" />}
            onClick={() => window.location.reload()}
          >
            Coba lagi
          </Button>
        }
      />
    </PageTransition>
  );
}
