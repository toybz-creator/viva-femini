import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Symptom } from '../tracking/schemas/symptom.schema';
import { Article } from '../dashboard/schemas/article.schema';
import { Tip } from '../dashboard/schemas/tip.schema';
import { User } from '../users/schemas/user.schema';
import { Log } from '../tracking/schemas/log.schema';
import { hashTokenToId } from '../common/utils/hash';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly defaultToken;
  private readonly defaultUserId;

  constructor(
    @InjectModel(Symptom.name) private symptomModel: Model<Symptom>,
    @InjectModel(Article.name) private articleModel: Model<Article>,
    @InjectModel(Tip.name) private tipModel: Model<Tip>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Log.name) private logModel: Model<Log>,
    private configService: ConfigService,
  ) {
    this.defaultToken = this.configService.get<string>(
      'DEFAULT_USER_TOKEN',
      '',
    );

    this.defaultUserId = hashTokenToId(this.defaultToken);
  }

  async onApplicationBootstrap() {
    console.log('--- Database Seeding Started ---');
    await this.seedUser();
    await this.seedSymptoms();
    await this.seedArticles();
    await this.seedTips();

    console.log('--- Database Seeding Completed ---');
  }

  private async seedUser() {
    const userExists = await this.userModel
      .findById(new Types.ObjectId(this.defaultUserId))
      .exec();
    if (userExists) {
      console.log('Default user already exists. Skipping user seeding.');
      return;
    }

    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    const user = {
      _id: new Types.ObjectId(this.defaultUserId),
      name: 'Jane Doe',
      email: 'jane.doe@example.com',
      avgCycleLength: 28,
      avgPeriodLength: 5,
      lastPeriodDate: new Date(year, month, 1), // Started on the 1st of the current month
    };

    await this.userModel.create(user);
    console.log(`Default user seeded with hashed ID: ${this.defaultUserId}`);
  }

  private async seedSymptoms() {
    const symptoms = [
      { name: 'Cramps', category: 'physical', icon: 'Droplet' },
      { name: 'Diarrhoea', category: 'physical', icon: 'Activity' },
      { name: 'Fatigue', category: 'physical', icon: 'Battery' },
      { name: 'Headache', category: 'physical', icon: 'Brain' },
      { name: 'Nausea', category: 'physical', icon: 'AlertCircle' },
      { name: 'Breast tenderness', category: 'physical', icon: 'Heart' },
      { name: 'Abdominal pain', category: 'physical', icon: 'Activity' },
      { name: 'Pelvic pain', category: 'physical', icon: 'Activity' },
      { name: 'Water retention', category: 'physical', icon: 'Droplet' },
      { name: 'Lower back pain', category: 'physical', icon: 'Activity' },
      { name: 'Appetite changes', category: 'physical', icon: 'Utensils' },

      { name: 'Happy', category: 'emotional', icon: 'Smile' },
      { name: 'Neutral', category: 'emotional', icon: 'Meh' },
      { name: 'Sad', category: 'emotional', icon: 'Frown' },
      { name: 'Low Motivation', category: 'emotional', icon: 'Cloud' },
      { name: 'Mood swings', category: 'emotional', icon: 'RefreshCcw' },
      { name: 'Irritability', category: 'emotional', icon: 'Flame' },
      { name: 'Cravings', category: 'emotional', icon: 'Cookie' },
      { name: 'Tearfulness', category: 'emotional', icon: 'Droplet' },
      {
        name: 'Difficulty Concentrating',
        category: 'emotional',
        icon: 'Focus',
      },

      { name: 'Bloating', category: 'digestion', icon: 'Wind' },
      { name: 'Constipation', category: 'digestion', icon: 'Activity' },
      { name: 'Loss of appetite', category: 'digestion', icon: 'Minus' },
      { name: 'Increased appetite', category: 'digestion', icon: 'Plus' },

      { name: 'Spotting', category: 'period', icon: 'Droplet' },
      { name: 'Heavier flow', category: 'period', icon: 'Droplet' },
      { name: 'Lighter flow', category: 'period', icon: 'Droplet' },
      { name: 'Vaginal Dryness', category: 'period', icon: 'Droplet' },

      { name: 'Increased sex drive', category: 'sexual', icon: 'Heart' },
      { name: 'Decreased sex drive', category: 'sexual', icon: 'HeartOff' },
      { name: 'Vaginal discharge', category: 'sexual', icon: 'Droplet' },
    ];

    for (const symptom of symptoms) {
      await this.symptomModel.updateOne(
        { name: symptom.name },
        { $setOnInsert: symptom },
        { upsert: true },
      );
    }

    console.log('Symptoms seeded/updated');
  }

  private async seedArticles() {
    const articleImagesByPhase = {
      menstrual:
        'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=900&q=80',
      follicular:
        'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=900&q=80',
      ovulatory:
        'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80',
      luteal:
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80',
    };

    const count = await this.articleModel.countDocuments();
    if (count > 0) {
      await Promise.all(
        Object.entries(articleImagesByPhase).map(([phase, imageUrl]) =>
          this.articleModel.updateMany(
            { phase, imageUrl: { $exists: false } },
            { $set: { imageUrl } },
          ),
        ),
      );
      console.log('Articles already seeded. Ensured image URLs are present.');
      return;
    }

    const articles = [
      // Menstrual Phase
      {
        title: 'Understanding your Menstrual Phase: A Guide to Rest',
        content:
          'During your period, progesterone and estrogen levels are at their lowest, which can lead to low energy. Focus on deep rest, self-compassion, and gentle breathing exercises.',
        phase: 'menstrual',
        imageUrl: articleImagesByPhase.menstrual,
      },
      {
        title: 'The Power of Slow Movement: Yoga for Period Cramps',
        content:
          'Gentle, restorative yoga poses can help relieve pelvic congestion and reduce menstrual cramps. Avoid strenuous twists or inversions, and focus on deep abdominal relaxation.',
        phase: 'menstrual',
        imageUrl: articleImagesByPhase.menstrual,
      },
      {
        title: 'Iron-Rich Foods to Nourish Your Body During Your Flow',
        content:
          'Replenishing lost iron is crucial during the menstrual phase. Incorporate iron-rich foods like dark leafy greens, legumes, and lean protein along with Vitamin C to support absorption.',
        phase: 'menstrual',
        imageUrl: articleImagesByPhase.menstrual,
      },
      {
        title: 'Self-Care Rituals for Menstrual Comfort',
        content:
          'Warm baths, heating pads, and loose clothing are simple ways to soothe physical discomfort. Take this time to reflect, journal, and slow down your schedule.',
        phase: 'menstrual',
        imageUrl: articleImagesByPhase.menstrual,
      },
      {
        title: 'Hormones 101: What Happens During Your Bleed',
        content:
          'The shedding of the uterine lining marks day 1 of your cycle. Learn how your pituitary and ovarian hormones coordinate to begin the process anew.',
        phase: 'menstrual',
        imageUrl: articleImagesByPhase.menstrual,
      },

      // Follicular Phase
      {
        title: 'Boosting Energy in Follicular Phase: Ride the Wave',
        content:
          'As estrogen starts rising, your energy levels, stamina, and brainpower begin to scale up. It is the perfect time to start new projects, set goals, and socialize.',
        phase: 'follicular',
        imageUrl: articleImagesByPhase.follicular,
      },
      {
        title: 'Creative Spark: Why the Follicular Phase is Best for Planning',
        content:
          'Higher estrogen levels enhance neuroplasticity and cognitive flexibility, boosting creativity. Leverage this window to brainstorm and schedule new endeavors.',
        phase: 'follicular',
        imageUrl: articleImagesByPhase.follicular,
      },
      {
        title: 'High-Intensity Workouts for Your Follicular Strength',
        content:
          'Your muscles are highly receptive to training now. Safe, intensive cardio, strength, and HIIT sessions feel easier and yield great conditioning results during this phase.',
        phase: 'follicular',
        imageUrl: articleImagesByPhase.follicular,
      },
      {
        title: 'Phased Nutrition: Seeds and Fresh Greens for Estrogen Support',
        content:
          'Support your rising estrogen naturally by adding pumpkin and flax seeds, sprouted beans, and fermented foods to help clear excess hormones smoothly.',
        phase: 'follicular',
        imageUrl: articleImagesByPhase.follicular,
      },
      {
        title: 'Social Butterfly: Maximizing Connections Post-Period',
        content:
          'Communication centers in the brain are highly active post-bleed. Connect with friends, pitch big ideas, and enjoy natural extroverted tendencies.',
        phase: 'follicular',
        imageUrl: articleImagesByPhase.follicular,
      },

      // Ovulatory Phase
      {
        title: 'Nutrition for Ovulation: Fueling Your Peak Energy',
        content:
          'Your body is working hard during ovulation. Focus on hydration, fiber, and anti-inflammatory foods like berries, quinoa, and essential fatty acids to aid follicle health.',
        phase: 'ovulatory',
        imageUrl: articleImagesByPhase.ovulatory,
      },
      {
        title: 'The Science of Fertility: Recognizing Your Ovulation Window',
        content:
          'Understanding your ovulation signs (like changes in body temperature and cervical fluid) can help you map your fertile window for conception or body awareness.',
        phase: 'ovulatory',
        imageUrl: articleImagesByPhase.ovulatory,
      },
      {
        title: 'Communication and Confidence: Capitalizing on Estrogen Peaks',
        content:
          'Peak levels of estrogen and testosterone enhance confidence, focus, and verbal articulation. It is a prime window for public speaking and key conversations.',
        phase: 'ovulatory',
        imageUrl: articleImagesByPhase.ovulatory,
      },
      {
        title: 'Supporting Libido: Natural Ways to Enhance Ovulatory Vitality',
        content:
          'A natural spike in libido is typical during this phase. Connect with your partner or enjoy active self-care routines that celebrate physical expression.',
        phase: 'ovulatory',
        imageUrl: articleImagesByPhase.ovulatory,
      },
      {
        title: 'Cardio and Strength: Peak Performance Workouts',
        content:
          'Stamina is at its peak. Push your personal bests, but ensure a solid warm-up to protect joints which can be slightly looser due to high estrogen.',
        phase: 'ovulatory',
        imageUrl: articleImagesByPhase.ovulatory,
      },

      // Luteal Phase
      {
        title: 'Managing PMS in Luteal Phase: Mind and Body Balance',
        content:
          'Progesterone rises, making you feel introspective and naturally slower. PMS can occur if hormones drop sharply; manage with light routines and supportive supplements.',
        phase: 'luteal',
        imageUrl: articleImagesByPhase.luteal,
      },
      {
        title: 'Nourishing Comfort Foods for Progesterone Production',
        content:
          'Opt for complex carbohydrates like sweet potato, brown rice, and root veggies to stabilize blood sugar and combat luteal sugar cravings.',
        phase: 'luteal',
        imageUrl: articleImagesByPhase.luteal,
      },
      {
        title: 'The Power of Saying No: Boundary Setting in Luteal Phase',
        content:
          'As energy shifts inward, say no to unnecessary social commitments. Prioritize quiet environments, gentle reading, and evening wind-down rituals.',
        phase: 'luteal',
        imageUrl: articleImagesByPhase.luteal,
      },
      {
        title: 'Deep Sleep Strategies: Tackling Luteal Insomnia',
        content:
          'Higher body temperature and shifting hormones can disrupt sleep. Keep your bedroom cool, avoid screens before bed, and try magnesium-rich snacks.',
        phase: 'luteal',
        imageUrl: articleImagesByPhase.luteal,
      },
      {
        title: 'Gentle Cardio and Strength: Adapting to Lower Energy',
        content:
          'Transition workouts from HIIT to pilates, steady-state walking, and restorative strength. Listen to your body and honor its need to slow down.',
        phase: 'luteal',
        imageUrl: articleImagesByPhase.luteal,
      },
    ];

    await this.articleModel.insertMany(articles);
    console.log('20 Phase-specific Articles seeded (5 per phase)');
  }

  private async seedTips() {
    const count = await this.tipModel.countDocuments();
    if (count > 0) {
      console.log('Tips already seeded. Skipping tip seeding.');
      return;
    }

    const tips = [
      {
        title: 'Hydration Focus',
        content:
          'Drink plenty of water to reduce bloating and support your uterine muscles.',
        phase: 'menstrual',
        icon: 'Droplet',
        hashTag: '#menstrualhealth',
      },
      {
        title: 'Try Something New',
        content:
          'Your brain is highly adaptable post-bleed. Perfect time to start a new project or hobby!',
        phase: 'follicular',
        icon: 'Brain',
        hashTag: '#newbeginnings',
      },
      {
        title: 'Peak Energy Workout',
        content:
          'Your estrogen and testosterone are high. Push yourself with a solid strength or cardio session!',
        phase: 'ovulatory',
        icon: 'Flame',
        hashTag: '#ovulationpeak',
      },
      {
        title: 'Prioritize Sleep',
        content:
          'Progesterone makes you naturally introspective and slower. Rest deeply and wind down early.',
        phase: 'luteal',
        icon: 'Moon',
        hashTag: '#lutealphase',
      },
    ];

    await this.tipModel.insertMany(tips);
    console.log('Tips with title, icon, and hashTag seeded');
  }
}
