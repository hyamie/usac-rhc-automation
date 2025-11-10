-- Allow service role to insert data
CREATE POLICY "Service role can insert"
ON clinics_pending_review
FOR INSERT
TO service_role
WITH CHECK (true);

-- Allow service role to select data
CREATE POLICY "Service role can select"
ON clinics_pending_review
FOR SELECT
TO service_role
USING (true);

-- Allow service role to update data
CREATE POLICY "Service role can update"
ON clinics_pending_review
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);
