import { IsString, Length, Matches } from 'class-validator';

export class JoinRoomDto {
  @IsString()
  @Length(1, 50)
  roomId: string;

  @IsString()
  @Length(1, 30)
  @Matches(/^[a-zA-Z0-9_\s\-]+$/, {
    message: 'Name can only contain letters, numbers, spaces, underscores and hyphens',
  })
  name: string;
}
