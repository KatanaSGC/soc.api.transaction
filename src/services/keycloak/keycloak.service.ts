import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import KcAdminClient from '@keycloak/keycloak-admin-client';
import { ClientRoleDto } from 'src/common/keycloak/clientRole.dto';

@Injectable()
export class KeycloakService {
  private readonly logger = new Logger(KeycloakService.name);
  private kcAdminClient: KcAdminClient;
  private realm: string;

  constructor(private configService: ConfigService) {
    const baseUrl = this.configService.get<string>('KEYCLOAK_BASE_URL');
    const realm = this.configService.get<string>('KEYCLOAK_REALM');

    if (!baseUrl || !realm) {
      throw new Error(
        'Keycloak configuration is incomplete. Please ensure KEYCLOAK_BASE_URL and KEYCLOAK_REALM are set in environment variables.',
      );
    }

    this.realm = realm;
    this.kcAdminClient = new KcAdminClient({
      baseUrl,
      realmName: this.realm,
    });
  }

  /**
   * Authenticate with Keycloak admin API
   * 
   * NOTE: This uses the admin-cli client with password grant type for simplicity.
   * For production environments, consider:
   * - Using client credentials flow with a dedicated service account
   * - Implementing token caching with expiration handling to reduce authentication overhead
   * - Using a more secure authentication method
   */
  private async authenticate(): Promise<void> {
    try {
      const username = this.configService.get<string>('KEYCLOAK_ADMIN_USERNAME');
      const password = this.configService.get<string>('KEYCLOAK_ADMIN_PASSWORD');

      if (!username || !password) {
        throw new Error(
          'Keycloak admin credentials are missing. Please ensure KEYCLOAK_ADMIN_USERNAME and KEYCLOAK_ADMIN_PASSWORD are set.',
        );
      }

      await this.kcAdminClient.auth({
        username,
        password,
        grantType: 'password',
        clientId: 'admin-cli',
      });
      this.logger.log('Successfully authenticated with Keycloak');
    } catch (error) {
      this.logger.error('Failed to authenticate with Keycloak', error);
      throw new Error('Failed to authenticate with Keycloak');
    }
  }

  /**
   * Get all roles for a specific client
   * @param clientId - The client ID (not the technical UUID)
   * @returns Array of client roles
   */
  async getClientRoles(clientId: string): Promise<ClientRoleDto[]> {
    try {
      await this.authenticate();

      // Set the realm for the current request
      this.kcAdminClient.setConfig({
        realmName: this.realm,
      });

      // Find the client by clientId
      const clients = await this.kcAdminClient.clients.find({ clientId });

      if (!clients || clients.length === 0) {
        throw new Error(`Client with ID '${clientId}' not found`);
      }

      const client = clients[0];
      this.logger.log(`Found client: ${client.clientId} (${client.id})`);

      // Get roles for the client
      const roles = await this.kcAdminClient.clients.listRoles({
        id: client.id!,
      });

      this.logger.log(
        `Retrieved ${roles.length} roles for client '${clientId}'`,
      );

      return roles.map((role) => ({
        id: role.id!,
        name: role.name!,
        description: role.description,
        composite: role.composite,
        clientRole: role.clientRole,
        containerId: role.containerId,
      }));
    } catch (error) {
      this.logger.error(
        `Error retrieving client roles for '${clientId}'`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get a specific role by name for a client
   * @param clientId - The client ID
   * @param roleName - The role name
   * @returns The client role
   */
  async getClientRoleByName(
    clientId: string,
    roleName: string,
  ): Promise<ClientRoleDto> {
    try {
      await this.authenticate();

      this.kcAdminClient.setConfig({
        realmName: this.realm,
      });

      // Find the client by clientId
      const clients = await this.kcAdminClient.clients.find({ clientId });

      if (!clients || clients.length === 0) {
        throw new Error(`Client with ID '${clientId}' not found`);
      }

      const client = clients[0];

      // Get specific role
      const role = await this.kcAdminClient.clients.findRole({
        id: client.id!,
        roleName,
      });

      if (!role) {
        throw new Error(
          `Role '${roleName}' not found for client '${clientId}'`,
        );
      }

      this.logger.log(`Retrieved role '${roleName}' for client '${clientId}'`);

      return {
        id: role.id!,
        name: role.name!,
        description: role.description,
        composite: role.composite,
        clientRole: role.clientRole,
        containerId: role.containerId,
      };
    } catch (error) {
      this.logger.error(
        `Error retrieving role '${roleName}' for client '${clientId}'`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get all clients in the realm
   * @returns Array of clients with basic information
   */
  async getClients(): Promise<
    { id: string; clientId: string; name?: string }[]
  > {
    try {
      await this.authenticate();

      this.kcAdminClient.setConfig({
        realmName: this.realm,
      });

      const clients = await this.kcAdminClient.clients.find();

      this.logger.log(
        `Retrieved ${clients.length} clients from realm '${this.realm}'`,
      );

      return clients.map((client) => ({
        id: client.id!,
        clientId: client.clientId!,
        name: client.name,
      }));
    } catch (error) {
      this.logger.error('Error retrieving clients', error);
      throw error;
    }
  }
}
