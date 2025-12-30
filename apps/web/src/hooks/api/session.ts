import { tuyau } from '@/main'
import { useQuery } from '@tanstack/react-query'

export const useSession = () => {
  return useQuery(tuyau.api.session.$get.queryOptions())
}
