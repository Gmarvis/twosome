import type { ButtonHTMLAttributes, ReactNode } from "react";
import { AnimatedLogo } from "./animated-logo";

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  children: ReactNode;
}

/**
 * A button that replaces its content with the animated logo when loading.
 * Accepts all standard <button> props (className, disabled, onClick, etc.).
 */
export function LoadingButton({
  loading = false,
  children,
  disabled,
  className = "",
  ...rest
}: LoadingButtonProps) {
  return (
    <button
      className={className}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <AnimatedLogo size="xs" className="shrink-0" />
        </span>
      ) : (
        children
      )}
    </button>
  );
}
