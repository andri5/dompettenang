/**
 * Pro monthly insight page.
 */

import { MainLayout, PageHeader, PageTransition } from '@/components/layout';
import { SEO } from '@/components/SEO';
import { MonthlyInsight } from '@/pages/dashboard/components/MonthlyInsight';

export function InsightPage() {
  return (
    <PageTransition>
      <SEO title="Insight bulanan" description="Perbandingan keuangan bulan ini dan bulan lalu." noIndex />
      <MainLayout>
        <PageHeader
          eyebrow="Pro"
          title="Insight bulanan"
          description="Bandingkan pengeluaran bulan ini dengan periode yang sama bulan lalu."
        />
        <MonthlyInsight />
      </MainLayout>
    </PageTransition>
  );
}
