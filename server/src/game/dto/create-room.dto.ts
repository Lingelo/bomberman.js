import { IsString, Length, Matches } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  @Length(1, 30)
  @Matches(/^[a-zA-Z0-9_\s\-]+$/, {
    message: 'Room name can only contain letters, numbers, spaces, underscores and hyphens',
  })
  name: string;
}
