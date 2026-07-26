const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProbeRequest {
  url: string;
}

interface ProbeResponse {
  url: string;
  contentType: string | null;
  sizeBytes: number | null;
  methodUsed: "HEAD" | "RANGE" | "FULL" | "FAILED";
  errorMessage?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: ProbeRequest = await req.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return new Response(
        JSON.stringify({
          url: url || "",
          contentType: null,
          sizeBytes: null,
          methodUsed: "FAILED",
          errorMessage: "Missing or invalid 'url' in request body.",
        } as ProbeResponse),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Probing image size:", url);

    // Method 1: Try HEAD request
    try {
      const headResponse = await fetch(url, {
        method: "HEAD",
        headers: {
          "User-Agent": "Lovable-ImageProbe/1.0",
        },
      });

      if (headResponse.ok) {
        const contentType = headResponse.headers.get("content-type") || "";
        const contentLength = headResponse.headers.get("content-length");

        // Verify it's an image
        if (!contentType.startsWith("image/")) {
          return new Response(
            JSON.stringify({
              url,
              contentType,
              sizeBytes: null,
              methodUsed: "FAILED",
              errorMessage: `Not an image: Content-Type is '${contentType}'`,
            } as ProbeResponse),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (contentLength) {
          const sizeBytes = parseInt(contentLength, 10);
          console.log(`HEAD success: ${sizeBytes} bytes, ${contentType}`);
          return new Response(
            JSON.stringify({
              url,
              contentType,
              sizeBytes,
              methodUsed: "HEAD",
            } as ProbeResponse),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    } catch (headError) {
      console.log("HEAD request failed:", headError instanceof Error ? headError.message : "Unknown error");
    }

    // Method 2: Try Range request to get Content-Range header
    try {
      const rangeResponse = await fetch(url, {
        method: "GET",
        headers: {
          "User-Agent": "Lovable-ImageProbe/1.0",
          "Range": "bytes=0-0",
        },
      });

      if (rangeResponse.status === 206) {
        const contentType = rangeResponse.headers.get("content-type") || "";
        const contentRange = rangeResponse.headers.get("content-range");

        // Verify it's an image
        if (!contentType.startsWith("image/")) {
          // Consume body to prevent leaks
          await rangeResponse.arrayBuffer();
          return new Response(
            JSON.stringify({
              url,
              contentType,
              sizeBytes: null,
              methodUsed: "FAILED",
              errorMessage: `Not an image: Content-Type is '${contentType}'`,
            } as ProbeResponse),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Parse Content-Range: bytes 0-0/1234567
        if (contentRange) {
          const match = contentRange.match(/bytes\s+\d+-\d+\/(\d+)/);
          if (match && match[1]) {
            const sizeBytes = parseInt(match[1], 10);
            console.log(`RANGE success: ${sizeBytes} bytes, ${contentType}`);
            // Consume body to prevent leaks
            await rangeResponse.arrayBuffer();
            return new Response(
              JSON.stringify({
                url,
                contentType,
                sizeBytes,
                methodUsed: "RANGE",
              } as ProbeResponse),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }

        // Consume body to prevent leaks
        await rangeResponse.arrayBuffer();
      }
    } catch (rangeError) {
      console.log("RANGE request failed:", rangeError instanceof Error ? rangeError.message : "Unknown error");
    }

    // Method 3: Full GET request (last resort - actually downloads the image)
    try {
      const fullResponse = await fetch(url, {
        method: "GET",
        headers: {
          "User-Agent": "Lovable-ImageProbe/1.0",
        },
      });

      if (fullResponse.ok) {
        const contentType = fullResponse.headers.get("content-type") || "";

        // Verify it's an image
        if (!contentType.startsWith("image/")) {
          // Consume body to prevent leaks
          await fullResponse.arrayBuffer();
          return new Response(
            JSON.stringify({
              url,
              contentType,
              sizeBytes: null,
              methodUsed: "FAILED",
              errorMessage: `Not an image: Content-Type is '${contentType}'`,
            } as ProbeResponse),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const buffer = await fullResponse.arrayBuffer();
        const sizeBytes = buffer.byteLength;
        console.log(`FULL success: ${sizeBytes} bytes, ${contentType}`);
        return new Response(
          JSON.stringify({
            url,
            contentType,
            sizeBytes,
            methodUsed: "FULL",
          } as ProbeResponse),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } catch (fullError) {
      console.log("FULL request failed:", fullError instanceof Error ? fullError.message : "Unknown error");
    }

    // All methods failed
    return new Response(
      JSON.stringify({
        url,
        contentType: null,
        sizeBytes: null,
        methodUsed: "FAILED",
        errorMessage: "Could not determine image size using HEAD, RANGE, or FULL request",
      } as ProbeResponse),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({
        url: "",
        contentType: null,
        sizeBytes: null,
        methodUsed: "FAILED",
        errorMessage: `Unexpected error: ${error instanceof Error ? error.message : "Unknown error"}`,
      } as ProbeResponse),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
