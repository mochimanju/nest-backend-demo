import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { CatsService } from './cats.service';
import { CreateCatInput } from './dto/create-cat.input';
import { UpdateCatInput } from './dto/update-cat.input';

// ตัว Resolver สำหรับจัดการ GraphQL requests
@Resolver('Cat')
export class CatsResolver {
  constructor(private readonly catsService: CatsService) {}

  @Query('getAllCats')
  findAll() {
    return this.catsService.findAll();
  }

  @Query('getCatById')
  findOne(@Args('id') id: string) {
    return this.catsService.findOne(id);
  }

  @Mutation('createCat')
  create(@Args('createCatInput') createCatInput: CreateCatInput) {
    return this.catsService.create(createCatInput);
  }

  @Mutation('updateCat')
  update(@Args('updateCatInput') updateCatInput: UpdateCatInput) {
    return this.catsService.update(updateCatInput);
  }

  @Mutation('deleteCat')
  delete(@Args('id') id: string) {
    return this.catsService.remove(id);
  }
}
