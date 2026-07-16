import { LucideIcon } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md';

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-accent text-white hover:bg-accentDark',
  secondary: 'bg-transparent border border-border text-ink hover:bg-accentSoft hover:border-accent',
  ghost: 'bg-transparent text-muted hover:bg-accentSoft hover:text-ink',
  danger: 'bg-danger text-white hover:brightness-95',
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-caption rounded',
  md: 'px-4 py-2 text-body rounded-md',
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  loading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  loading,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 font-medium transition-colors duration-fast
        disabled:opacity-50 disabled:cursor-not-allowed
        focus-visible:outline-none focus-visible:shadow-focus
        ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        Icon && <Icon size={14} strokeWidth={2} />
      )}
      {children}
    </button>
  );
}

export function IconButton({
  icon: Icon,
  size = 'md',
  variant = 'ghost',
  className = '',
  ...props
}: { icon: LucideIcon; size?: Size; variant?: Variant } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const dim = size === 'sm' ? 'h-7 w-7' : 'h-9 w-9';
  return (
    <button
      className={`inline-flex items-center justify-center rounded-md transition-colors duration-fast
        focus-visible:outline-none focus-visible:shadow-focus
        ${VARIANT_CLASSES[variant]} ${dim} ${className}`}
      {...props}
    >
      <Icon size={size === 'sm' ? 14 : 16} strokeWidth={2} />
    </button>
  );
}
