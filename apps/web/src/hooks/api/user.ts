import { tuyau } from '@/lib/tuyau'
import { useQuery } from '@tanstack/react-query'
import type { InferRequestType } from '@tuyau/react-query'

export const useUsers = (
  query?: InferRequestType<typeof tuyau.api.users.$get>,
) => {
  const usersQuery = tuyau.api.users.$get.queryOptions({ payload: query })
  return useQuery(usersQuery)
}
