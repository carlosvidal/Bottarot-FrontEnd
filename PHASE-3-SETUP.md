# 🔮 Bottarot - Fase 3: Integración de Pagos con PayPal

## ✅ Implementación Completada

La Fase 3 ha sido implementada exitosamente con todas las funcionalidades de pago y suscripciones.

## 🛠️ Configuración Requerida

### 1. Base de Datos (Supabase)

**Ejecutar el SQL Schema:**
```sql
-- Ejecutar en Supabase SQL Editor
-- El archivo supabase-schema.sql contiene todo el esquema necesario
```

### 2. Variables de Entorno PayPal

**Backend (.env):**
```env
PAYPAL_CLIENT_ID=YOUR_PAYPAL_CLIENT_ID_SANDBOX
PAYPAL_CLIENT_SECRET=YOUR_PAYPAL_CLIENT_SECRET_SANDBOX
PAYPAL_ENVIRONMENT=sandbox
```

**Frontend (.env.development):**
```env
VITE_PAYPAL_CLIENT_ID=YOUR_PAYPAL_CLIENT_ID_SANDBOX
```

**Frontend (.env.production):**
```env
VITE_PAYPAL_CLIENT_ID=YOUR_PAYPAL_CLIENT_ID_PRODUCTION
```

### 3. Configurar PayPal Developer Account

1. Ve a [PayPal Developer](https://developer.paypal.com/)
2. Crea una aplicación en Sandbox
3. Obtén Client ID y Client Secret
4. Configura las variables de entorno

## 🏗️ Arquitectura Implementada

### Backend Endpoints

- `GET /api/subscription-plans` - Obtener planes disponibles
- `POST /api/payments/create-order` - Crear orden de PayPal
- `POST /api/payments/capture-order` - Capturar pago
- `GET /api/user/subscription/:userId` - Info de suscripción del usuario
- `GET /api/user/can-ask/:userId` - Verificar si puede hacer pregunta
- `POST /api/user/question` - Registrar pregunta del usuario

### Frontend Components

- `PayPalButton.vue` - Botón de pago con PayPal integrado
- `Checkout.vue` - Página de checkout con selección de planes
- Auth Store extendido con funciones de suscripción

### Base de Datos Schema

- `subscription_plans` - Planes de suscripción disponibles
- `user_subscriptions` - Suscripciones activas de usuarios
- `payment_transactions` - Historial de transacciones
- `user_questions` - Registro de preguntas para límites

## 💡 Funcionalidades

### Planes de Suscripción

1. **Gratuito**: 1 pregunta por semana
2. **Semana de Lanzamiento**: $1 - Preguntas ilimitadas por 7 días
3. **Ilimitado Semanal**: $5 - Preguntas ilimitadas por 7 días

### Sistema de Límites

- Verificación automática de límites por plan
- Contador de preguntas por período
- Bloqueo automático cuando se alcanzan límites
- Renovación automática de límites por período

### Flujo de Pago

1. Usuario selecciona plan en `/checkout`
2. PayPal procesa el pago
3. Sistema actualiza suscripción automáticamente
4. Usuario obtiene acceso inmediato a funciones premium

## 🔧 Funciones del Auth Store

### Propiedades de Suscripción

- `userSubscription` - Info completa de suscripción
- `isSubscriptionActive` - Si tiene suscripción activa
- `isPremiumUser` - Si es usuario premium
- `canAskQuestion` - Si puede hacer una pregunta
- `questionsRemaining` - Preguntas restantes en el período
- `currentPlan` - Nombre del plan actual

### Funciones de Suscripción

- `loadUserSubscription()` - Cargar info de suscripción
- `checkCanAskQuestion()` - Verificar permisos
- `recordQuestion()` - Registrar pregunta realizada

## 🧪 Testing

### PayPal Sandbox

1. Configurar Client ID de sandbox en variables de entorno
2. Usar cuentas de prueba de PayPal
3. Verificar flujo completo de pago
4. Confirmar activación de suscripción

### Base de Datos

```sql
-- Verificar planes insertados
SELECT * FROM subscription_plans;

-- Verificar funciones de límites
SELECT can_user_ask_question('USER_UUID_HERE');

-- Verificar info de suscripción
SELECT * FROM get_user_subscription_info('USER_UUID_HERE');
```

## 🚀 Deployment

### Producción

1. **PayPal**: Cambiar a credenciales de producción
2. **Backend**: Configurar variables en Render.com
3. **Frontend**: Configurar variables en Netlify
4. **Base de Datos**: Ejecutar schema en Supabase producción

### Variables de Producción

```env
# Backend
PAYPAL_CLIENT_ID=YOUR_PRODUCTION_CLIENT_ID
PAYPAL_CLIENT_SECRET=YOUR_PRODUCTION_CLIENT_SECRET
PAYPAL_ENVIRONMENT=production

# Frontend (Netlify Dashboard)
VITE_PAYPAL_CLIENT_ID=YOUR_PRODUCTION_CLIENT_ID
```

## 🔒 Seguridad

### Validaciones Implementadas

- Verificación de transacciones en backend
- Validación de usuarios autenticados
- Verificación de planes existentes
- Row Level Security (RLS) en Supabase
- Sanitización de datos de entrada

### Funciones de Seguridad

- Todas las operaciones requieren autenticación
- Usuarios solo ven sus propios datos
- Validación server-side de permisos
- Logs de transacciones para auditoría

## 📊 Monitoreo

### Métricas Importantes

- Tasa de conversión en checkout
- Abandono en flujo de pago
- Errors en transacciones PayPal
- Uso de preguntas por plan

### Logs a Supervisar

- Errores de PayPal API
- Fallos en captura de pagos
- Problemas de sincronización de suscripciones
- Errores en verificación de límites

## 🎯 Próximos Pasos

1. **Testing exhaustivo** en sandbox
2. **Configurar webhooks** de PayPal para renovaciones
3. **Implementar cancelación** de suscripciones
4. **Analytics** de conversión y uso
5. **Notificaciones** de límites y renovaciones

---

*Fase 3 completada: Sistema de pagos y suscripciones totalmente funcional*