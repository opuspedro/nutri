import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log("Edge Function 'regenerate-pdf' received request.");

  // Handle CORS OPTIONS request
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS request.");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Attempting to parse request body...");
    const { fileId } = await req.json();
    console.log("Request body parsed successfully. fileId:", fileId);

    if (!fileId) {
      console.error('Missing fileId in request body');
      return new Response(JSON.stringify({ error: 'Missing fileId in request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client within the Edge Function
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Use service role key for backend operations
    );
    console.log("Supabase client initialized in Edge Function.");

    // Fetch file details from Supabase
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

    // --- Call your n8n webhook ---
    // You need to replace 'YOUR_N8N_WEBHOOK_URL' with the actual URL of your n8n webhook.
    // You might want to store this URL as a Supabase Secret named 'N8N_REGENERATE_PDF_WEBHOOK_URL'
    // and access it using Deno.env.get('N8N_REGENERATE_PDF_WEBHOOK_URL').
    const n8nWebhookUrl = Deno.env.get('N8N_REGENERATE_PDF_WEBHOOK_URL') || 'YOUR_N8N_WEBHOOK_URL'; // Replace or use secret

    if (n8nWebhookUrl === 'YOUR_N8N_WEBHOOK_URL') {
         console.error("N8N_REGENERATE_PDF_WEBHOOK_URL secret not set or placeholder used.");
         return new Response(JSON.stringify({ error: 'Server configuration error: n8n webhook URL missing.' }), {
           status: 500,
           headers: { ...corsHeaders, 'Content-Type': 'application/json' },
         });
    }

    console.log(`Calling n8n webhook at: ${n8nWebhookUrl}`);

    const n8nResponse = await fetch(n8nWebhookUrl, {
        method: 'POST', // Or GET, depending on your n8n webhook setup
        headers: {
            'Content-Type': 'application/json',
            // Add any necessary authentication headers for your n8n webhook here
            // e.g., 'Authorization': `Bearer ${Deno.env.get('N8N_API_KEY')}`
        },
        body: JSON.stringify({
            fileId: fileData.id,
            fileName: fileData.name,
            minioPath: fileData.minio_path,
            // Add any other data your n8n workflow needs
        }),
    });

    console.log(`n8n webhook response status: ${n8nResponse.status}`);

    if (!n8nResponse.ok) {
        const errorBody = await n8nResponse.text();
        console.error("Error calling n8n webhook:", n8nResponse.status, n8nResponse.statusText);
        console.error("n8n Error Body:", errorBody);
        return new Response(JSON.stringify({ error: `Failed to trigger n8n workflow: Status ${n8nResponse.status}`, details: errorBody }), {
            status: n8nResponse.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    const n8nResult = await n8nResponse.json(); // Or text(), depending on n8n response
    console.log("n8n webhook response body:", n8nResult);

    // Return success response
    return new Response(JSON.stringify({ message: 'PDF regeneration request sent to n8n successfully.', n8nResponse: n8nResult }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error in 'regenerate-pdf' Edge Function:", error);
    return new Response(JSON.stringify({ error: error.message || 'An unexpected error occurred in the Edge Function.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});