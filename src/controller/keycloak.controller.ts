import { Controller, Get, Param } from '@nestjs/common';
import { KeycloakService } from 'src/services/keycloak/keycloak.service';
import { ApiResponse } from 'src/common/response/apiResponse.dto';
import { ResponseCode } from 'src/common/response/responseCode';
import { ClientRoleDto } from 'src/common/keycloak/clientRole.dto';

@Controller('keycloak')
export class KeycloakController {
  constructor(private readonly keycloakService: KeycloakService) {}

  /**
   * Get all clients in the realm
   * @returns List of clients
   */
  @Get('/clients')
  async getClients(): Promise<
    ApiResponse<{ id: string; clientId: string; name?: string }[]>
  > {
    try {
      const clients = await this.keycloakService.getClients();
      return {
        status: ResponseCode.SUCCESS,
        message: 'Clients retrieved successfully',
        data: clients,
        error: null,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return {
        status: ResponseCode.ERROR,
        message: 'Failed to retrieve clients',
        data: null,
        error: errorMessage,
      };
    }
  }

  /**
   * Get all roles for a specific client
   * @param clientId - The client ID
   * @returns List of roles for the client
   */
  @Get('/clients/:clientId/roles')
  async getClientRoles(
    @Param('clientId') clientId: string,
  ): Promise<ApiResponse<ClientRoleDto[]>> {
    try {
      const roles = await this.keycloakService.getClientRoles(clientId);
      return {
        status: ResponseCode.SUCCESS,
        message: `Roles for client '${clientId}' retrieved successfully`,
        data: roles,
        error: null,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return {
        status: ResponseCode.ERROR,
        message: `Failed to retrieve roles for client '${clientId}'`,
        data: null,
        error: errorMessage,
      };
    }
  }

  /**
   * Get a specific role by name for a client
   * @param clientId - The client ID
   * @param roleName - The role name
   * @returns The specific role
   */
  @Get('/clients/:clientId/roles/:roleName')
  async getClientRoleByName(
    @Param('clientId') clientId: string,
    @Param('roleName') roleName: string,
  ): Promise<ApiResponse<ClientRoleDto>> {
    try {
      const role = await this.keycloakService.getClientRoleByName(
        clientId,
        roleName,
      );
      return {
        status: ResponseCode.SUCCESS,
        message: `Role '${roleName}' for client '${clientId}' retrieved successfully`,
        data: role,
        error: null,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return {
        status: ResponseCode.ERROR,
        message: `Failed to retrieve role '${roleName}' for client '${clientId}'`,
        data: null,
        error: errorMessage,
      };
    }
  }
}
