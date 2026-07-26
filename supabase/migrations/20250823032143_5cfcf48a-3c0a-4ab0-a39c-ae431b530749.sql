-- Drop the existing foreign key constraint on user_flashcards.user_id
ALTER TABLE user_flashcards DROP CONSTRAINT IF EXISTS user_flashcards_user_id_fkey;

-- Add a new foreign key constraint that references user_sessions.id instead of users.id
ALTER TABLE user_flashcards 
ADD CONSTRAINT user_flashcards_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES user_sessions(id) ON DELETE CASCADE;