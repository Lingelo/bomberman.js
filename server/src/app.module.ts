import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { GameModule } from './game/game.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL || 'info',
        transport:
          process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: {
                  singleLine: false,
                  colorize: true,
                  translateTime: 'HH:MM:ss Z',
                  ignore: 'pid,hostname',
                },
              }
            : undefined,
      },
    }),
    GameModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
