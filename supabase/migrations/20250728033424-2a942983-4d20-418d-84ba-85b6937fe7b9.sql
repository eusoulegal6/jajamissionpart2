-- Update article content items to have proper pages structure
UPDATE content_items 
SET content = jsonb_build_object(
    'pages', jsonb_build_array(
        jsonb_build_object(
            'type', (content->>'type'),
            'text', (content->>'text'),
            'imageUrl', (content->>'imageUrl'),
            'title', title,
            'description', title
        )
    ),
    'description', title
)
WHERE content->>'type' = 'article';