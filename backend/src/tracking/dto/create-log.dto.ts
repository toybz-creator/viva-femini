import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsOptional,
  IsArray,
  IsString,
  IsInt,
  IsMongoId,
  Min,
  Max,
} from 'class-validator';
import { CreateLogRequest } from '@viva-femini/shared';

export class CreateLogDto implements CreateLogRequest {
  @ApiPropertyOptional({
    description: 'The date of the log entry',
    example: '2023-04-15',
  })
  @IsDateString()
  @IsOptional()
  date?: string;

  @ApiPropertyOptional({ description: 'Array of symptom IDs', type: [String] })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  symptoms?: string[];

  @ApiPropertyOptional({
    description: 'User ID if manually provided',
    example: '60d0fe4f5311236168a109ca',
  })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({
    description: 'User mood',
    example: 'Happy',
  })
  @IsString()
  @IsOptional()
  mood?: string;

  @ApiPropertyOptional({
    description: 'Flow intensity (0-10 scale)',
    example: 3,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10)
  @IsOptional()
  flowIntensity?: number;

  @ApiPropertyOptional({
    description: 'Sexual health details',
    example: 'High libido',
  })
  @IsString()
  @IsOptional()
  sexualHealth?: string;

  @ApiPropertyOptional({
    description: 'Additional tracking notes',
    example: 'Felt active today.',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description:
      'Flow intensity (alternative field for backward compatibility)',
    example: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10)
  @IsOptional()
  flow?: number;
}
