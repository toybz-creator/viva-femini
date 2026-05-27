import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TrackingService } from './tracking.service';
import { CreateLogDto } from './dto/create-log.dto';
import { GetLogsQueryDto } from './dto/get-logs-query.dto';
import { UserId } from '../common/decorators/user-id.decorator';

@ApiTags('Tracking')
@ApiBearerAuth()
@Controller('tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Post('logs')
  @ApiOperation({ summary: 'Create a new tracking log' })
  @ApiBody({ type: CreateLogDto })
  @ApiResponse({
    status: 201,
    description: 'The log has been successfully created.',
  })
  async createLog(@UserId() userId: string, @Body() data: CreateLogDto) {
    return this.trackingService.createLog(userId, data);
  }

  @Get('logs')
  @ApiOperation({ summary: 'Get tracking logs for current user with optional filters' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Filter logs on or after this ISO date' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Filter logs on or before this ISO date' })
  @ApiQuery({ name: 'flow', required: false, description: 'Filter for logs with flow intensity ("true")' })
  @ApiQuery({ name: 'mood', required: false, description: 'Filter for logs with mood set ("true")' })
  @ApiQuery({ name: 'sexualHealth', required: false, description: 'Filter for logs with sexual health set ("true")' })
  @ApiQuery({ name: 'limit', required: false, description: 'Max number of logs to return (default 1000, max 5000)' })
  @ApiQuery({ name: 'skip', required: false, description: 'Number of logs to skip (default 0)' })
  @ApiResponse({ status: 200, description: 'Return all matching logs.' })
  async getLogs(
    @UserId() userId: string,
    @Query() query?: GetLogsQueryDto,
  ) {
    return this.trackingService.getLogs(userId, query);
  }

  @Get('symptoms')
  @ApiOperation({ summary: 'Get all available symptoms' })
  @ApiResponse({ status: 200, description: 'Return all symptoms.' })
  async getSymptoms() {
    return this.trackingService.getSymptoms();
  }
}
