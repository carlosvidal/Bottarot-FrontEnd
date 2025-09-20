# 🔮 Bottarot - Roadmap de Desarrollo

## Fases Completadas ✅

### Fase 1: Estructura Base ✅
- **Objetivo**: Establecer la base del proyecto con Vue.js y componentes principales.
- **Componentes**: Landing, Chat, Router, Autenticación simulada.
- **Estado**: ✅ **COMPLETADO**

### Fase 2: Autenticación Real con Supabase ✅
- **Objetivo**: Implementar autenticación real y gestión de usuarios.
- **Componentes**: Supabase Auth, OAuth (Google/Facebook), Perfiles de usuario.
- **Estado**: ✅ **COMPLETADO**
  - ✅ OAuth con Google y Facebook
  - ✅ Sistema de perfiles con timezone y lenguaje
  - ✅ Router guards y navegación automática
  - ✅ Flujo completo de registro y login

---

## Próxima Fase 🚀

### Fase 3: Integración de Pagos con PayPal
- **Objetivo**: Implementar un flujo de pago funcional para planes premium.
- **Componentes**: PayPal API.
- **Estado**: 📋 **EN PLANIFICACIÓN**

#### 📋 Plan de Implementación

##### 3.1 Configuración de PayPal
- [ ] Crear cuenta de desarrollador en PayPal
- [ ] Obtener Client ID y Secret para sandbox y producción
- [ ] Configurar variables de entorno para PayPal
- [ ] Instalar SDK de PayPal para JavaScript (`@paypal/react-paypal-js` o similar)

##### 3.2 Base de Datos - Esquema de Suscripciones
```sql
-- Tabla de planes de suscripción
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  duration_days INTEGER NOT NULL, -- 7 para semanal, 30 para mensual
  features JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de suscripciones de usuarios
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id),
  paypal_subscription_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, active, cancelled, expired
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  auto_renew BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de transacciones/pagos
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES user_subscriptions(id),
  paypal_payment_id TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL, -- completed, pending, failed, refunded
  payment_method TEXT DEFAULT 'paypal',
  transaction_data JSONB, -- PayPal response data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

##### 3.3 Backend - Endpoints de PayPal
- [ ] **POST /api/payments/create-order**
  - Crear orden de pago en PayPal
  - Validar plan seleccionado
  - Retornar approval URL

- [ ] **POST /api/payments/capture-order**
  - Capturar pago después de aprobación
  - Actualizar suscripción del usuario
  - Enviar confirmación

- [ ] **POST /api/payments/webhook**
  - Manejar webhooks de PayPal
  - Actualizar estados de suscripción
  - Procesar cancelaciones/renovaciones

- [ ] **GET /api/user/subscription**
  - Obtener suscripción actual del usuario
  - Verificar estado activo

##### 3.4 Frontend - Componentes de Pago

###### 3.4.1 Actualizar Checkout.vue
- [ ] Integrar botones de PayPal
- [ ] Mostrar planes disponibles desde la base de datos
- [ ] Manejar flujo de aprobación/error
- [ ] Redirección a página de éxito

###### 3.4.2 Crear PayPalButton.vue
```vue
<template>
  <div id="paypal-button-container"></div>
</template>

<script setup>
import { onMounted } from 'vue'

const props = defineProps({
  planId: String,
  amount: Number,
  currency: { type: String, default: 'USD' }
})

const emit = defineEmits(['success', 'error', 'cancel'])

onMounted(() => {
  // Inicializar botón de PayPal
})
</script>
```

###### 3.4.3 Actualizar Profile.vue
- [ ] Mostrar información de suscripción actual
- [ ] Opción para cancelar suscripción
- [ ] Historial de pagos
- [ ] Botón para renovar si está vencida

##### 3.5 Lógica de Negocio - Sistema de Límites

###### 3.5.1 Middleware de Verificación
- [ ] Crear middleware para verificar suscripción activa
- [ ] Implementar contador de preguntas para usuarios gratuitos
- [ ] Bloquear acceso a funciones premium

###### 3.5.2 Actualizar Auth Store
```javascript
// Agregar al auth store
const userSubscription = ref(null)
const isSubscriptionActive = computed(() => {
  if (!userSubscription.value) return false
  const now = new Date()
  const endDate = new Date(userSubscription.value.end_date)
  return userSubscription.value.status === 'active' && endDate > now
})

