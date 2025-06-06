import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log("Edge Function 'receive-text-file-path' received request.");

  // Handle CORS OPTIONS request
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS request.");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Attempting to parse request body...");
    // Expecting both minio_path and name
    const { minio_path, name } = await req.json();
    console.log("Request body parsed successfully. minio_path:", minio_path, "name:", name);

    // Validate both minio_path and name
    if (!minio_path || typeof minio_path !== 'string' || !name || typeof name !== 'string') {
      console.error('Missing or invalid minio_path or name in request body');
      return new Response(JSON.stringify({ error: 'Missing or invalid minio_path or name in request body. Both are required strings.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client with the service role key for backend operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Use service role key
    );
    console.log("Supabase client initialized with service role key.");

    // Insert the minio_path and name into the *files* table
    console.log(`Inserting minio_path "${minio_path}" and name "${name}" into public.files`);
    const { data, error } = await supabase
      .from('files') // *** Changed from 'text_files' to 'files' ***
      .insert([
        { minio_path: minio_path, name: name } // Include the name column
      ])
      .select(); // Select the inserted row to confirm

    if (error) {
      console.error("Error inserting data into files:", error);
      return new Response(JSON.stringify({ error: `Failed to save file path and name: ${error.message}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log("File path and name saved successfully into files table:", data);

    // Return success response
    return new Response(JSON.stringify({ message: 'File path and name received and saved successfully into files table.', data: data }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error("Error in 'receive-text-file-path' Edge Function:", error);
    return new Response(JSON.stringify({ error: error.message || 'An unexpected error occurred in the Edge Function.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});