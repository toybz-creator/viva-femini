import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Log, LogSchema } from '../tracking/schemas/log.schema';
import { Article, ArticleSchema } from './schemas/article.schema';
import { Tip, TipSchema } from './schemas/tip.schema';
import { TrackingModule } from '../tracking/tracking.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Log.name, schema: LogSchema },
      { name: Article.name, schema: ArticleSchema },
      { name: Tip.name, schema: TipSchema },
    ]),
    TrackingModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
