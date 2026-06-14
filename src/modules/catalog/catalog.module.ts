import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  CityEntity,
  JobCategoryEntity,
  TagEntity,
} from '../../database/entities';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CityEntity, JobCategoryEntity, TagEntity]),
    UploadModule,
  ],
  controllers: [CatalogController],
  providers: [CatalogService],
})
export class CatalogModule {}
