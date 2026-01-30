import { useEffect, useRef } from 'react'

export function useInfiniteScroll(
  hasNextPage: boolean,
  fetchNextPage: () => void,
  isFetchingNextPage: boolean,
) {
  const observerRef = useRef<IntersectionObserver | null>(null)
  const lastElementRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (isFetchingNextPage || !hasNextPage) return

    const element = lastElementRef.current
    if (!element) return

    if (observerRef.current) observerRef.current.disconnect()

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage()
        }
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px 100px 0px',
      },
    )

    observerRef.current.observe(element)

    return () => {
      if (observerRef.current) {
        observerRef.current.unobserve(element)
      }
    }
  }, [hasNextPage, fetchNextPage, isFetchingNextPage])

  return lastElementRef
}
