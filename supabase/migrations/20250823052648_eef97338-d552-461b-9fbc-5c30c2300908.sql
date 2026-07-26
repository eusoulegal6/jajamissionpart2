-- Call the create-preset-flashcards function to create the first category
SELECT supabase.functions.invoke('create-preset-flashcards', '{
  "categories": [
    {
      "name": "Palavras básicas",
      "description": "Essential basic words for everyday communication",
      "words": [
        {"word": "Leave"}, {"word": "Give"}, {"word": "Door"}, {"word": "Buy"}, {"word": "Sell"}, {"word": "In"}, {"word": "On"}, {"word": "At"}, {"word": "Where"}, {"word": "When"}, {"word": "Why"}, {"word": "What time"}, {"word": "Say"}, {"word": "Speak"}, {"word": "Talk"}, {"word": "Choose"}, {"word": "Woman"}, {"word": "Young"}, {"word": "Old"}, {"word": "Up"}, {"word": "Down"}, {"word": "Bring"}, {"word": "There is"}, {"word": "There are"}, {"word": "Take"}, {"word": "Come"}, {"word": "Go back"}, {"word": "Hand"}, {"word": "Near"}, {"word": "Far"}, {"word": "Walk"}, {"word": "Town"}, {"word": "See"}, {"word": "Early"}, {"word": "Know"}, {"word": "Now"}, {"word": "After"}, {"word": "Before"}, {"word": "Late"}, {"word": "Find"}, {"word": "This"}, {"word": "People"}, {"word": "Angry"}, {"word": "Sad"}, {"word": "Look for"}, {"word": "Again"}, {"word": "Wait"}, {"word": "Read"}, {"word": "Tell"}, {"word": "Think"}, {"word": "Can"}, {"word": "Can''t"}, {"word": "Want"}, {"word": "Need"}, {"word": "Have"}, {"word": "Which"}, {"word": "What"}, {"word": "Who"}, {"word": "His"}, {"word": "Her"}, {"word": "Daughter"}, {"word": "Country"}, {"word": "Other"}, {"word": "Thing"}, {"word": "From"}, {"word": "Live"}, {"word": "Eat"}, {"word": "Drink"}
      ]
    }
  ]
}'::jsonb);