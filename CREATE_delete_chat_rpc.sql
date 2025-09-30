-- This function deletes a chat and all of its associated messages.
-- It first deletes messages to respect the foreign key constraint, then deletes the chat.

CREATE OR REPLACE FUNCTION public.delete_chat(p_chat_id uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- The RLS policy on chats will ensure a user can only delete their own chat.
    -- The function first deletes all messages associated with the chat.
    DELETE FROM public.messages WHERE chat_id = p_chat_id AND user_id = p_user_id;
    
    -- Then, it deletes the chat itself.
    DELETE FROM public.chats WHERE id = p_chat_id AND user_id = p_user_id;
END;
$$;