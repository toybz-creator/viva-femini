import { Controller, Get } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from '../schemas/user.schema';
import { UserId } from '../common/decorators/user-id.decorator';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { serializeMongoRecord } from '../common/utils/serializers';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user details' })
  @ApiResponse({ status: 200, description: 'Return current user details.' })
  async getMe(@UserId() userId: string) {
    const user = await this.userModel.findById(new Types.ObjectId(userId)).lean().exec();
    if (!user) {
      // For seamless local and production onboarding, automatically create a default profile if not found
      const createdUser = await this.userModel.create({
        _id: new Types.ObjectId(userId),
        name: 'Jane Doe',
        email: `jane-${userId.substring(0, 8)}@example.com`,
        avgCycleLength: 28,
        avgPeriodLength: 5,
        lastPeriodDate: new Date(new Date().setDate(new Date().getDate() - 10)), // 10 days ago
      });
      return serializeMongoRecord(createdUser.toObject());
    }
    return serializeMongoRecord(user);
  }
}
