import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    
    const bucketName = "lesson_audio";
    const folderPath = "vocabulary";
    
    console.log(`Listing files in ${bucketName}/${folderPath}...`);
    
    // List all files in the vocabulary folder
    const { data: files, error: listError } = await supabase.storage
      .from(bucketName)
      .list(folderPath, { limit: 1000 });
    
    if (listError) {
      console.error("Error listing files:", listError);
      return new Response(
        JSON.stringify({ error: "Failed to list files", details: listError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (!files || files.length === 0) {
      console.log("No files found to delete");
      return new Response(
        JSON.stringify({ success: true, deletedCount: 0, message: "No files found to delete" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Filter out folders (items without metadata or with .emptyFolderPlaceholder)
    const filesToDelete = files
      .filter(file => file.name && !file.name.endsWith('.emptyFolderPlaceholder'))
      .map(file => `${folderPath}/${file.name}`);
    
    console.log(`Found ${filesToDelete.length} files to delete`);
    
    if (filesToDelete.length === 0) {
      return new Response(
        JSON.stringify({ success: true, deletedCount: 0, message: "No audio files found to delete" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Delete files in batches of 100
    let totalDeleted = 0;
    const batchSize = 100;
    
    for (let i = 0; i < filesToDelete.length; i += batchSize) {
      const batch = filesToDelete.slice(i, i + batchSize);
      console.log(`Deleting batch ${Math.floor(i / batchSize) + 1}: ${batch.length} files`);
      
      const { error: deleteError } = await supabase.storage
        .from(bucketName)
        .remove(batch);
      
      if (deleteError) {
        console.error("Error deleting batch:", deleteError);
        // Continue with other batches even if one fails
      } else {
        totalDeleted += batch.length;
      }
    }
    
    console.log(`Successfully deleted ${totalDeleted} files`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        deletedCount: totalDeleted,
        message: `Deleted ${totalDeleted} audio files from storage`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Unexpected error", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
