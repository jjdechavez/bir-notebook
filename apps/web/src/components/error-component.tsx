import { useRouter } from '@tanstack/react-router'
import { useQueryErrorResetBoundary } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export function GenericErrorComponent({ error }: { error: Error }) {
  const router = useRouter()
  const queryErrorResetBoundary = useQueryErrorResetBoundary()

  useEffect(() => {
    // Reset the query error boundary
    queryErrorResetBoundary.reset()
  }, [queryErrorResetBoundary])

  return (
    <div className="flex items-center justify-center h-full text-center">
      <div className="p-6 max-w-md">
        <h2 className="text-lg font-semibold mb-2 text-destructive">Error</h2>
        <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
        <Button
          onClick={() => {
            // Invalidate the route to reload the loader, and reset any router error boundaries
            router.invalidate()
          }}
          variant="outline"
        >
          Retry
        </Button>
      </div>
    </div>
  )
}
