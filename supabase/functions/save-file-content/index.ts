import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log("Edge Function 'save-file-content' received request.");

  // Handle CORS OPTIONS request
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS request.");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Attempting to parse request body...");
    const { fileId, newContent } = await req.json();
    console.log("Request body parsed successfully. fileId:", fileId);
    // console.log("newContent (first 100 chars):", newContent ? newContent.substring(0, 100) : 'null'); // Log snippet

    if (!fileId || newContent === undefined || newContent === null) {
      console.error('Missing fileId or newContent in request body');
      return new Response(JSON.stringify({ error: 'Missing fileId or newContent in request body' }), {
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

    // Fetch file details from Supabase to get the original name and minio_path
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

    if (!fileData) {
       console.error(`File with ID ${fileId} not found.`);
       return new Response(JSON.stringify({ error: `File with ID ${fileId} not found.` }), {
         status: 404,
         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
       });
    }

    console.log("File details fetched:", fileData);

    // --- Send content to Webhook ---
    const webhookUrl = Deno.env.get('N8N_SAVE_CONTENT_WEBHOOK_URL') || 'YOUR_N8N_SAVE_CONTENT_WEBHOOK_URL'; // Read from secret

    if (webhookUrl === 'YOUR_N8N_SAVE_CONTENT_WEBHOOK_URL') {
         console.error("N8N_SAVE_CONTENT_WEBHOOK_URL secret not set or placeholder used.");
         return new Response(JSON.stringify({ error: 'Server configuration error: Webhook URL missing.' }), {
           status: 500,
           headers: { ...corsHeaders, 'Content-Type': 'application/json' },
         });
    }

    console.log(`Calling webhook at: ${webhookUrl}`);

    const webhookResponse = await fetch(webhookUrl, {
        method: 'POST', // Or the method your webhook expects
        headers: {
            'Content-Type': 'application/json',
            // Add any necessary authentication headers for your webhook here
        },
        body: JSON.stringify({
            fileId: fileData.id,
            fileName: fileData.name, // Original file name
            minioPath: fileData.minio_path, // Original minio path
            newContent: newContent, // The edited content
            // Add any other data your webhook needs
        }),
    });

    console.log(`Webhook response status: ${webhookResponse.status}`);

    if (!webhookResponse.ok) {
        const errorBody = await webhookResponse.text();
        console.error("Error calling webhook:", webhookResponse.status, webhookResponse.statusText);
        console.error("Webhook Error Body:", errorBody);
        return new Response(JSON.stringify({ error: `Failed to send content to webhook: Status ${webhookResponse.status}`, details: errorBody }), {
            status: webhookResponse.status, // Return the status received from the webhook
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    const webhookResult = await webhookResponse.json(); // Or text(), depending on webhook response
    console.log("Webhook response body:", webhookResult);

    // Return success response
    return new Response(JSON.stringify({ message: 'File content sent to webhook successfully.', webhookResponse: webhookResult }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error("Error in 'save-file-content' Edge Function:", error);
    return new Response(JSON.stringify({ error: error.message || 'An unexpected error occurred in the Edge Function.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});