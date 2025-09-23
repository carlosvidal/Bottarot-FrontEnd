CREATE OR REPLACE FUNCTION public.save_message(
    p_chat_id uuid,
    p_user_id uuid,
    p_content text,
    p_role text
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    new_message_id uuid;
BEGIN
    -- First, verify that the chat belongs to the user
    IF NOT EXISTS (SELECT 1 FROM public.chats WHERE id = p_chat_id AND user_id = p_user_id) THEN
        RAISE EXCEPTION 'Chat with ID % does not belong to user %.', p_chat_id, p_user_id;
    END IF;

    INSERT INTO public.messages (chat_id, user_id, content, role)
    VALUES (p_chat_id, p_user_id, p_content, p_role)
    RETURNING id INTO new_message_id;

    RETURN new_message_id;
END;
$$;