"use client"

// Custom toast wrapper that uses the built-in shadcn/ui toast system
// instead of sonner to avoid TDZ (Temporal Dead Zone) issues in production builds
import { toast as baseToast } from "@/hooks/use-toast"

const customToast = {
  success: (message: string) => {
    baseToast({
      title: message,
      variant: "default",
      style: {
        background: "#ecfdf5",
        color: "#065f46",
        border: "1px solid #a7f3d0",
      },
    })
  },
  error: (message: string) => {
    baseToast({
      title: message,
      variant: "destructive",
    })
  },
  info: (message: string) => {
    baseToast({
      title: message,
      variant: "default",
      style: {
        background: "#eff6ff",
        color: "#1e40af",
        border: "1px solid #bfdbfe",
      },
    })
  },
  loading: (message: string) => {
    baseToast({
      title: message,
      variant: "default",
      style: {
        background: "#f8f9fa",
        color: "#374151",
        border: "1px solid #e5e7eb",
      },
    })
  },
}

export { customToast as toast }
