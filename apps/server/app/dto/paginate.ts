export class PaginateDto {
  constructor(private meta: any) {}

  metaToJson() {
    return {
      total: this.meta.total as number,
      perPage: this.meta.perPage as number,
      currentPage: this.meta.currentPage as number,
      lastPage: this.meta.lastPage as number,
      firstPage: this.meta.firstPage as number,
      firstPageUrl: this.meta.firstPageUrl as string,
      lastPageUrl: this.meta.lastPageUrl as string,
      nextPageUrl: this.meta.nextPageUrl as string,
      previousPageUrl: this.meta.previousPageUrl as string,
    }
  }
}
