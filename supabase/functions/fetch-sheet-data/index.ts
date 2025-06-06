import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// Import the official Google Auth library using npm: prefix
import { GoogleAuth } from 'npm:google-auth-library@9.11.0'; // Use npm: prefix

// Duplicated utility function (cannot import from local files in Edge Functions easily)
function cleanFileName(fileName: string): string {
  if (!fileName) return "";
  let cleaned = fileName;

  // Remove WhatsApp suffix
  const whatsappSuffix = "@s.whatsapp.net";
  if (cleaned.endsWith(whatsappSuffix)) {
    cleaned = cleaned.substring(0, cleaned.length - whatsappSuffix.length);
  }

  // Remove .txt extension if present
  const txtSuffix = ".txt";
  if (cleaned.toLowerCase().endsWith(txtSuffix)) {
      cleaned = cleaned.substring(0, cleaned.length - txtSuffix.length);
  }

  return cleaned;
}


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log("Edge Function 'fetch-sheet-data' received request.");
  console.log("Method:", req.method);
  console.log("Headers:", req.headers);

  // Handle CORS OPTIONS request
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS request.");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Attempting to parse request body...");
    const { fileName } = await req.json();
    console.log("Request body parsed successfully. fileName:", fileName);

    if (!fileName) {
      console.error('Missing fileName in request body');
      return new Response(JSON.stringify({ error: 'Missing fileName in request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Clean the file name before using it for the sheet lookup
    const cleanedFileName = cleanFileName(fileName);
    console.log(`Cleaned file name for sheet lookup: "${cleanedFileName}"`);


    // Get Google Sheets credentials from Supabase Secret
    const credentialsJson = Deno.env.get('GOOGLE_SHEETS_CREDENTIALS_JSON');
    console.log(`Credentials secret status: ${credentialsJson ? 'Set' : 'Not Set'}`);

    if (!credentialsJson) {
       console.error("GOOGLE_SHEETS_CREDENTIALS_JSON secret not set.");
       return new Response(JSON.stringify({ error: 'Server configuration error: Google Sheets credentials missing.' }), {
         status: 500,
         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
       });
    }

    const credentials = JSON.parse(credentialsJson);
    console.log("Credentials parsed successfully.");

    // Authenticate using google-auth-library
    console.log("Attempting Google Auth...");
    const auth = new GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'], // Scope for reading sheets
    });
    const authClient = await auth.getClient();
    console.log("Google Auth client obtained.");

    // Get the access token
    const accessToken = await authClient.getAccessToken();
    console.log(`Access token obtained: ${accessToken ? 'Yes' : 'No'}`);

    if (!accessToken || !accessToken.token) {
         console.error("Failed to obtain Google Access Token.");
         return new Response(JSON.stringify({ error: 'Server authentication error: Could not obtain Google Access Token.' }), {
           status: 500,
           headers: { ...corsHeaders, 'Content-Type': 'application/json' },
         });
    }


    // --- Configuration ---
    // YOUR Google Sheet ID
    const SHEET_ID = Deno.env.get('SHEET_ID') || 'YOUR_SHEET_ID'; // Read from secret
    // YOUR sheet name
    const SHEET_NAME = Deno.env.get('SHEET_NAME') || 'YOUR_SHEET_NAME'; // Read from secret
    // YOUR range (e.g., 'A1:Z300') - Updated to include B and H:BA
    const SHEET_RANGE_PART = Deno.env.get('SHEET_RANGE_PART') || 'YOUR_SHEET_RANGE_PART'; // Read from secret
    // YOUR 0-based index of the column containing the file name (e.g., 1 for Column B)
    const FILE_NAME_COLUMN_INDEX_STR = Deno.env.get('FILE_NAME_COLUMN_INDEX') || '0'; // Read from secret, default to '0'

    const FILE_NAME_COLUMN_INDEX = parseInt(FILE_NAME_COLUMN_INDEX_STR, 10);


    console.log(`Sheet ID: ${SHEET_ID}, Sheet Name: "${SHEET_NAME}", Range Part: "${SHEET_RANGE_PART}", File Name Column Index: ${FILE_NAME_COLUMN_INDEX}`);

    // Simplified configuration check
    if (SHEET_ID === 'YOUR_SHEET_ID' || SHEET_NAME === 'YOUR_SHEET_NAME' || SHEET_RANGE_PART === 'YOUR_SHEET_RANGE_PART' || isNaN(FILE_NAME_COLUMN_INDEX) || FILE_NAME_COLUMN_INDEX < 0) {
         console.error("Google Sheet configuration is incomplete or incorrect in Edge Function.");
         return new Response(JSON.stringify({ error: 'Server configuration error: Google Sheet details not set correctly.' }), {
           status: 500,
           headers: { ...corsHeaders, 'Content-Type': 'application/json' },
         });
    }

    // Manually construct the full range string with single quotes as per Google API docs
    const fullRangeString = `'${SHEET_NAME}'!${SHEET_RANGE_PART}`;
    console.log(`Range string BEFORE encoding: "${fullRangeString}"`); // Log before encoding

    // Encode the entire range string using encodeURIComponent
    const encodedFullRange = encodeURIComponent(fullRangeString);
    console.log(`Range string AFTER encoding: "${encodedFullRange}"`); // Log after encoding


    // Construct the Google Sheets API URL using the manually encoded range
    const sheetsApiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodedFullRange}`;
    console.log(`Fetching data from Google Sheets API URL: ${sheetsApiUrl}`);

    // Make the request using Deno's native fetch
    const sheetsResponse = await fetch(sheetsApiUrl, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken.token}`, // Use the obtained access token
            'Accept': 'application/json' // Explicitly request JSON
        }
    });

    console.log(`Google Sheets API response status: ${sheetsResponse.status}`);

    // Check for non-2xx status codes
    if (!sheetsResponse.ok) {
        const errorBody = await sheetsResponse.text(); // Read response body as text for more details
        console.error("Error fetching sheet data from Google API:", sheetsResponse.status, sheetsResponse.statusText);
        console.error("Google API Error Body:", errorBody);

        // Return the status code received from Google API
        return new Response(JSON.stringify({ error: `Failed to fetch sheet data from Google API: Status ${sheetsResponse.status}`, details: errorBody }), {
            status: sheetsResponse.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    const sheetData = await sheetsResponse.json(); // Parse response body as JSON
    const sheetValues = sheetData?.values;
    console.log(`Fetched ${sheetValues ? sheetValues.length : 0} rows from sheet.`);
    console.log("Fetched sheet values (first 5 rows):", sheetValues ? sheetValues.slice(0, 5) : "No values");


    if (!sheetValues || sheetValues.length === 0) {
        console.log("No data found in the specified sheet range.");
        return new Response(JSON.stringify({ data: null, message: 'No data found in sheet.' }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // Extract header row (first row) and data rows (rest)
    const headerRow = sheetValues[0];
    const dataRows = sheetValues.slice(1); // Skip header row

    // Find the row matching the CLEANED file name
    const foundRow = dataRows.find(row =>
        // Ensure the row and the target column exist before accessing
        row && row.length > FILE_NAME_COLUMN_INDEX &&
        row[FILE_NAME_COLUMN_INDEX] && row[FILE_NAME_COLUMN_INDEX].toString().trim() === cleanedFileName.trim() // Use cleanedFileName here
    );

    if (foundRow) {
      console.log(`Found data for cleaned file name "${cleanedFileName}" in sheet.`);
      // Return both header and the found data row
      return new Response(JSON.stringify({ data: { header: headerRow, row: foundRow } }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      console.log(`No data found for cleaned file name "${cleanedFileName}" in sheet.`);
      return new Response(JSON.stringify({ data: null, message: 'Data not found for this file.' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error: any) {
    console.error("Error in Edge Function:", error);
    // Catch any other errors during execution
    return new Response(JSON.stringify({ error: error.message || 'An unexpected error occurred in the Edge Function.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});