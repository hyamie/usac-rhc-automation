
# Phase 1 Workflow: USAC Data Pull and Enrichment

This workflow is responsible for pulling the latest Form 465 filings from the USAC website, enriching them with historical funding data, formatting them properly, and storing them in Supabase for further use.

---

## Step 1: Scheduled Trigger

**Purpose**: Start the workflow automatically every day at a specific time.

- **Node Type**: Schedule Trigger  
- **Schedule**: Every day at 7:00 AM CST  
- **Configuration**:  
  - Mode: Time-based  
  - Frequency: Daily  
  - Time: 07:00 AM  

---

## Step 2: GET Form 465 Filings from USAC

**Purpose**: Retrieve the latest Telecom Program Form 465 filings posted the previous day.

- **Node Type**: HTTP Request  
- **Method**: `GET`  
- **Authentication**: None (token not required; token causes empty response)  
- **Endpoint**: `https://portal.usac.org/some-endpoint-for-465`  
- **Query Parameters**:  
  - `program`: "Telecom"  
  - `postingStartDate`: `{{ $today.minus(1).format('YYYY-MM-DD') }}`  
  - `limit`: 1000  
  - `sortBy`: postingStartDate DESC  

- **Output**: Raw JSON array of 465 filing objects  
- **Edge Cases**:  
  - Handle pagination if >1000 entries  
  - Validate structure to avoid null/malformed entries  

---

## Step 3: Extract and Transform Filing Data

**Purpose**: Normalize and map necessary fields from USAC filing into structured format.

- **Node Type**: Function or Set  
- **Input**: JSON array from Step 2  
- **Transformations**:
  - Extract the following fields:  
    - `fundingYear`  
    - `hcpNumber`  
    - `hcpName`  
    - `applicationType`  
    - `siteAddress.line1`, `siteAddress.city`, `siteAddress.state`, `siteAddress.zipCode`  
    - `contact.firstName`, `contact.lastName`, `contact.phone`, `contact.email`  
    - `allowableContractStartDate`, `requestedContractPeriod`  
    - `fccFormLink`  
    - `mailContact.firstName`, `mailContact.lastName`, `mailContact.orgName`, `mailContact.phone`, `mailContact.email`  
    - `descriptionOfServicesRequested`  
    - Combine `RFP1-10` and `AdditionalDoc1-10` into `combinedDocumentLinks[]`  

- **Validation**:  
  - Nulls → empty strings  
  - Trim whitespace  
  - Normalize phone/email formats  

---

## Step 4: Enrich with Historical Funding Data

**Purpose**: Add historical funding info from the second USAC database.

- **Node Type**: HTTP Request in loop  
- **Loop**: For each clinic/HCP number from Step 3  
- **Years Queried**:  
  - Automatically compute current and prior two funding years  
  - Example:
    ```js
    const currentYear = new Date().getFullYear();
    return [currentYear - 1, currentYear - 2];
    ```

- **API Endpoint**: `https://portal.usac.org/funding-history/{hcpNumber}/{fundingYear}`  
- **Merged Fields Added**:  
  - `fundingYear`  
  - `totalAmount`  
  - `serviceProvider`  
  - `contractDuration`  
  - `bandwidth`  

---

## Step 5: Push Enriched Record to Supabase

**Purpose**: Save enriched result to `form465_filings` table in Supabase.

- **Node Type**: Supabase Insert (Plan A)  
- **Fallback (Plan B)**: HTTP request to Supabase REST API  
- **Requirements**:
  - Field names must match column names in Supabase  
  - Array/JSON fields properly serialized  

- **Error Handling**:
  - Log HCP number and error if insert fails  
  - Skip if duplicate (based on `hcpNumber + fundingYear + applicationType`)  

---

## Step 6: Log Completion

**Purpose**: Confirm success and record workflow run info.

- **Node Type**: Function  
- **Fields Logged**:  
  - Timestamp  
  - Number of filings processed  
  - Any error messages  

- **Optional Add-ons**:  
  - Slack/email alert  
  - Write to external log database  

---

## Summary

- **Nodes**: 6 total  
- **Execution Time**: ~1–3 min/day  
- **Data Destination**: Supabase  
- **Next Phase**: Phase 2 – Display on Web App + Enrichment Trigger

