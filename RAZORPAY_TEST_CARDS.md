# 💳 Razorpay Test Payment Methods

## 🎯 Quick Reference for Testing

---

## ✅ Test Cards (Always Success)

### Visa
```
Card Number: 4111 1111 1111 1111
CVV: 123
Expiry: 12/25
Name: Test User
OTP: 123456
```

### Mastercard
```
Card Number: 5555 5555 5555 4444
CVV: 123
Expiry: 12/25
Name: Test User
OTP: 123456
```

### Rupay
```
Card Number: 6073 8499 9999 9999
CVV: 123
Expiry: 12/25
Name: Test User
OTP: 123456
```

---

## ❌ Test Cards (Always Fail)

### Card Declined
```
Card Number: 4000 0000 0000 0002
CVV: 123
Expiry: 12/25
```

### Insufficient Funds
```
Card Number: 4000 0000 0000 9995
CVV: 123
Expiry: 12/25
```

---

## 📱 Test UPI

### Any UPI ID Works
```
test@paytm
test@upi
success@razorpay
```

**Note:** In test mode, all UPI payments succeed automatically

---

## 🏦 Test Net Banking

### Available Banks
- State Bank of India (SBI)
- HDFC Bank
- ICICI Bank
- Axis Bank
- Kotak Mahindra Bank

**Credentials:** Use any test credentials, all succeed in test mode

---

## 💰 Test Wallets

### Paytm
```
Mobile: 9999999999
OTP: 123456
```

### PhonePe
```
Mobile: 9999999999
OTP: 123456
```

---

## 🔐 Test OTP

For all payment methods requiring OTP:
```
OTP: 123456
```

---

## 📊 Test Amounts

### Special Amounts (for specific scenarios)

```
₹100.00 - Always succeeds
₹200.00 - Always fails
₹300.00 - Pending (manual capture required)
```

---

## 🧪 Testing Different Scenarios

### 1. Successful Payment
```
Use: 4111 1111 1111 1111
Result: Payment succeeds immediately
```

### 2. Failed Payment
```
Use: 4000 0000 0000 0002
Result: Payment fails with "Card declined"
```

### 3. Cancelled Payment
```
Use any card, then click "Cancel" in payment modal
Result: Payment cancelled by user
```

### 4. Timeout
```
Use any card, wait without completing
Result: Payment times out after 15 minutes
```

---

## 🎯 Recommended for Testing

**For Quick Success Test:**
```
Card: 4111 1111 1111 1111
CVV: 123
Expiry: 12/25
OTP: 123456
```

**For UPI Test:**
```
UPI ID: test@paytm
```

**For Failure Test:**
```
Card: 4000 0000 0000 0002
```

---

## 📱 Mobile Testing

### Test Phone Numbers
```
9999999999 - Always succeeds
8888888888 - Always succeeds
7777777777 - Always fails
```

---

## 🔄 Payment Flow

1. **Enter Card Details**
   - Use test card number
   - Any CVV (3 digits)
   - Any future expiry date

2. **Click Pay**
   - Redirected to OTP page

3. **Enter OTP**
   - Use: `123456`
   - Click Submit

4. **Success!**
   - Payment processed
   - Redirected back to app

---

## 🌐 Test in Different Browsers

- ✅ Chrome
- ✅ Firefox
- ✅ Safari
- ✅ Edge

All test cards work in all browsers.

---

## 📞 Important Notes

1. **No Real Money:** Test mode never charges real money
2. **Always Succeeds:** Most test cards always succeed
3. **Instant:** No actual bank processing
4. **OTP:** Always use `123456`
5. **UPI:** Any UPI ID works

---

## 🎓 Testing Checklist

- [ ] Test successful card payment
- [ ] Test failed card payment
- [ ] Test UPI payment
- [ ] Test payment cancellation
- [ ] Test with different amounts
- [ ] Test on mobile device
- [ ] Test in different browsers

---

## 🚀 Quick Start

**For fastest testing:**

1. Click "Buy" on any token
2. Enter quantity
3. Click "Pay"
4. Use: `4111 1111 1111 1111`
5. CVV: `123`
6. Expiry: `12/25`
7. OTP: `123456`
8. Done! ✅

---

## 📊 Razorpay Dashboard

View test payments:
1. Go to https://dashboard.razorpay.com
2. Click "Payments"
3. See all test transactions
4. Filter by status, date, amount

---

## 🔐 Security Note

**These are TEST credentials only!**
- Never use in production
- Switch to live keys before going live
- Test keys start with `rzp_test_`
- Live keys start with `rzp_live_`

---

**💡 Tip:** Bookmark this page for quick reference during testing!
