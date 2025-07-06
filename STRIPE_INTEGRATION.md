# Integración con Stripe - Generación de Links de Pago

Esta integración permite generar links de pago utilizando Stripe para procesar transacciones en la aplicación.

## Configuración

### 1. Variables de Entorno

Copia el archivo `.env.example` a `.env` y configura las siguientes variables:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_tu_clave_secreta_de_stripe
STRIPE_PUBLISHABLE_KEY=pk_test_tu_clave_publica_de_stripe
STRIPE_WEBHOOK_SECRET=whsec_tu_secret_de_webhook

# Application URLs
APP_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3001
```

### 2. Configuración de Webhooks en Stripe

1. Ve a tu Dashboard de Stripe
2. Navega a Developers > Webhooks
3. Crea un nuevo endpoint con la URL: `https://tu-dominio.com/payment/webhook`
4. Selecciona los siguientes eventos:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`

## API Endpoints

### Generar Link de Pago

**POST** `/payment/generate`

```json
{
  "TransactionCode": "TXN123456"
}
```

**Respuesta:**
```json
{
  "status": 0,
  "message": "Payment link generated successfully.",
  "data": {
    "paymentUrl": "https://buy.stripe.com/test_xxxxx",
    "paymentId": "plink_xxxxx"
  },
  "error": null
}
```

### Consultar Estado del Pago

**GET** `/payment/status/:transactionCode`

**Respuesta:**
```json
{
  "status": 0,
  "message": "Payment status retrieved successfully.",
  "data": {
    "status": "pending", // pending, completed, failed, canceled
    "paymentUrl": "https://buy.stripe.com/test_xxxxx",
    "paymentId": "plink_xxxxx"
  },
  "error": null
}
```

### Webhook de Stripe

**POST** `/payment/webhook`

Este endpoint recibe las notificaciones de Stripe y actualiza automáticamente el estado de los pagos.

## Estructura de Base de Datos

Se han agregado los siguientes campos a la entidad `TransactionPayment`:

- `StripePaymentLinkId`: ID del Payment Link de Stripe
- `StripeCheckoutSessionId`: ID de la sesión de checkout (si se usa)
- `PaymentUrl`: URL del link de pago
- `PaymentStatus`: Estado del pago (pending, completed, failed, canceled)

## Servicios Disponibles

### StripeService

Proporciona métodos para:

- `createPaymentLink()`: Crear un Payment Link
- `createCheckoutSession()`: Crear una sesión de checkout
- `retrievePaymentLink()`: Obtener información de un Payment Link
- `retrieveCheckoutSession()`: Obtener información de una sesión
- `constructWebhookEvent()`: Procesar eventos de webhook

### Handlers

- `GeneratePaymentHandler`: Maneja la generación de links de pago
- `GetPaymentStatusHandler`: Consulta el estado de un pago
- `UpdatePaymentStatusHandler`: Actualiza el estado de un pago

## Tipos de Pago Soportados

1. **Payment Links**: Links directos que se pueden compartir
2. **Checkout Sessions**: Sesiones de checkout más personalizables

## Seguridad

- Todos los webhooks son verificados usando la firma de Stripe
- Las claves secretas se manejan a través de variables de entorno
- Los eventos no autorizados son rechazados

## Testing

Para probar la integración:

1. Usa las claves de test de Stripe
2. Usa números de tarjeta de prueba de Stripe:
   - Éxito: `4242 4242 4242 4242`
   - Fallo: `4000 0000 0000 0002`
3. Configura ngrok para recibir webhooks en desarrollo:
   ```bash
   ngrok http 3000
   ```

## Monitoreo

Los eventos de Stripe se registran en la consola y pueden ser monitoreados en el Dashboard de Stripe.
