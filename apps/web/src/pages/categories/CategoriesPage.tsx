/**
 * Dompet Tenang - Categories Page
 */

import { useState } from 'react';
import { Plus, Pencil, Trash2, FolderOpen, AlertCircle, Lock } from 'lucide-react';
import { MainLayout, PageHeader, PageTransition } from '@/components/layout';
import {
  Button,
  Loading,
  Modal,
  ModalFooter,
  EmptyState,
  Card,
  CategoryIcon,
  Badge,
} from '@/components/ui';
import { CategoryForm } from './components/CategoryForm';
import { useCategories, useCategoryMutations } from '@/hooks';
import type { Category } from '@/types';

export function CategoriesPage() {
  const [formModal, setFormModal] = useState<{
    isOpen: boolean;
    category?: Category;
  }>({ isOpen: false });
  const [deleteModal, setDeleteModal] = useState<Category | null>(null);

  const { data: categories, isLoading } = useCategories();
  const { delete: deleteMutation } = useCategoryMutations();

  const handleDelete = async () => {
    if (!deleteModal) return;
    try {
      await deleteMutation.mutateAsync(deleteModal.id);
      setDeleteModal(null);
    } catch {
      // Error toast handled in mutation
    }
  };

  const openCreateModal = () => setFormModal({ isOpen: true });
  const openEditModal = (category: Category) => {
    if (category.isDefault) return;
    setFormModal({ isOpen: true, category });
  };
  const closeFormModal = () => setFormModal({ isOpen: false });

  return (
    <PageTransition>
      <MainLayout>
        <PageHeader
          eyebrow="Organisasi"
          title="Kategori"
          description="Kelompokkan pemasukan dan pengeluaran. Kategori default tidak bisa dihapus."
          action={
            <Button
              variant="gradient"
              size="lg"
              leftIcon={<Plus className="h-5 w-5" />}
              onClick={openCreateModal}
              className="w-full sm:w-auto"
            >
              Tambah Kategori
            </Button>
          }
        />

        {isLoading ? (
          <Loading message="Memuat kategori..." />
        ) : categories && categories.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {categories.map((category) => {
              const isDefault = !!category.isDefault;
              return (
                <Card key={category.id} padding="none" className="overflow-hidden">
                  <div
                    className="h-1.5 w-full"
                    style={{ backgroundColor: category.color || '#0f9b8e' }}
                  />
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl"
                          style={{
                            backgroundColor: category.color
                              ? `${category.color}22`
                              : '#e6edf4',
                            color: category.color || '#0f9b8e',
                          }}
                        >
                          <CategoryIcon icon={category.icon} size={22} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate font-display text-lg font-bold text-ink">
                              {category.name}
                            </p>
                            {isDefault && (
                              <Badge variant="info" size="sm">
                                Default
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted">
                            {category.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'}
                            {' · '}
                            {category.expenseCount || 0} transaksi
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2 border-t border-line pt-4">
                      <button
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold text-muted transition hover:bg-accent-soft hover:text-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted"
                        onClick={() => openEditModal(category)}
                        disabled={isDefault}
                        title={
                          isDefault
                            ? 'Kategori default tidak dapat diubah'
                            : 'Edit kategori'
                        }
                      >
                        {isDefault ? <Lock className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                        Edit
                      </button>
                      <button
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold text-muted transition hover:bg-coral-soft hover:text-coral disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted"
                        onClick={() => setDeleteModal(category)}
                        disabled={isDefault}
                        title={
                          isDefault
                            ? 'Kategori default tidak dapat dihapus'
                            : 'Hapus kategori'
                        }
                      >
                        {isDefault ? <Lock className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                        Hapus
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}

            <button
              onClick={openCreateModal}
              className="flex min-h-[180px] flex-col items-center justify-center gap-3 rounded-[1.25rem] border border-dashed border-line bg-surface/50 p-5 text-muted transition hover:border-accent/40 hover:bg-accent-soft/40 hover:text-accent"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-mist-deep">
                <Plus className="h-6 w-6" />
              </div>
              <span className="font-semibold">Tambah Kategori</span>
            </button>
          </div>
        ) : (
          <Card padding="lg">
            <EmptyState
              icon={<FolderOpen className="h-7 w-7" />}
              title="Belum ada kategori"
              description="Buat kategori untuk mengelompokkan transaksimu"
              action={
                <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreateModal}>
                  Tambah Kategori
                </Button>
              }
            />
          </Card>
        )}

        <Modal
          isOpen={formModal.isOpen}
          onClose={closeFormModal}
          title={formModal.category ? 'Edit Kategori' : 'Tambah Kategori'}
        >
          <CategoryForm
            category={formModal.category}
            onSuccess={closeFormModal}
            onCancel={closeFormModal}
          />
        </Modal>

        <Modal
          isOpen={!!deleteModal}
          onClose={() => setDeleteModal(null)}
          title="Hapus Kategori"
          size="sm"
        >
          <div className="mb-4 flex items-start gap-3 rounded-2xl border border-amber/20 bg-amber-soft p-3">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber" />
            <p className="text-sm text-ink">
              Transaksi terkait akan dipindah ke kategori &quot;Lainnya&quot;.
            </p>
          </div>
          <p className="text-muted">
            Hapus kategori "
            <strong className="text-ink">{deleteModal?.name}</strong>"?
          </p>
          <ModalFooter>
            <Button variant="ghost" onClick={() => setDeleteModal(null)}>
              Batal
            </Button>
            <Button
              variant="danger"
              isLoading={deleteMutation.isPending}
              onClick={handleDelete}
            >
              Hapus
            </Button>
          </ModalFooter>
        </Modal>
      </MainLayout>
    </PageTransition>
  );
}
