import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Max image size: 12MB
const MAX_IMAGE_SIZE = 12 * 1024 * 1024;

interface CompressRequest {
  originalUrl: string;
  minBytes?: number; // If provided, skip images smaller than this
}

interface CompressResponse {
  originalUrl: string;
  optimizedUrl?: string;
  status: "done" | "error" | "skipped" | "already_done";
  fileSizeBefore?: number;
  fileSizeAfter?: number;
  compressionRatio?: number;
  errorMessage?: string;
}

// Get file extension from content type
function getExtensionFromContentType(contentType: string): string {
  if (contentType.includes("jpeg") || contentType.includes("jpg")) return "jpg";
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("gif")) return "gif";
  return "jpg"; // fallback
}

// Generate SHA256 hash of a string
async function sha256(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Tinify API key
    const tinifyKey = Deno.env.get("tinify_key") || Deno.env.get("TINIFY_KEY");
    if (!tinifyKey) {
      return new Response(
        JSON.stringify({
          originalUrl: "",
          status: "error",
          errorMessage: "Tinify API key not configured. Please add 'tinify_key' to Supabase secrets.",
        } as CompressResponse),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Supabase credentials
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({
          originalUrl: "",
          status: "error",
          errorMessage: "Supabase credentials not configured.",
        } as CompressResponse),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const body: CompressRequest = await req.json();
    const { originalUrl, minBytes } = body;

    if (!originalUrl || typeof originalUrl !== "string") {
      return new Response(
        JSON.stringify({
          originalUrl: originalUrl || "",
          status: "error",
          errorMessage: "Missing or invalid 'originalUrl' in request body.",
        } as CompressResponse),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if already processed in image_optimizations
    const { data: existingRow, error: selectError } = await supabase
      .from("image_optimizations")
      .select("*")
      .eq("original_url", originalUrl)
      .maybeSingle();

    if (selectError) {
      console.error("DB select error:", selectError);
    }

    // If already done with optimized_url, return it
    if (existingRow && existingRow.status === "done" && existingRow.optimized_url) {
      return new Response(
        JSON.stringify({
          originalUrl,
          optimizedUrl: existingRow.optimized_url,
          status: "already_done",
          fileSizeBefore: existingRow.file_size_before,
          fileSizeAfter: existingRow.file_size_after,
          compressionRatio: existingRow.compression_ratio,
        } as CompressResponse),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Set status to processing
    if (existingRow) {
      await supabase
        .from("image_optimizations")
        .update({ status: "processing", error_message: null })
        .eq("id", existingRow.id);
    }

    // Download the original image
    console.log("Downloading image:", originalUrl);
    let imageResponse: Response;
    try {
      imageResponse = await fetch(originalUrl, {
        headers: {
          "User-Agent": "Lovable-ImageOptimizer/1.0",
        },
      });
    } catch (fetchError) {
      const errorMsg = `Failed to download image: ${fetchError instanceof Error ? fetchError.message : "Network error"}`;
      console.error(errorMsg);
      
      if (existingRow) {
        await supabase
          .from("image_optimizations")
          .update({ status: "error", error_message: errorMsg })
          .eq("id", existingRow.id);
      }

      return new Response(
        JSON.stringify({
          originalUrl,
          status: "error",
          errorMessage: errorMsg,
        } as CompressResponse),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!imageResponse.ok) {
      const errorMsg = `Failed to download image: HTTP ${imageResponse.status}`;
      console.error(errorMsg);

      if (existingRow) {
        await supabase
          .from("image_optimizations")
          .update({ status: "error", error_message: errorMsg })
          .eq("id", existingRow.id);
      }

      return new Response(
        JSON.stringify({
          originalUrl,
          status: "error",
          errorMessage: errorMsg,
        } as CompressResponse),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify it's an image
    const contentType = imageResponse.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      const errorMsg = `Not an image: Content-Type is '${contentType}'`;
      console.error(errorMsg);

      if (existingRow) {
        await supabase
          .from("image_optimizations")
          .update({ status: "error", error_message: errorMsg })
          .eq("id", existingRow.id);
      }

      return new Response(
        JSON.stringify({
          originalUrl,
          status: "error",
          errorMessage: errorMsg,
        } as CompressResponse),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get image bytes
    const imageBytes = await imageResponse.arrayBuffer();
    const fileSizeBefore = imageBytes.byteLength;

    console.log(`Original image size: ${fileSizeBefore} bytes`);

    // Check if image is below minBytes threshold - skip if so
    if (minBytes && fileSizeBefore < minBytes) {
      const skipMsg = `Below threshold (${fileSizeBefore} < ${minBytes} bytes)`;
      console.log(skipMsg);

      if (existingRow) {
        await supabase
          .from("image_optimizations")
          .update({ 
            status: "skipped", 
            error_message: "Below threshold",
            file_size_before: fileSizeBefore 
          })
          .eq("id", existingRow.id);
      }

      return new Response(
        JSON.stringify({
          originalUrl,
          status: "skipped",
          fileSizeBefore,
          errorMessage: skipMsg,
        } as CompressResponse),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check max size
    if (fileSizeBefore > MAX_IMAGE_SIZE) {
      const errorMsg = `Image too large for Tinify: ${(fileSizeBefore / 1024 / 1024).toFixed(2)}MB (max 12MB)`;
      console.error(errorMsg);

      if (existingRow) {
        await supabase
          .from("image_optimizations")
          .update({ 
            status: "skipped", 
            error_message: errorMsg,
            file_size_before: fileSizeBefore 
          })
          .eq("id", existingRow.id);
      }

      return new Response(
        JSON.stringify({
          originalUrl,
          status: "skipped",
          fileSizeBefore,
          errorMessage: errorMsg,
        } as CompressResponse),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Compress via Tinify
    console.log("Sending to Tinify for compression...");
    const tinifyAuth = btoa(`api:${tinifyKey}`);

    let tinifyResponse: Response;
    try {
      tinifyResponse = await fetch("https://api.tinify.com/shrink", {
        method: "POST",
        headers: {
          Authorization: `Basic ${tinifyAuth}`,
          "Content-Type": contentType,
        },
        body: imageBytes,
      });
    } catch (tinifyError) {
      const errorMsg = `Tinify API error: ${tinifyError instanceof Error ? tinifyError.message : "Network error"}`;
      console.error(errorMsg);

      if (existingRow) {
        await supabase
          .from("image_optimizations")
          .update({ status: "error", error_message: errorMsg, file_size_before: fileSizeBefore })
          .eq("id", existingRow.id);
      }

      return new Response(
        JSON.stringify({
          originalUrl,
          status: "error",
          fileSizeBefore,
          errorMessage: errorMsg,
        } as CompressResponse),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!tinifyResponse.ok) {
      const tinifyError = await tinifyResponse.text();
      const errorMsg = `Tinify compression failed: HTTP ${tinifyResponse.status} - ${tinifyError}`;
      console.error(errorMsg);

      if (existingRow) {
        await supabase
          .from("image_optimizations")
          .update({ status: "error", error_message: errorMsg, file_size_before: fileSizeBefore })
          .eq("id", existingRow.id);
      }

      return new Response(
        JSON.stringify({
          originalUrl,
          status: "error",
          fileSizeBefore,
          errorMessage: errorMsg,
        } as CompressResponse),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the result URL from Location header
    const resultUrl = tinifyResponse.headers.get("location");
    if (!resultUrl) {
      const errorMsg = "Tinify did not return a result URL in Location header";
      console.error(errorMsg);

      if (existingRow) {
        await supabase
          .from("image_optimizations")
          .update({ status: "error", error_message: errorMsg, file_size_before: fileSizeBefore })
          .eq("id", existingRow.id);
      }

      return new Response(
        JSON.stringify({
          originalUrl,
          status: "error",
          fileSizeBefore,
          errorMessage: errorMsg,
        } as CompressResponse),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Download compressed image
    console.log("Downloading compressed image from Tinify...");
    const compressedResponse = await fetch(resultUrl, {
      headers: {
        Authorization: `Basic ${tinifyAuth}`,
      },
    });

    if (!compressedResponse.ok) {
      const errorMsg = `Failed to download compressed image: HTTP ${compressedResponse.status}`;
      console.error(errorMsg);

      if (existingRow) {
        await supabase
          .from("image_optimizations")
          .update({ status: "error", error_message: errorMsg, file_size_before: fileSizeBefore })
          .eq("id", existingRow.id);
      }

      return new Response(
        JSON.stringify({
          originalUrl,
          status: "error",
          fileSizeBefore,
          errorMessage: errorMsg,
        } as CompressResponse),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const compressedBytes = await compressedResponse.arrayBuffer();
    const fileSizeAfter = compressedBytes.byteLength;
    const compressionRatio = fileSizeBefore > 0 ? Math.round((1 - fileSizeAfter / fileSizeBefore) * 100) : 0;

    console.log(`Compressed size: ${fileSizeAfter} bytes (${compressionRatio}% reduction)`);

    // Determine file extension
    const compressedContentType = compressedResponse.headers.get("content-type") || contentType;
    const ext = getExtensionFromContentType(compressedContentType);

    // Generate unique filename based on original URL hash
    const urlHash = await sha256(originalUrl);
    const storagePath = `tinified/${urlHash}.${ext}`;

    // Upload to Supabase Storage
    console.log("Uploading to Supabase Storage:", storagePath);
    const { error: uploadError } = await supabase.storage
      .from("compressed-images")
      .upload(storagePath, compressedBytes, {
        contentType: compressedContentType,
        upsert: true,
      });

    if (uploadError) {
      const errorMsg = `Storage upload failed: ${uploadError.message}`;
      console.error(errorMsg);

      if (existingRow) {
        await supabase
          .from("image_optimizations")
          .update({ 
            status: "error", 
            error_message: errorMsg, 
            file_size_before: fileSizeBefore,
            file_size_after: fileSizeAfter 
          })
          .eq("id", existingRow.id);
      }

      return new Response(
        JSON.stringify({
          originalUrl,
          status: "error",
          fileSizeBefore,
          fileSizeAfter,
          errorMessage: errorMsg,
        } as CompressResponse),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("compressed-images")
      .getPublicUrl(storagePath);

    const optimizedUrl = publicUrlData.publicUrl;
    console.log("Optimized URL:", optimizedUrl);

    // Update image_optimizations row
    if (existingRow) {
      await supabase
        .from("image_optimizations")
        .update({
          status: "done",
          optimized_url: optimizedUrl,
          file_size_before: fileSizeBefore,
          file_size_after: fileSizeAfter,
          compression_ratio: compressionRatio,
          error_message: null,
        })
        .eq("id", existingRow.id);
    }

    return new Response(
      JSON.stringify({
        originalUrl,
        optimizedUrl,
        status: "done",
        fileSizeBefore,
        fileSizeAfter,
        compressionRatio,
      } as CompressResponse),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({
        originalUrl: "",
        status: "error",
        errorMessage: `Unexpected error: ${error instanceof Error ? error.message : "Unknown error"}`,
      } as CompressResponse),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
