import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// Import the official Google Auth library using npm: prefix
import { GoogleAuth } from 'npm:google-auth-library@9.11.0'; // Use npm: prefix

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log("Edge Function received request.");
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
    const SHEET_ID = '1dsThViSXz2fuwew9APMDWafH119crauiPVHCAIX64k4';
    // YOUR sheet name
    const SHEET_NAME = "leads hotmart";
    // YOUR range (e.g., 'A1:Z300')
    const SHEET_RANGE_PART = "H1:BA"; // Changed range to H1:BA to read all rows
    // YOUR 0-based index of the column containing the file name (e.g., 1 for Column B)
    const FILE_NAME_COLUMN_INDEX = 1; // Still using Column B for file name search

    console.log(`Sheet ID: ${SHEET_ID}, Sheet Name: "${SHEET_NAME}", Range Part: "${SHEET_RANGE_PART}", File Name Column Index: ${FILE_NAME_COLUMN_INDEX}`);

    // Simplified configuration check
    if (SHEET_ID === 'YOUR_SHEET_ID' || FILE_NAME_COLUMN_INDEX < 0) {
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

    // Find the row matching the file name
    const foundRow = dataRows.find(row =>
        // Ensure the row and the target column exist before accessing
        row && row.length > FILE_NAME_COLUMN_INDEX &&
        row[FILE_NAME_COLUMN_INDEX] && row[FILE_NAME_COLUMN_INDEX].toString().trim() === fileName.trim()
    );

    if (foundRow) {
      console.log(`Found data for file "${fileName}" in sheet.`);
      // Return both header and the found data row
      return new Response(JSON.stringify({ data: { header: headerRow, row: foundRow } }), {
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
    // Catch any other errors during execution
    return new Response(JSON.stringify({ error: error.message || 'An unexpected error occurred in the Edge Function.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});