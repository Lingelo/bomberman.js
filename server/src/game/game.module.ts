import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { RoomManager } from './room-manager';

@Module({
  providers: [GameGateway, RoomManager],
  exports: [RoomManager, GameGateway],
})
export class GameModule {}
