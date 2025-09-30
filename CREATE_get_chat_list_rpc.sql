-- This function retrieves a list of all chats for a given user.

CREATE OR REPLACE FUNCTION public.get_chat_list(p_user_id uuid)
RETURNS TABLE ( 
    id uuid,
    title text,
    created_at timestamp with time zone
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- The RLS policy on the chats table will ensure a user can only see their own chats.
    RETURN QUERY
    SELECT c.id, c.title, c.created_at
    FROM public.chats c
    WHERE c.user_id = p_user_id
    ORDER BY c.created_at DESC;
END;
$$;