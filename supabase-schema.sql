-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.chats (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  title text,
  CONSTRAINT chats_pkey PRIMARY KEY (id),
  CONSTRAINT chats_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.messages (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  chat_id uuid NOT NULL,
  user_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  role text NOT NULL CHECK (role = ANY (ARRAY['user'::text, 'assistant'::text])),
  content text,
  cards jsonb,
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES public.chats(id),
  CONSTRAINT messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.payment_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  subscription_id bigint,
  paypal_payment_id text,
  paypal_order_id text,
  amount numeric NOT NULL,
  currency text DEFAULT 'USD'::text,
  status text NOT NULL,
  payment_method text DEFAULT 'paypal'::text,
  transaction_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT payment_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT payment_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT payment_transactions_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.user_subscriptions(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text,
  name text NOT NULL,
  gender text,
  date_of_birth date,
  created_at timestamp with time zone DEFAULT now(),
  timezone text DEFAULT 'America/Lima'::text,
  language text DEFAULT 'es'::text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.subscription_plans (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  name text,
  price numeric,
  duration_days integer,
  description text,
  max_questions_per_period integer,
  features jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT subscription_plans_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_questions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  question text NOT NULL,
  response text,
  cards_used jsonb DEFAULT '[]'::jsonb,
  is_premium boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_questions_pkey PRIMARY KEY (id),
  CONSTRAINT user_questions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_subscriptions (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid NOT NULL DEFAULT gen_random_uuid(),
  plan_id bigint,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  status text,
  paypal_order_id text,
  paypal_subscription_id text UNIQUE,
  auto_renew boolean DEFAULT true,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id),
  CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);