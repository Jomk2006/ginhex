import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva("relative w-full rounded-md border p-3 text-sm", {
  variants: {
    variant: {
      default: "border-border bg-muted text-foreground",
      destructive: "border-destructive/50 bg-destructive/10 text-destructive",
      success: "border-primary/50 bg-primary/10 text-foreground",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

function Alert({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>) {
  return <div role="alert" className={cn(alertVariants({ variant }), className)} {...props} />;
}

export { Alert };
