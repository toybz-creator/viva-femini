import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DashboardService, DashboardSummary } from './dashboard.service';
import { UserId } from '../common/decorators/user-id.decorator';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get dashboard summary for current user' })
  @ApiResponse({
    status: 200,
    description: 'Return the dashboard summary data.',
  })
  async getSummary(@UserId() userId: string): Promise<DashboardSummary> {
    return this.dashboardService.getSummary(userId);
  }
}
