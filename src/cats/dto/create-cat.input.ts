import { IsString, IsInt, MinLength, Min, Max } from 'class-validator';

export class CreateCatInput {
  @IsString()
  @MinLength(1)
  name: string;

  @IsInt()
  @Min(1) 
  age: number;

  @IsString()
  @MinLength(1)
  breed: string;
}
