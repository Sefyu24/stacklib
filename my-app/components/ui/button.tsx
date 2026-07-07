import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        // Chunky pressable brand CTA (Second Scent orange with a layered hard
        // shadow). Raised 4px at rest, lifts a touch on hover, and physically
        // depresses into the surface on press (translate down + shrink shadow).
        brand:
          "border border-primary bg-primary text-primary-foreground font-bold shadow-[0_4px_0_var(--primary-shadow)] transition-[transform,box-shadow,background-color] duration-[120ms] ease-out hover:bg-[var(--primary-hover)] hover:-translate-y-[1px] hover:shadow-[0_5px_0_var(--primary-shadow)] active:translate-y-[2px] active:shadow-[0_1px_0_var(--primary-shadow)]",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        // Soft pressable secondary action — a quiet border-tinted hard shadow
        // that compresses on press for the same tactile feel (lighter).
        outline:
          "border bg-background shadow-[0_2px_0_var(--border)] transition-[transform,box-shadow,background-color] duration-[120ms] ease-out hover:bg-accent hover:text-accent-foreground active:translate-y-[1px] active:shadow-[0_1px_0_var(--border)] dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
