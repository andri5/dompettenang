/**
 * Dompet Tenang - Category Form Component
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, ArrowDownCircle, ArrowUpCircle, Check } from 'lucide-react';
import { Button, Input, ModalFooter, CategoryIcon, CATEGORY_ICON_OPTIONS, FieldTooltip } from '@/components/ui';
import { categorySchema } from '@/lib/validations';
import type { CategoryFormData } from '@/lib/validations';
import { useCategoryMutations } from '@/hooks';
import { CATEGORY_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { Category } from '@/types';

interface CategoryFormProps {
  category?: Category;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CategoryForm({ category, onSuccess, onCancel }: CategoryFormProps) {
  const isEditing = !!category;
  const { create: createMutation, update: updateMutation } = useCategoryMutations();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      icon: CATEGORY_ICON_OPTIONS[0],
      color: CATEGORY_COLORS[0],
      type: 'EXPENSE',
    },
  });

  const selectedIcon = watch('icon');
  const selectedColor = watch('color');
  const selectedType = watch('type');

  useEffect(() => {
    if (category) {
      reset({
        name: category.name,
        icon: category.icon || CATEGORY_ICON_OPTIONS[0],
        color: category.color || CATEGORY_COLORS[0],
        type: category.type || 'EXPENSE',
      });
    }
  }, [category, reset]);

  const onSubmit = async (data: CategoryFormData) => {
    try {
      if (isEditing && category) {
        await updateMutation.mutateAsync({
          id: category.id,
          data,
        });
      } else {
        await createMutation.mutateAsync(data);
      }
      onSuccess();
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Input
        label="Nama Kategori"
        tooltip="Nama singkat yang mudah dikenali, misalnya Makanan atau Gaji."
        placeholder="Contoh: Makanan, Transport, dll"
        error={errors.name?.message}
        {...register('name')}
      />

      <div>
        <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-ink">
          <span>Jenis</span>
          <FieldTooltip content="Pilih Pemasukan atau Pengeluaran. Jenis menentukan form transaksi mana yang bisa memakai kategori ini." />
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            {
              value: 'EXPENSE' as const,
              label: 'Pengeluaran',
              hint: 'Uang keluar',
              icon: ArrowUpCircle,
              activeClass: 'border-coral bg-coral-soft text-coral shadow-sm shadow-coral/15',
              iconClass: 'text-coral',
            },
            {
              value: 'INCOME' as const,
              label: 'Pemasukan',
              hint: 'Uang masuk',
              icon: ArrowDownCircle,
              activeClass: 'border-lime bg-lime-soft text-lime shadow-sm shadow-lime/15',
              iconClass: 'text-lime',
            },
          ].map((option) => {
            const active = selectedType === option.value;
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setValue('type', option.value)}
                className={cn(
                  'relative rounded-2xl border px-3 py-3 text-left transition',
                  active
                    ? option.activeClass
                    : 'border-line bg-surface text-muted hover:border-accent/40'
                )}
              >
                {active ? (
                  <span className="absolute right-2 top-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/70">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                ) : null}
                <Icon className={cn('mb-2 h-5 w-5', active ? option.iconClass : 'text-muted')} />
                <p className={cn('text-sm font-extrabold', active ? undefined : 'text-ink')}>
                  {option.label}
                </p>
                <p className="text-[11px] font-semibold opacity-80">{option.hint}</p>
              </button>
            );
          })}
        </div>
        <input type="hidden" {...register('type')} />
      </div>

      <div>
        <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-ink">
          <span>Warna</span>
          <FieldTooltip content="Warna dipakai di daftar transaksi dan grafik kategori agar mudah dibedakan." />
        </label>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setValue('color', color)}
              className={cn(
                'h-8 w-8 rounded-xl transition-transform',
                selectedColor === color && 'scale-110 ring-2 ring-offset-2'
              )}
              style={{
                backgroundColor: color,
                // @ts-expect-error ringColor is a custom CSS property
                '--tw-ring-color': color,
              }}
            />
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-ink">
          <span>Ikon</span>
          <FieldTooltip content="Pilih ikon yang mewakili kategori. Ikon tampil di daftar dan form transaksi." />
        </label>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {CATEGORY_ICON_OPTIONS.map((icon) => {
            const active = selectedIcon === icon;
            return (
              <button
                key={icon}
                type="button"
                onClick={() => setValue('icon', icon, { shouldValidate: true })}
                className={cn(
                  'flex h-11 w-full items-center justify-center rounded-2xl border transition',
                  active
                    ? 'border-accent bg-accent-soft text-accent shadow-sm shadow-accent/15'
                    : 'border-line bg-mist/40 text-ink hover:border-accent/40 hover:bg-accent-soft/40'
                )}
                aria-label={`Pilih ikon ${icon}`}
              >
                <CategoryIcon icon={icon} size={18} />
              </button>
            );
          })}
        </div>
        <input type="hidden" {...register('icon')} />
      </div>

      <div>
        <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-ink">
          <span>Preview</span>
          <FieldTooltip content="Pratinjau tampilan kategori sebelum disimpan." />
        </label>
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-mist/50 p-4">
          <div
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl"
            style={{
              backgroundColor: selectedColor ? `${selectedColor}22` : '#e6edf4',
              color: selectedColor || '#0f9b8e',
            }}
          >
            <CategoryIcon icon={selectedIcon} size={22} />
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-base font-bold text-ink">
              {watch('name') || 'Nama Kategori'}
            </p>
            <p className="text-xs text-muted">
              {selectedType === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'}
            </p>
          </div>
        </div>
      </div>

      <ModalFooter className="border-t-0 pt-0">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Batal
        </Button>
        <Button
          type="submit"
          isLoading={isSubmitting}
          leftIcon={<Save className="h-4 w-4" />}
        >
          {isEditing ? 'Simpan' : 'Tambah'}
        </Button>
      </ModalFooter>
    </form>
  );
}
