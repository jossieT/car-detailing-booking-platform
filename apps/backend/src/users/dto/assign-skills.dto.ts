import { IsArray, IsUUID } from 'class-validator';

export class AssignSkillsDto {
  @IsArray()
  @IsUUID('4', { each: true })
  serviceIds: string[];
}