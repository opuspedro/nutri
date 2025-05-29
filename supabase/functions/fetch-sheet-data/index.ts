import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// Import the official Google Auth library via esm.sh
import { GoogleAuth } from 'https://esm.sh/google-auth-library@9.11.0'; // Use a specific version

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileName } = await req.json();

    if (!fileName) {
      return new Response(JSON.stringify({ error: 'Missing fileName in request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get Google Sheets credentials from Supabase Secret
    const credentialsJson = Deno.env.get('GOOGLE_SHEETS_CREDENTIALS_JSON');

    if (!credentialsJson) {
       console.error("GOOGLE_SHEETS_CREDENTIALS_JSON secret not set.");
       return new Response(JSON.stringify({ error: 'Server configuration error: Google Sheets credentials missing.' }), {
         status: 500,
         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
       });
    }

    const credentials = JSON.parse(credentialsJson);

    // Authenticate using google-auth-library
    const auth = new GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'], // Scope for reading sheets
    });
    const authClient = await auth.getClient();

    // --- Configuration ---
    // YOUR Google Sheet ID
    const SHEET_ID = '1dsThViSXz2fuwew9APMDWafH119crauiPVHCAIX64k4';
    // YOUR sheet name and range (e.g., 'Sheet1!A1:Z300')
    // Reading up to 300 rows, columns A to Z
    const SHEET_RANGE = 'Sheet1!A1:Z300';
    // YOUR 0-based index of the column containing the file name (e.g., 1 for Column B)
    const FILE_NAME_COLUMN_INDEX = 1;

    if (SHEET_ID === 'YOUR_SHEET_ID' || SHEET_RANGE === 'Sheet1!A:Z') {
         console.error("Google Sheet ID or Range not configured in Edge Function.");
         return new Response(JSON.stringify({ error: 'Server configuration error: Google Sheet details not set.' }), {
           status: 500,
           headers: { ...corsHeaders, 'Content-Type': 'application/json' },
         });
    }
     if (FILE_NAME_COLUMN_INDEX < 0) {
         console.error("File name column index not configured correctly.");
         return new Response(JSON.stringify({ error: 'Server configuration error: File name column index not set.' }), {
           status: 500,
           headers: { ...corsHeaders, 'Content-Type': 'application/json' },
         });
    }

    // Construct the Google Sheets API URL
    const sheetsApiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_RANGE}`;

    // Make the request using the authenticated client
    const sheetsResponse = await authClient.request({ url: sheetsApiUrl });

    if (sheetsResponse.status !== 200) {
        console.error("Error fetching sheet data from Google API:", sheetsResponse.status, sheetsResponse.statusText);
        // Attempt to read response body for more details if available
        try {
            const errorBody = await sheetsResponse.data; // authClient.request might put body in .data
            console.error("Google API Error Body:", errorBody);
        } catch (e) {
            console.error("Could not read Google API error response body:", e);
        }

        return new Response(JSON.stringify({ error: `Failed to fetch sheet data from Google API: Status ${sheetsResponse.status}` }), {
            status: sheetsResponse.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    const sheetData = sheetsResponse.data; // Assuming authClient.request puts the parsed JSON body here
    const sheetValues = sheetData?.values; // Assuming the response structure has a 'values' property

    if (!sheetValues || sheetValues.length === 0) {
        console.log("No data found in the specified sheet range.");
        return new Response(JSON.stringify({ data: null, message: 'No data found in sheet.' }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // Find the row matching the file name
    // Assuming the first row is headers, start search from the second row (index 1)
    const dataRows = sheetValues.slice(1); // Skip header row if it exists

    const foundRow = dataRows.find(row =>
        // Ensure the row and the target column exist before accessing
        row && row.length > FILE_NAME_COLUMN_INDEX &&
        row[FILE_NAME_COLUMN_INDEX] && row[FILE_NAME_COLUMN_INDEX].toString().trim() === fileName.trim()
    );

    if (foundRow) {
      console.log(`Found data for file "${fileName}" in sheet:`, foundRow);
      return new Response(JSON.stringify({ data: foundRow }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      console.log(`No data found for file "${fileName}" in sheet.`);
      return new Response(JSON.stringify({ data: null, message: 'Data not found for this file.' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error("Error in Edge Function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});