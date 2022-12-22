import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class editBookmarkDto {
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  link: string;

  @IsString()
  @IsOptional()
  description: string;
}
