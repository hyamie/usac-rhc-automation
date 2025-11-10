
# Phase 1 Workflow Outline

## Step 1: Scheduled Data Pull from USAC
- **Trigger**: Daily at 7 AM.
- **Action**: GET request (no authentication) for Form 465 filings.
- **Parameters**: 
  - Filter: Telecom program.
  - Date: Posting date = today minus one day.
  - Limit: 1000 results, sorted by posting date descending.

## Step 2: Extract and Format Fields
- **Action**: Process data and extract columns:
  - **Funding Year**
  - **HCP Number**
  - **HCP Name**
  - **Application Type**
  - **Site Address Line 1**, **Site City**, **Site State**, **Site Zip Code**
  - **Contact First Name**, **Contact Last Name**, **Contact Phone**, **Contact Email**
  - **Allowable Contract Start Date**
  - **Requested Contract Period**
  - **Link to FCC Form PDF**
  - **Mail Contact First Name**, **Mail Contact Last Name**, **Mail Contact Org Name**, **Mail Contact Phone**, **Mail Contact Email**
  - **Descriptions of Services Requested**
  - **Additional Links**: Combine RFP1-10 and Additional Document1-10 into a single field.

## Step 3: Query and Merge Historical Funding Data
- **Action**: GET request to fetch historical funding for the HCP number for the current and previous two years.
- **Dynamic Logic**: Automatically determine the correct funding years based on the current date.
- **Merge**: Combine the historical funding data with the original filing data.

## Step 4: Insert Merged Data into Supabase
- **Plan A**: Use Supabase node to insert the merged record into the table. Ensure field mapping matches Supabase columns.
- **Plan B**: If needed, use a custom HTTP request to the Supabase API.

## Step 5: Log Completion
- **Action**: Log workflow completion, total filings processed, and a timestamp. This can be extended to send notifications if desired.
