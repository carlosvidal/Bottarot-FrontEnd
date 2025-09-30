-- This script adds the 'is_favorite' feature to chats.

-- 1. Add the is_favorite column to the chats table
ALTER TABLE public.chats
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Create the RPC function to toggle the favorite status
CREATE OR REPLACE FUNCTION public.toggle_chat_favorite(p_chat_id uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.chats
    SET is_favorite = NOT is_favorite
    WHERE id = p_chat_id AND user_id = p_user_id;
END;
$$;

-- 3. Update the get_chat_list function to include the is_favorite column
-- This replaces the existing get_chat_list function
CREATE OR REPLACE FUNCTION public.get_chat_list(p_user_id uuid)
RETURNS TABLE ( 
    id uuid,
    title text,
    created_at timestamp with time zone,
    is_favorite boolean -- Added column
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT c.id, c.title, c.created_at, c.is_favorite
    FROM public.chats c
    WHERE c.user_id = p_user_id
    ORDER BY c.is_favorite DESC, c.created_at DESC; -- Show favorites first
END;
$$;