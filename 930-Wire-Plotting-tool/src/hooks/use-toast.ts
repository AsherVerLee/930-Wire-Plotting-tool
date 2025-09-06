// Minimal stub for use-toast hook compatible with shadcn/ui Toaster
export function useToast() {
  return {
    toasts: [], // Empty array to prevent the map error
    toast: (opts: { title?: string; description?: string }) => {
      // No-op for now
      console.log('Toast:', opts);
    },
  };
}
