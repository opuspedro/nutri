import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
// Import the official Google Auth library using npm: prefix
import { GoogleAuth } from 'npm:google-auth-library@9.11.0'; // Use npm: prefix

// Duplicated utility function (cannot import from local files in Edge Functions easily)
// Reverting to previous logic: remove @s.whatsapp.net first, then .txt
function cleanFileName(fileName: string): string {
  if (!fileName) return "";
  let cleaned = fileName;

  // Remove WhatsApp suffix if present at the end
  const whatsappSuffix = "@s.whatsapp.net";
  if (cleaned.endsWith(whatsappSuffix)) {
    cleaned = cleaned.substring(0, cleaned.length - whatsappSuffix.length);
  }

  // Remove .txt extension if present (case-insensitive)
  const txtSuffix = ".txt";
  if (cleaned.toLowerCase().endsWith(txtSuffix)) {
      cleaned = cleaned.substring(0, cleaned.length - txtSuffix.length);
  }

  console.log(`EF cleanFileName (Reverted Logic): Original "${fileName}" -> Cleaned "${cleaned}"`); // Added log

  return cleaned;
}


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log("Edge Function 'regenerate-pdf' received request.");

  // Handle CORS OPTIONS request
  if (req.method === 'OPTIONS') {
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

    // --- Fetch Google Sheet Data ---
    // Use the cleanFileName utility here as well before searching the sheet
    const cleanedFileName = cleanFileName(fileData.name);
    console.log(`Attempting to fetch sheet data for cleaned fileName (Reverted Logic): ${cleanedFileName}`);


    const credentialsJson = Deno.env.get('GOOGLE_SHEETS_CREDENTIALS_JSON');
    const SHEET_ID = Deno.env.get('SHEET_ID'); // Read from secret
    const SHEET_NAME = Deno.env.get('SHEET_NAME'); // Read from secret
    const SHEET_RANGE_PART = Deno.env.get('SHEET_RANGE_PART'); // Read from secret
    const FILE_NAME_COLUMN_INDEX_STR = Deno.env.get('FILE_NAME_COLUMN_INDEX'); // Read from secret

    if (!credentialsJson || !SHEET_ID || !SHEET_NAME || !SHEET_RANGE_PART || !FILE_NAME_COLUMN_INDEX_STR) {
       console.error("Google Sheet configuration secrets not set.");
       return new Response(JSON.stringify({ error: 'Server configuration error: Google Sheet details missing secrets.' }), {
         status: 500,
         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
       });
    }

    const FILE_NAME_COLUMN_INDEX = parseInt(FILE_NAME_COLUMN_INDEX_STR, 10);
    if (isNaN(FILE_NAME_COLUMN_INDEX) || FILE_NAME_COLUMN_INDEX < 0) {
        console.error("FILE_NAME_COLUMN_INDEX secret is not a valid non-negative number.");
        return new Response(JSON.stringify({ error: 'Server configuration error: Invalid FILE_NAME_COLUMN_INDEX secret.' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }


    const credentials = JSON.parse(credentialsJson);
    const auth = new GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    const authClient = await auth.getClient();
    const accessToken = await authClient.getAccessToken();

    if (!accessToken || !accessToken.token) {
         console.error("Failed to obtain Google Access Token.");
         return new Response(JSON.stringify({ error: 'Server authentication error: Could not obtain Google Access Token.' }), {
           status: 500,
           headers: { ...corsHeaders, 'Content-Type': 'application/json' },
         });
    }

    const fullRangeString = `'${SHEET_NAME}'!${SHEET_RANGE_PART}`;
    const encodedFullRange = encodeURIComponent(fullRangeString);
    const sheetsApiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodedFullRange}`;

    const sheetsResponse = await fetch(sheetsApiUrl, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken.token}`,
            'Accept': 'application/json'
        }
    });

    if (!sheetsResponse.ok) {
        const errorBody = await sheetsResponse.text();
        console.error("Error fetching sheet data from Google API:", sheetsResponse.status, sheetsResponse.statusText);
        console.error("Google API Error Body:", errorBody);
        // Decide if you want to fail the regeneration request if sheet data fetch fails
        // For now, we'll return an error, but you could potentially proceed without sheet data
         return new Response(JSON.stringify({ error: `Failed to fetch sheet data from Google API: Status ${sheetsResponse.status}`, details: errorBody }), {
             status: 500, // Or sheetsResponse.status
             headers: { ...corsHeaders, 'Content-Type': 'application/json' },
         });
    }

    const sheetData = await sheetsResponse.json();
    const sheetValues = sheetData?.values;

    let foundSheetRowData = null;
    let sheetHeader = null;

    if (sheetValues && sheetValues.length > 0) {
        sheetHeader = sheetValues[0]; // First row is header
        const dataRows = sheetValues.slice(1); // Rest are data rows

        // Find the row matching the CLEANED file name
        const foundRow = dataRows.find(row =>
            row && row.length > FILE_NAME_COLUMN_INDEX &&
            row[FILE_NAME_COLUMN_INDEX] && row[FILE_NAME_COLUMN_INDEX].toString().trim() === cleanedFileName.trim() // Use cleanedFileName here
        );

        if (foundRow) {
            foundSheetRowData = { header: sheetHeader, row: foundRow };
            console.log(`Found sheet data for cleaned file "${cleanedFileName}".`);
        } else {
            console.log(`No sheet data found for cleaned file "${cleanedFileName}".`);
        }
    } else {
        console.log("No data found in the specified sheet range.");
    }


    // --- Call your n8n webhook ---
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
            fileName: fileData.name, // Send original name
            cleanedFileName: cleanedFileName, // Send cleaned name too, just in case n8n needs it
            minioPath: fileData.minio_path,
            sheetData: foundSheetRowData, // <-- Including the fetched sheet data here
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

  } catch (error: any) {
    console.error("Error in 'regenerate-pdf' Edge Function:", error);
    return new Response(JSON.stringify({ error: error.message || 'An unexpected error occurred in the Edge Function.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});