const isPremiumUser = computed(() => isSubscriptionActive.value)
const canAskQuestion = computed(() => {
  // Lógica para determinar si puede hacer pregunta
  // Basado en plan y límites
})
```

##### 3.6 Funcionalidades Premium

###### 3.6.1 Límites por Plan
- [ ] **Plan Gratuito**: 1 pregunta por semana
- [ ] **Plan Semanal ($1)**: Preguntas ilimitadas por 7 días
- [ ] **Plan Ilimitado ($5/semana)**: Preguntas ilimitadas

###### 3.6.2 Características Premium
- [ ] Historial completo de lecturas
- [ ] Exportar lecturas a PDF
- [ ] Lecturas más detalladas
- [ ] Acceso a cartas especiales
- [ ] Soporte prioritario

##### 3.7 Testing y Validación
- [ ] Configurar PayPal Sandbox
- [ ] Crear casos de prueba para flujos de pago
- [ ] Probar webhooks con ngrok o similar
- [ ] Validar manejo de errores y cancelaciones
- [ ] Testing de límites y restricciones

##### 3.8 Seguridad y Validación
- [ ] Validar transacciones en el backend
- [ ] Verificar webhooks de PayPal (signature)
- [ ] Sanitizar datos de entrada
- [ ] Logs de seguridad para transacciones
- [ ] Rate limiting en endpoints de pago

##### 3.9 UI/UX Mejoras
- [ ] Indicadores visuales de plan actual
- [ ] Animaciones para transiciones de pago
- [ ] Mensajes claros de confirmación
- [ ] Manejo elegante de errores
- [ ] Loading states durante procesamiento

##### 3.10 Deployment y Configuración
- [ ] Variables de entorno para producción
- [ ] Configurar webhooks en PayPal Live
- [ ] Testing en ambiente de producción
- [ ] Documentación para administración

---

## Fases Futuras 🔮

### Fase 4: Mejoras de Experiencia
- **Objetivo**: Mejorar la experiencia del usuario y añadir funcionalidades avanzadas.
- **Componentes**:
  - Historial de lecturas con búsqueda
  - Notificaciones push
  - Modo offline
  - Compartir lecturas en redes sociales

### Fase 5: Analytics y Optimización
- **Objetivo**: Implementar analytics y optimizar rendimiento.
- **Componentes**:
  - Google Analytics / Mixpanel
  - A/B testing para conversiones
  - Optimización de rendimiento
  - SEO y meta tags dinámicos

### Fase 6: Escalabilidad
- **Objetivo**: Preparar la aplicación para gran escala.
- **Componentes**:
  - CDN para assets
  - Optimización de base de datos
  - Caching estratégico
  - Monitoreo y alertas

---

## 📊 Métricas de Éxito para Fase 3

- ✅ **Técnicas**:
  - 100% de transacciones exitosas en sandbox
  - Tiempo de respuesta < 3s para crear orden
  - 0 errores críticos en webhooks
  - Cobertura de tests > 80%

- ✅ **Negocio**:
  - Tasa de conversión > 15% en checkout
  - Tasa de abandono < 30% en flujo de pago
  - 0 chargebacks o disputas
  - Tiempo de implementación < 2 semanas

---

## 🛠️ Stack Tecnológico para Fase 3

- **Frontend**: Vue.js 3, PayPal JavaScript SDK
- **Backend**: Node.js/Express, PayPal REST API
- **Base de Datos**: Supabase/PostgreSQL
- **Pagos**: PayPal (Sandbox → Production)
- **Testing**: Jest, PayPal Sandbox
- **Monitoring**: Supabase Analytics, PayPal Dashboard

---

*Última actualización: 2025-01-20*
*Próxima revisión: Al completar Fase 3*