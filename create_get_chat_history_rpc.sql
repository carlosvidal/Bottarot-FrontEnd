CREATE OR REPLACE FUNCTION public.get_chat_history(
    p_chat_id uuid,
    p_user_id uuid
)
RETURNS TABLE (
    message_id uuid,
    content text,
    role text,
    created_at timestamp with time zone,
    cards jsonb
)
LANGUAGE plpgsql
AS $BODY$
BEGIN
    -- First, verify that the chat belongs to the user
    IF NOT EXISTS (SELECT 1 FROM public.chats WHERE id = p_chat_id AND user_id = p_user_id) THEN
        -- If the chat does not belong to the user, return an empty set
        RETURN;
    END IF;

    -- Return the messages for the given chat, ordered by creation time
    RETURN QUERY
    SELECT
        m.id AS message_id,
        m.content,
        m.role,
        m.created_at,
        m.cards
    FROM
        public.messages m
    WHERE
        m.chat_id = p_chat_id
    ORDER BY
        m.created_at ASC;
END;
$BODY$;