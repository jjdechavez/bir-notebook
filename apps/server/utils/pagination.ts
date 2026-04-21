export function buildPaginationMeta(
	total: number,
	perPage: number,
	currentPage: number,
	baseUrl: string,
) {
	const lastPage = Math.max(Math.ceil(total / perPage), 1)
	const firstPage = 1
	const pageParam = (page: number) => `${baseUrl}?page=${page}&limit=${perPage}`

	return {
		total,
		perPage,
		currentPage,
		lastPage,
		firstPage,
		firstPageUrl: pageParam(firstPage),
		lastPageUrl: pageParam(lastPage),
		nextPageUrl: currentPage < lastPage ? pageParam(currentPage + 1) : null,
		previousPageUrl: currentPage > 1 ? pageParam(currentPage - 1) : null,
	}
}
