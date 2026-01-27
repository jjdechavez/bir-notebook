import { useEffect, useRef } from 'react'

export function useInfiniteScroll(
  hasNextPage: boolean,
  fetchNextPage: () => void,
  isFetchingNextPage: boolean,
) {
  const observerRef = useRef<IntersectionObserver | null>(null)
  const lastElementRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const element = lastElementRef.current
    if (!element) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { threshold: 0.1 },
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
