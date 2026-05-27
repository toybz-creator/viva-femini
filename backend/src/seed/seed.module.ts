import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SeedService } from './seed.service';
import { Symptom, SymptomSchema } from '../schemas/symptom.schema';
import { Article, ArticleSchema } from '../schemas/article.schema';
import { Tip, TipSchema } from '../schemas/tip.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { Log, LogSchema } from '../schemas/log.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Symptom.name, schema: SymptomSchema },
      { name: Article.name, schema: ArticleSchema },
      { name: Tip.name, schema: TipSchema },
      { name: User.name, schema: UserSchema },
      { name: Log.name, schema: LogSchema },
    ]),
  ],
  providers: [SeedService],
})
export class SeedModule {}

