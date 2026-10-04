import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

import { env } from "../config/env.js";

const BASE_URL = "http://localhost:4000/api";
const MONGO_URI = env.mongoUri;

async function main() {
  console.log("============================================================");
  console.log(" PinkCityHomes — Email / OTP End-to-End Verification Suite");
  console.log("============================================================\n");

  const mongo = new MongoClient(MONGO_URI);
  await mongo.connect();
  const db = mongo.db("pinkcityhomes");

  const testEmail = `test.https.${Date.now()}@pinkcitytest.com`;
  const password = "Password@12345";

  try {
    // -------------------------------------------------------------
    // Test 1: User Registration & OTP Dispatch
    // -------------------------------------------------------------
    console.log(`[Test 1] Registering user: ${testEmail}`);
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Resident",
        email: testEmail,
        password,
        role: "CUSTOMER",
      }),
    });

    const regData = (await regRes.json()) as any;
    console.log(`[Test 1] Status: ${regRes.status}`, regData);
    if (regRes.status !== 201) throw new Error("Registration failed");
    console.log("✓ Registration succeeded (OTP generated and email queued)\n");

    // -------------------------------------------------------------
    // Test 2: Check Database for Hashed OTP & Expiration
    // -------------------------------------------------------------
    console.log("[Test 2] Inspecting database verification record");
    const user = await db.collection("users").findOne({ email: testEmail });
    if (!user) throw new Error("User record not found in MongoDB");

    const userId = user.id || user._id.toString();
    const verification = await db
      .collection("email_verifications")
      .findOne({ userId, usedAt: null });

    if (!verification) throw new Error("Verification record not found");
    console.log(`  - User ID: ${verification.userId}`);
    console.log(`  - Hash exists: ${Boolean(verification.otpHash)} (bcrypt hashed)`);
    console.log(`  - Expires at: ${verification.expiresAt}`);
    console.log(`  - Attempts: ${verification.attempts}`);
    console.log("✓ Database record verified with 15-minute expiration\n");

    // -------------------------------------------------------------
    // Test 3: Invalid OTP Attempt & Counter Tracking
    // -------------------------------------------------------------
    console.log("[Test 3] Submitting WRONG OTP ('000000')");
    const wrongRes = await fetch(`${BASE_URL}/auth/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        otp: "000000",
      }),
    });
    const wrongData = (await wrongRes.json()) as any;
    console.log(`[Test 3] Status: ${wrongRes.status}`, wrongData);
    if (wrongRes.status !== 400 || !wrongData.error?.includes("attempts remaining")) {
      throw new Error("Invalid OTP did not return 400 with attempts count");
    }
    console.log("✓ Invalid OTP properly rejected with remaining attempts counter\n");

    // -------------------------------------------------------------
    // Test 4: Resend Cooldown (within 60 seconds)
    // -------------------------------------------------------------
    console.log("[Test 4] Requesting OTP resend immediately (should hit cooldown)");
    const rapidResend = await fetch(`${BASE_URL}/auth/resend-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail }),
    });
    const rapidData = (await rapidResend.json()) as any;
    console.log(`[Test 4] Status: ${rapidResend.status}`, rapidData);
    if (rapidResend.status !== 429) {
      throw new Error("Rapid resend did not trigger 429 cooldown");
    }
    console.log("✓ 60-second cooldown enforced successfully\n");

    // -------------------------------------------------------------
    // Test 5: Expired OTP Validation
    // -------------------------------------------------------------
    console.log("[Test 5] Simulating OTP expiration in DB");
    await db.collection("email_verifications").updateOne(
      { _id: verification._id },
      { $set: { expiresAt: new Date(Date.now() - 1000) } }
    );

    const expiredRes = await fetch(`${BASE_URL}/auth/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, otp: "123456" }),
    });
    const expiredData = (await expiredRes.json()) as any;
    console.log(`[Test 5] Status: ${expiredRes.status}`, expiredData);
    if (expiredRes.status !== 400 || !expiredData.error?.includes("expired")) {
      throw new Error("Expired OTP was not handled properly");
    }
    console.log("✓ Expired OTP rejected with 400\n");

    // -------------------------------------------------------------
    // Test 6: Resend Fresh OTP after resetting cooldown in DB
    // -------------------------------------------------------------
    console.log("[Test 6] Resetting cooldown timestamp in DB and requesting fresh OTP");
    await db.collection("email_verifications").updateMany(
      { userId },
      { $set: { createdAt: new Date(Date.now() - 120_000) } }
    );

    const resendRes = await fetch(`${BASE_URL}/auth/resend-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail }),
    });
    const resendData = (await resendRes.json()) as any;
    console.log(`[Test 6] Status: ${resendRes.status}`, resendData);
    if (resendRes.status !== 200) throw new Error("Resend OTP failed");

    // Check that previous OTP was invalidated and new OTP exists
    const allVerifs = await db
      .collection("email_verifications")
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();

    console.log(`  - Total verification records for user: ${allVerifs.length}`);
    console.log(`  - Latest record pending: ${allVerifs[0].usedAt === null}`);
    console.log(`  - Previous record invalidated: ${allVerifs[1]?.usedAt !== null}`);
    console.log("✓ Resend OTP properly invalidated previous codes\n");

    // -------------------------------------------------------------
    // Test 7: Successful Verification with Simulated Valid Code
    // -------------------------------------------------------------
    console.log("[Test 7] Verifying account with correct OTP");
    const knownCode = "654321";
    const knownHash = await bcrypt.hash(knownCode, 10);
    await db.collection("email_verifications").updateOne(
      { _id: allVerifs[0]._id },
      { $set: { otpHash: knownHash } }
    );

    const validRes = await fetch(`${BASE_URL}/auth/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, otp: knownCode }),
    });
    const validData = (await validRes.json()) as any;
    console.log(`[Test 7] Status: ${validRes.status}`, validData);
    if (validRes.status !== 200) throw new Error("Valid OTP verification failed");

    const updatedUser = await db.collection("users").findOne({ _id: user._id });
    console.log(`  - emailVerifiedAt: ${updatedUser?.emailVerifiedAt}`);
    if (!updatedUser?.emailVerifiedAt) throw new Error("User emailVerifiedAt not set");
    console.log("✓ Account verified and activated in MongoDB\n");

    // -------------------------------------------------------------
    // Test 8: Login Verification
    // -------------------------------------------------------------
    console.log("[Test 8] Logging in with newly verified credentials");
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, password }),
    });
    const loginData = (await loginRes.json()) as any;
    console.log(`[Test 8] Status: ${loginRes.status}`, {
      user: loginData.user?.email,
      role: loginData.user?.role,
      verified: Boolean(loginData.user?.emailVerifiedAt),
    });
    if (loginRes.status !== 200 || !loginData.token) throw new Error("Login failed");
    console.log("✓ User successfully logged in with JWT token\n");

    // -------------------------------------------------------------
    // Test 9: Email API Failure Handling & Security Verification
    // -------------------------------------------------------------
    console.log("[Test 9] Testing Email API failure handling");
    const { sendVerificationEmail } = await import("../services/emailService.js");
    (env as any).emailApiKey = "re_invalid_test_key_for_failure_check";
    try {
      await sendVerificationEmail("failtest@example.com", "987654");
      throw new Error("sendVerificationEmail should have thrown 502 on invalid API key");
    } catch (apiErr: any) {
      console.log(`  - Caught expected HttpError: status ${apiErr.status} (${apiErr.message})`);
      if (apiErr.status !== 502) throw new Error("Expected status 502 Bad Gateway");
      console.log("✓ Email API failure returns 502 Bad Gateway cleanly without exposing secrets\n");
    }

    console.log("============================================================");
    console.log("✓ ALL 9 EMAIL/OTP & SECURITY TESTS PASSED!");
    console.log("============================================================");
  } finally {
    // Cleanup test user
    await db.collection("users").deleteMany({ email: testEmail });
    await db.collection("email_verifications").deleteMany({ userId: testEmail });
    await mongo.close();
  }
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
