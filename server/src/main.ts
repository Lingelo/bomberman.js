import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { GameGateway } from './game/game.gateway';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useLogger(app.get(Logger));
  app.enableCors();

  const gameGateway = app.get(GameGateway);

  const shutdown = async (signal: string) => {
    console.log(`\nReceived ${signal}, shutting down gracefully...`);
    gameGateway.broadcastServerShutdown();

    await new Promise(resolve => setTimeout(resolve, 500));
    await app.close();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🎮 Bomberman server running on http://localhost:${port}`);
}

bootstrap();
