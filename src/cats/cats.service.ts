import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cat } from './entities/cat.entity';
import { CreateCatInput } from './dto/create-cat.input';
import { UpdateCatInput } from './dto/update-cat.input';

@Injectable()
export class CatsService {
  constructor(
    @InjectModel(Cat.name) private readonly catModel: Model<Cat>,
  ) {}

  async findAll(): Promise<Cat[]> {
    return this.catModel.find();
  }

  async findOne(id: string): Promise<Cat | null> {
    return this.catModel.findById(id);
  }

  async create(createCatInput: CreateCatInput): Promise<Cat> {
    return this.catModel.create(createCatInput);
  }

  async update(updateCatInput: UpdateCatInput): Promise<Cat | null> {
    const { id, ...updateData } = updateCatInput;
    return this.catModel.findByIdAndUpdate(id, updateData, { new: true });
  }

  async remove(id: string): Promise<Cat | null> {
    return this.catModel.findByIdAndDelete(id);
  }
}
