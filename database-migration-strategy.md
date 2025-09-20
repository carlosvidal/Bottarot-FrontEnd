# 📊 Estrategia de Migración de Base de Datos - Fase 3

## 🔍 Análisis de Situación Actual

Como mencionas que ya tienes algunas tablas similares en Supabase pero están vacías, necesitamos determinar la mejor estrategia.

## 📋 Paso 1: Revisar Esquema Actual

Primero necesitamos ver qué tablas ya existen. Por favor ejecuta esto en tu Supabase SQL Editor y compárteme el resultado:

```sql
-- Ver todas las tablas públicas existentes
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name NOT LIKE 'pg_%'
    AND table_name NOT LIKE 'sql_%'
ORDER BY table_name, ordinal_position;

-- Ver constraints y foreign keys
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public';
```

## 🚀 Estrategias Posibles

### Opción A: Migración Limpia (RECOMENDADA)
Si las tablas están vacías, es mejor empezar desde cero con nuestro esquema optimizado.

```sql
-- 1. Eliminar tablas existentes relacionadas con suscripciones/pagos
DROP TABLE IF EXISTS user_questions CASCADE;
DROP TABLE IF EXISTS payment_transactions CASCADE;
DROP TABLE IF EXISTS user_subscriptions CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;

-- 2. Ejecutar nuestro schema completo
-- (usar supabase-schema.sql)
```

### Opción B: Migración Incremental
Si quieres conservar la estructura existente, podemos hacer ALTER TABLE.

### Opción C: Análisis y Fusión
Comparar esquemas y mantener lo mejor de ambos.

## 📝 Información Necesaria

Para tomar la mejor decisión, necesito que me proporciones:

1. **Lista de tablas existentes:**
   ```sql
   SELECT tablename FROM pg_tables WHERE schemaname = 'public';
   ```

2. **Estructura de tablas relevantes:**
   ```sql
   \d+ subscription_plans     -- Si existe
   \d+ user_subscriptions    -- Si existe
   \d+ payment_transactions  -- Si existe
   \d+ user_questions        -- Si existe
   ```

3. **Confirmación de que están vacías:**
   ```sql
   SELECT
       schemaname,
       tablename,
       pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
   FROM pg_tables
   WHERE schemaname = 'public'
   ORDER BY size_bytes DESC;
   ```

## ⚡ Recomendación Rápida

**Si las tablas están realmente vacías y no hay datos importantes**, te recomiendo:

1. **Hacer backup** de las tablas actuales (por seguridad)
2. **Ejecutar migración limpia** con nuestro esquema optimizado
3. **Verificar funcionalidad** del nuevo esquema

### Script de Migración Rápida

```sql
-- CUIDADO: Esto eliminará todas las tablas relacionadas
-- Solo ejecutar si estás seguro de que no hay datos importantes

-- Backup de seguridad (opcional)
CREATE TABLE backup_profiles AS SELECT * FROM profiles;

-- Migración limpia
DROP TABLE IF EXISTS user_questions CASCADE;
DROP TABLE IF EXISTS payment_transactions CASCADE;
DROP TABLE IF EXISTS user_subscriptions CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;

-- Agregar columnas a profiles si no existen
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/Mexico_City',
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'es';

-- Ejecutar el schema completo de supabase-schema.sql
```

## 🎯 Próximo Paso

**Compárteme el resultado de las consultas de análisis** y podremos proceder con la estrategia más segura y eficiente para tu caso específico.

¿Prefieres que procedamos con la migración limpia o quieres que primero analicemos tu esquema actual?