import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// Import the official Google Sheets and Auth libraries via esm.sh
import { GoogleAuth } from 'https://esm.sh/google-auth-library@9.11.0'; // Use a specific version
import { google } from 'https://esm.sh/@google-cloud/sheets@2.0.0'; // Use a specific version

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

    // Initialize Google Sheets client
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    // --- Configuration ---
    const SHEET_ID = 'YOUR_SHEET_ID'; // <-- REPLACE with your Google Sheet ID
    const SHEET_RANGE = 'Sheet1!A:Z'; // <-- REPLACE with your sheet name and range (e.g., 'Sheet1!A:Z')
    const FILE_NAME_COLUMN_INDEX = 0; // <-- REPLACE with the 0-based index of the column containing the file name (e.g., 0 for column A)

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


    // Read data from the sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: SHEET_RANGE,
    });

    const sheetValues = response.data.values;

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
        row[FILE_NAME_COLUMN_INDEX] && row[FILE_NAME_COLUMN_INDEX].toString().trim() === fileName.trim()
    );

    if (foundRow) {
      console.log(`Found data for file "${fileName}":`, foundRow);
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