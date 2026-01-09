# Debug Steps for Calls Issue

Please check the following:

1. **Browser Console**: Open the browser console (F12) and check for any errors when loading the Calls page

2. **Network Tab**: Check the Network tab to see if the `/api/calls` request is being made and what response it's returning

3. **Server Logs**: Check if there are any errors in the server console when the calls endpoint is hit

4. **Airtable Data**: 
   - Do you have any records in your Calls table in Airtable?
   - Do you have any Batches created?
   - Are the calls properly linked to batches via the batchId field?

Common issues:
- If you have no Batches, getCalls will return empty array
- If there's an Airtable error, it's caught and returns empty array silently
- Check if the batchId field in Calls table is a number field, not a lookup
