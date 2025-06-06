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
    const { minio_path } = await req.json();
    console.log("Request body parsed successfully.");

    if (!minio_path || typeof minio_path !== 'string') {
      console.error('Missing or invalid minio_path in request body');
      return new Response(JSON.stringify({ error: 'Missing or invalid minio_path in request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client with the service role key for backend operations
    // The service role key bypasses RLS, which is suitable for trusted automations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Use service role key
    );
    console.log("Supabase client initialized with service role key.");

    // Insert the minio_path into the new text_files table
    console.log(`Inserting minio_path "${minio_path}" into public.text_files`);
    const { data, error } = await supabase
      .from('text_files')
      .insert([
        { minio_path: minio_path }
      ])
      .select(); // Select the inserted row to confirm

    if (error) {
      console.error("Error inserting data into text_files:", error);
      return new Response(JSON.stringify({ error: `Failed to save file path: ${error.message}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log("File path saved successfully:", data);

    // Return success response
    return new Response(JSON.stringify({ message: 'File path received and saved successfully.', data: data }), {
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