export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}
