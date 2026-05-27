import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { UserId } from '../common/decorators/user-id.decorator';

@ApiTags('Analytics')
@ApiBearerAuth()
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('cycle-history')
  @ApiOperation({ summary: 'Get cycle history and symptom frequencies for current user' })
  @ApiResponse({ status: 200, description: 'Return cycle history data.' })
  async getCycleHistory(@UserId() userId: string) {
    return this.analyticsService.getCycleHistory(userId);
  }

  @Get('predictions')
  @ApiOperation({ summary: 'Get predictions for next period and ovulation window' })
  @ApiResponse({ status: 200, description: 'Return calculated cycle predictions.' })
  async getPredictions(@UserId() userId: string) {
    return this.analyticsService.getPredictions(userId);
  }
}
