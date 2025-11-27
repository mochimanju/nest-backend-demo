import { Module } from '@nestjs/common';
import { CatsService } from './cats.service';
import { CatsResolver } from './cats.resolver';
import { MongooseModule } from '@nestjs/mongoose';
import { Cat, CatSchema } from './entities/cat.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Cat.name, schema: CatSchema }]),
  ],
  providers: [CatsResolver, CatsService],
})
export class CatsModule {}
