import { IsEnum, IsNumber, IsOptional, Min, Max } from 'class-validator';

export enum ActionType {
  MOVE = 'MOVE',
  STOP = 'STOP',
  DROP_BOMB = 'DROP_BOMB',
  DETONATE = 'DETONATE',
}

export class PlayerActionDto {
  @IsEnum(ActionType)
  type: ActionType;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  direction?: number;
}
