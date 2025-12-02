import { IsString, IsInt, MinLength, Min, Max, IsOptional } from 'class-validator';

export class UpdateCatInput {
  @IsString() 
  id: string;

  @IsOptional() 
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  age?: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  breed?: string;
}
