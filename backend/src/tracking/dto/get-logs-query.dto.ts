import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class GetLogsQueryDto {
  @ApiPropertyOptional({ description: 'Filter logs on or after this ISO date' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter logs on or before this ISO date' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Filter for logs with flow intensity ("true")' })
  @IsIn(['true', 'false'])
  @IsOptional()
  flow?: string;

  @ApiPropertyOptional({ description: 'Filter for logs with mood set ("true")' })
  @IsIn(['true', 'false'])
  @IsOptional()
  mood?: string;

  @ApiPropertyOptional({ description: 'Filter for logs with sexual health set ("true")' })
  @IsIn(['true', 'false'])
  @IsOptional()
  sexualHealth?: string;

  @ApiPropertyOptional({ description: 'Max number of logs to return', default: 1000, maximum: 5000 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5000)
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ description: 'Number of logs to skip', default: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  skip?: number;
}

