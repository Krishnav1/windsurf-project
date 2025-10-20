# 🗄️ **SUPABASE STORAGE POLICIES SETUP**

## **IMPORTANT: Manual Setup Required**

Due to Supabase permissions, storage policies must be set via the dashboard.

---

## **📍 WHERE TO GO**

1. Open: https://app.supabase.com/project/gviwynyikaaxcjjvuedg/storage/policies
2. Click on **"New Policy"** for each bucket

---

## **📋 POLICIES TO CREATE**

### **For Bucket: `kyc-documents`**

#### **Policy 1: Users can upload own KYC docs**
- **Operation:** INSERT
- **Target roles:** authenticated
- **Policy definition:**
```sql
(bucket_id = 'kyc-documents'::text) 
AND ((storage.foldername(name))[1] = (auth.uid())::text)
```

#### **Policy 2: Users can view own KYC docs**
- **Operation:** SELECT
- **Target roles:** authenticated
- **Policy definition:**
```sql
(bucket_id = 'kyc-documents'::text) 
AND ((storage.foldername(name))[1] = (auth.uid())::text)
```

#### **Policy 3: Admins can view all KYC docs**
- **Operation:** SELECT
- **Target roles:** authenticated
- **Policy definition:**
```sql
(bucket_id = 'kyc-documents'::text) 
AND (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.role = 'admin'::text))))
```

#### **Policy 4: Admins can delete KYC docs**
- **Operation:** DELETE
- **Target roles:** authenticated
- **Policy definition:**
```sql
(bucket_id = 'kyc-documents'::text) 
AND (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.role = 'admin'::text))))
```

---

### **For Bucket: `issuer-documents`**

#### **Policy 1: Issuers can upload own docs**
- **Operation:** INSERT
- **Target roles:** authenticated
- **Policy definition:**
```sql
(bucket_id = 'issuer-documents'::text) 
AND ((storage.foldername(name))[1] = (auth.uid())::text)
```

#### **Policy 2: Issuers can view own docs**
- **Operation:** SELECT
- **Target roles:** authenticated
- **Policy definition:**
```sql
(bucket_id = 'issuer-documents'::text) 
AND ((storage.foldername(name))[1] = (auth.uid())::text)
```

#### **Policy 3: Admins can view all issuer docs**
- **Operation:** SELECT
- **Target roles:** authenticated
- **Policy definition:**
```sql
(bucket_id = 'issuer-documents'::text) 
AND (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.role = 'admin'::text))))
```

---

## **⚡ QUICK SETUP (Copy-Paste SQL)**

Alternatively, go to **SQL Editor** and run this:

```sql
-- For kyc-documents bucket
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

-- For issuer-documents bucket
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

## **✅ VERIFICATION**

After creating policies, test:
1. Login as investor
2. Try uploading KYC document
3. Verify you can see your own documents
4. Login as admin
5. Verify you can see all documents

---

## **🚨 TROUBLESHOOTING**

**Error: "new row violates row-level security policy"**
- Check that RLS is enabled on storage.objects
- Verify user is authenticated
- Check user role in users table

**Error: "permission denied for table objects"**
- This is expected when running via API
- Must use Supabase Dashboard UI or SQL Editor

---

**Setup Time: ~5 minutes**
