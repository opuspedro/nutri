import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log("Edge Function 'save-html-content' received request.");

  // Handle CORS OPTIONS request
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS request.");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Attempting to parse request body...");
    const { fileId, newHtmlContent } = await req.json();
    console.log("Request body parsed successfully. fileId:", fileId);
    // console.log("newHtmlContent (first 100 chars):", newHtmlContent ? newHtmlContent.substring(0, 100) : 'null'); // Log snippet

    if (!fileId || newHtmlContent === undefined || newHtmlContent === null) {
      console.error('Missing fileId or newHtmlContent in request body');
      return new Response(JSON.stringify({ error: 'Missing fileId or newHtmlContent in request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client with the service role key for Storage write access
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Use service role key
    );
    console.log("Supabase client initialized with service role key.");

    // Fetch file details from Supabase to get the minio_path
    console.log(`Fetching file details for fileId: ${fileId}`);
    const { data: fileData, error: fileError } = await supabase
      .from('files')
      .select('id, name, minio_path')
      .eq('id', fileId)
      .single();

    if (fileError) {
      console.error(`Error fetching file ${fileId}:`, fileError);
      return new Response(JSON.stringify({ error: `Failed to fetch file details: ${fileError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!fileData || !fileData.minio_path) {
       console.error(`File with ID ${fileId} not found or missing minio_path.`);
       return new Response(JSON.stringify({ error: `File with ID ${fileId} not found or missing minio_path.` }), {
         status: 404,
         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
       });
    }

    console.log("File details fetched:", fileData);
    console.log("minio_path:", fileData.minio_path);

    // Parse the minio_path URL to get the bucket name and the path within the bucket
    // Assuming the public URL format: https://[project-ref].supabase.co/storage/v1/object/public/[bucket-name]/[path/to/file]
    try {
        const url = new URL(fileData.minio_path);
        const pathSegments = url.pathname.split('/').filter(segment => segment !== ''); // Split path and remove empty segments
        // Expected segments: storage, v1, object, public, [bucket-name], [path/to/file parts...]
        if (pathSegments.length < 5 || pathSegments[0] !== 'storage' || pathSegments[1] !== 'v1' || pathSegments[2] !== 'object' || pathSegments[3] !== 'public') {
             console.error("Unexpected minio_path format:", fileData.minio_path);
             return new Response(JSON.stringify({ error: 'Invalid minio_path format for storage operation.' }), {
               status: 500,
               headers: { ...corsHeaders, 'Content-Type': 'application/json' },
             });
        }

        const bucketName = pathSegments[4]; // The segment after 'public'
        const pathInBucket = pathSegments.slice(5).join('/'); // The rest of the segments joined

        console.log(`Parsed Bucket Name: "${bucketName}"`);
        console.log(`Parsed Path in Bucket: "${pathInBucket}"`);

        if (!bucketName || !pathInBucket) {
             console.error("Failed to parse bucket name or path from minio_path.");
             return new Response(JSON.stringify({ error: 'Failed to parse storage path from file details.' }), {
               status: 500,
               headers: { ...corsHeaders, 'Content-Type': 'application/json' },
             });
        }

        // Convert the HTML string to a Blob
        const htmlBlob = new Blob([newHtmlContent], { type: 'text/html' });
        console.log(`Created Blob of size ${htmlBlob.size} bytes.`);

        // Upload (overwrite) the file content using Supabase Storage
        console.log(`Attempting to upload/overwrite file in bucket "${bucketName}" at path "${pathInBucket}"`);
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(pathInBucket, htmlBlob, {
                upsert: true, // This is key to overwrite the existing file
                contentType: 'text/html', // Set the correct content type
            });

        if (uploadError) {
            console.error("Error uploading file to Storage:", uploadError);
            return new Response(JSON.stringify({ error: `Failed to save file content: ${uploadError.message}` }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        console.log("File content saved successfully:", uploadData);

        // Return success response
        return new Response(JSON.stringify({ message: 'HTML content saved successfully.', data: uploadData }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (parseError: any) {
        console.error("Error parsing minio_path URL:", parseError);
        return new Response(JSON.stringify({ error: `Failed to process file path: ${parseError.message}` }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }


  } catch (error: any) {
    console.error("Error in 'save-html-content' Edge Function:", error);
    return new Response(JSON.stringify({ error: error.message || 'An unexpected error occurred in the Edge Function.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});