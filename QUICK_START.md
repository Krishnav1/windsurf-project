# ⚡ **QUICK START - 3 STEPS TO PRODUCTION**

---

## **🎯 STEP 1: GET SERVICE ROLE KEY (2 mins)**

1. Open: https://app.supabase.com/project/gviwynyikaaxcjjvuedg/settings/api
2. Scroll to **"Project API keys"**
3. Copy the **`service_role`** key (the long one, NOT anon)
4. Save it - you'll paste it in Vercel

---

## **🎯 STEP 2: SETUP STORAGE (5 mins)**

1. Open: https://app.supabase.com/project/gviwynyikaaxcjjvuedg/sql/new
2. Copy this SQL and click "Run":

```sql
-- Storage policies for KYC documents
CREATE POLICY "Users upload own KYC" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'kyc-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users view own KYC" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'kyc-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Admins view all KYC" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'kyc-documents' AND EXISTS (
  SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'
));

CREATE POLICY "Admins delete KYC" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'kyc-documents' AND EXISTS (
  SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'
));

-- Storage policies for Issuer documents
CREATE POLICY "Issuers upload own docs" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'issuer-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Issuers view own docs" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'issuer-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Admins view all issuer docs" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'issuer-documents' AND EXISTS (
  SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'
));
```

---

## **🎯 STEP 3: ADD TO VERCEL (5 mins)**

1. Go to: https://vercel.com/dashboard
2. Select your project → **Settings** → **Environment Variables**
3. Add these (click "Add New" for each):

```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://gviwynyikaaxcjjvuedg.supabase.co
Environment: ✅ Production ✅ Preview ✅ Development

Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2aXd5bnlpa2FheGNqanZ1ZWRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NjA1MjIsImV4cCI6MjA3NjIzNjUyMn0.t_cealReTDzITOrDADFpVPfqu4FUBnHkJWx2ivBf4l4
Environment: ✅ Production ✅ Preview ✅ Development

Name: SUPABASE_SERVICE_ROLE_KEY
Value: <PASTE_FROM_STEP_1>
Environment: ✅ Production ✅ Preview ✅ Development

Name: JWT_SECRET
Value: 7VuIS4J1gJUMocJd5/DiwC5Qc/+F/DMFUXH6pn/yf/Q=
Environment: ✅ Production ✅ Preview ✅ Development

Name: ENCRYPTION_KEY
Value: 245e89a2d830f9c87e25e6c864508f0b8ce430d7e69f8e61d84fe8b1a79f3589
Environment: ✅ Production ✅ Preview ✅ Development

Name: NEXT_PUBLIC_RPC_URL
Value: https://rpc-amoy.polygon.technology
Environment: ✅ Production ✅ Preview ✅ Development

Name: NEXT_PUBLIC_CHAIN_ID
Value: 80002
Environment: ✅ Production ✅ Preview ✅ Development

Name: NODE_ENV
Value: production
Environment: ✅ Production only
```

4. Click **"Redeploy"** in Vercel Deployments tab

---

## **✅ DONE! TEST YOUR APP**

1. Visit your Vercel URL
2. Register as investor
3. Upload KYC documents
4. Login as admin
5. Go to `/admin/kyc`
6. Review and approve documents

---

## **🎊 YOU'RE LIVE!**

**Total Time:** ~12 minutes
**What's Working:**
- ✅ Secure document upload
- ✅ Admin verification system
- ✅ Real-time notifications
- ✅ Blockchain integration
- ✅ Complete audit trail

**Need Help?** Check `FINAL_CHECKLIST.md` for detailed troubleshooting.
