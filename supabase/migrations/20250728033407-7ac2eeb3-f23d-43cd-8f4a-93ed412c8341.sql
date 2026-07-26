-- Update video content items to have proper pages structure
UPDATE content_items 
SET content = jsonb_build_object(
    'pages', jsonb_build_array(
        jsonb_build_object(
            'type', (content->>'type'),
            'videoUrl', (content->>'videoUrl'),
            'title', COALESCE((content->>'title'), title),
            'description', (content->>'description')
        )
    ),
    'description', (content->>'description')
)
WHERE content->>'type' = 'video';