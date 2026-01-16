# Keycloak Integration - Client Roles

This document describes how to retrieve client roles from a Keycloak server using the new API endpoints.

## Configuration

Add the following environment variables to your `.env` file:

```env
# Keycloak Configuration
KEYCLOAK_BASE_URL=http://localhost:8080
KEYCLOAK_REALM=your-realm
KEYCLOAK_CLIENT_ID=your-client-id
KEYCLOAK_CLIENT_SECRET=your-client-secret
KEYCLOAK_ADMIN_USERNAME=admin
KEYCLOAK_ADMIN_PASSWORD=admin
```

### Configuration Variables

- `KEYCLOAK_BASE_URL`: The base URL of your Keycloak server (e.g., `http://localhost:8080` or `https://keycloak.yourdomain.com`)
- `KEYCLOAK_REALM`: The name of the realm in Keycloak
- `KEYCLOAK_CLIENT_ID`: The client ID for authentication
- `KEYCLOAK_CLIENT_SECRET`: The client secret for authentication
- `KEYCLOAK_ADMIN_USERNAME`: The admin username for Keycloak (typically `admin`)
- `KEYCLOAK_ADMIN_PASSWORD`: The admin password for Keycloak

### Security Considerations

**Important:** The current implementation uses the `admin-cli` client with password grant type for simplicity. For production environments, consider:

1. **Use Client Credentials Flow**: Instead of username/password authentication, use a dedicated service account with client credentials grant type
2. **Implement Token Caching**: The service currently authenticates on every request. Implement token caching with proper expiration handling to reduce overhead
3. **Least Privilege**: Create a dedicated Keycloak user/service account with minimal permissions needed for role retrieval
4. **Secure Credential Storage**: Use secure credential management systems (e.g., HashiCorp Vault, AWS Secrets Manager) instead of environment variables in production

## API Endpoints

### 1. Get All Clients

Retrieves all clients in the configured realm.

**Endpoint:** `GET /keycloak/clients`

**Response:**
```json
{
  "status": 0,
  "message": "Clients retrieved successfully",
  "data": [
    {
      "id": "uuid-of-client",
      "clientId": "my-client",
      "name": "My Client Name"
    }
  ],
  "error": null
}
```

**Example:**
```bash
curl http://localhost:3000/keycloak/clients
```

### 2. Get All Roles for a Client

Retrieves all roles for a specific client.

**Endpoint:** `GET /keycloak/clients/:clientId/roles`

**Parameters:**
- `clientId` (path parameter): The client ID (not the UUID)

**Response:**
```json
{
  "status": 0,
  "message": "Roles for client 'my-client' retrieved successfully",
  "data": [
    {
      "id": "role-uuid",
      "name": "admin",
      "description": "Administrator role",
      "composite": false,
      "clientRole": true,
      "containerId": "client-uuid"
    },
    {
      "id": "role-uuid-2",
      "name": "user",
      "description": "User role",
      "composite": false,
      "clientRole": true,
      "containerId": "client-uuid"
    }
  ],
  "error": null
}
```

**Example:**
```bash
curl http://localhost:3000/keycloak/clients/my-client/roles
```

### 3. Get a Specific Role by Name

Retrieves a specific role by name for a client.

**Endpoint:** `GET /keycloak/clients/:clientId/roles/:roleName`

**Parameters:**
- `clientId` (path parameter): The client ID (not the UUID)
- `roleName` (path parameter): The name of the role

**Response:**
```json
{
  "status": 0,
  "message": "Role 'admin' for client 'my-client' retrieved successfully",
  "data": {
    "id": "role-uuid",
    "name": "admin",
    "description": "Administrator role",
    "composite": false,
    "clientRole": true,
    "containerId": "client-uuid"
  },
  "error": null
}
```

**Example:**
```bash
curl http://localhost:3000/keycloak/clients/my-client/roles/admin
```

## Response Status Codes

The API uses the following status codes in the response:

- `0` (SUCCESS): Request completed successfully
- `1` (ERROR): An error occurred
- `2` (EXCEPTION): An exception was thrown
- `5` (UNAUTHORIZED): Unauthorized access

## Error Handling

If an error occurs, the response will have the following structure:

```json
{
  "status": 1,
  "message": "Failed to retrieve roles for client 'my-client'",
  "data": null,
  "error": "Client with ID 'my-client' not found"
}
```

## Common Errors

1. **Client not found**
   - Error: `Client with ID 'xxx' not found`
   - Solution: Verify the client ID exists in your Keycloak realm

2. **Role not found**
   - Error: `Role 'xxx' not found for client 'yyy'`
   - Solution: Verify the role exists for the specified client

3. **Authentication failed**
   - Error: `Failed to authenticate with Keycloak`
   - Solution: Check your Keycloak admin credentials in the environment variables

4. **Connection error**
   - Error: Connection timeout or refused
   - Solution: Verify the Keycloak server URL and ensure the server is running

## Usage Example (JavaScript/TypeScript)

```typescript
// Get all clients
const clientsResponse = await fetch('http://localhost:3000/keycloak/clients');
const clientsData = await clientsResponse.json();

// Get all roles for a specific client
const rolesResponse = await fetch('http://localhost:3000/keycloak/clients/my-client/roles');
const rolesData = await rolesResponse.json();

// Get a specific role
const roleResponse = await fetch('http://localhost:3000/keycloak/clients/my-client/roles/admin');
const roleData = await roleResponse.json();

// Check if request was successful
if (roleData.status === 0) {
  console.log('Role retrieved:', roleData.data);
} else {
  console.error('Error:', roleData.error);
}
```

## Notes

- The Keycloak admin client authenticates with each request to ensure token freshness
- Client IDs are case-sensitive
- Role names are case-sensitive
- All endpoints return data in the standard API response format used throughout the application
