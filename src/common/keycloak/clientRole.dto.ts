import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class ClientRoleDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  composite?: boolean;

  @IsOptional()
  @IsBoolean()
  clientRole?: boolean;

  @IsOptional()
  @IsString()
  containerId?: string;
}

export class GetClientRolesQueryDto {
  @IsString()
  clientId: string;
}
