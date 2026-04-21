import { Controller, Get } from '@nestjs/common';
import { CatalogService } from './catalog.service';

@Controller()
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('cities')
  listCities() {
    return this.catalog.listCities();
  }

  @Get('job-categories')
  listJobCategories() {
    return this.catalog.listJobCategories();
  }

  @Get('tags')
  listTags() {
    return this.catalog.listTags();
  }

  @Get('catalog/job-form')
  jobFormCatalog() {
    return this.catalog.jobFormCatalog();
  }
}
