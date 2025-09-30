-- This function allows updating the title of a chat.
-- It ensures that only the user who owns the chat can update it.

CREATE OR REPLACE FUNCTION public.update_chat_title(p_chat_id uuid, p_user_id uuid, p_new_title text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.chats
    SET title = p_new_title
    WHERE id = p_chat_id AND user_id = p_user_id;
END;
$$;