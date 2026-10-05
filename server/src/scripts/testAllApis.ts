import { prisma } from "../config/prisma.js";
import { signToken } from "../middleware/auth.js";
import { getPropertiesCollection } from "../config/mongo.js";

const BASE_URL = process.env.API_URL || "http://localhost:4000";

interface TestResult {
  module: string;
  method: string;
  endpoint: string;
  role: string;
  expectedStatus: number | number[];
  actualStatus: number;
  pass: boolean;
  notes: string;
}

const results: TestResult[] = [];

async function req(
  method: string,
  path: string,
  options: {
    token?: string;
    body?: any;
    headers?: Record<string, string>;
  } = {}
) {
  const url = `${BASE_URL}${path}`;
  const headers: Record<string, string> = {
    ...options.headers,
  };
  if (options.token) {
    headers["Authorization"] = `Bearer ${options.token}`;
  }
  let body: any = undefined;
  if (options.body) {
    if (!headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }
    body = JSON.stringify(options.body);
  }

  const res = await fetch(url, {
    method,
    headers,
    body,
  });

  let data: any = null;
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  } else {
    data = await res.text();
  }

  return { status: res.status, data };
}

function record(
  module: string,
  method: string,
  endpoint: string,
  role: string,
  expectedStatus: number | number[],
  actualStatus: number,
  notes: string = ""
) {
  const isExpected = Array.isArray(expectedStatus)
    ? expectedStatus.includes(actualStatus)
    : actualStatus === expectedStatus;

  results.push({
    module,
    method,
    endpoint,
    role,
    expectedStatus,
    actualStatus,
    pass: isExpected,
    notes,
  });

  const mark = isExpected ? "✅ PASS" : "❌ FAIL";
  console.log(
    `[${mark}] ${module.padEnd(12)} ${method.padEnd(6)} ${endpoint.padEnd(42)} (${role}) -> Got ${actualStatus}, Expected ${expectedStatus} ${notes ? `(${notes})` : ""}`
  );
}

async function run() {
  console.log("=== STARTING FULL API TEST SUITE ===");

  // 1. Setup Auth tokens
  const superadminUser = await prisma.user.findFirst({
    where: { role: "SUPERADMIN" },
  });
  if (!superadminUser) throw new Error("No superadmin user found in database");

  const approvedProfile = await prisma.sellerProfile.findFirst({
    where: { status: "APPROVED", isDisabled: false },
  });
  if (!approvedProfile) throw new Error("No approved seller profile found in database");

  const sellerUser = await prisma.user.findUnique({
    where: { id: approvedProfile.userId },
  });
  if (!sellerUser) throw new Error("No seller user found for approved seller profile");

  const customerUser = await prisma.user.findFirst({
    where: { role: "CUSTOMER", isDisabled: false },
  });
  if (!customerUser) throw new Error("No customer user found in database");

  const superadminToken = signToken({
    id: superadminUser.id,
    email: superadminUser.email,
    role: "SUPERADMIN",
    name: superadminUser.name,
  });

  const sellerToken = signToken({
    id: sellerUser.id,
    email: sellerUser.email,
    role: "SELLER",
    name: sellerUser.name,
  });

  const customerToken = signToken({
    id: customerUser.id,
    email: customerUser.email,
    role: "CUSTOMER",
    name: customerUser.name,
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 1. HEALTH MODULE
  // ──────────────────────────────────────────────────────────────────────────
  {
    const res = await req("GET", "/api/health");
    record("Health", "GET", "/api/health", "Public", 200, res.status, res.data?.app || "");
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 2. AUTH MODULE
  // ──────────────────────────────────────────────────────────────────────────
  {
    // Unauthenticated /me -> 401
    const resUnauth = await req("GET", "/api/auth/me");
    record("Auth", "GET", "/api/auth/me (no token)", "Guest", 401, resUnauth.status);

    // Authenticated /me as Customer
    const resCustMe = await req("GET", "/api/auth/me", { token: customerToken });
    record("Auth", "GET", "/api/auth/me", "Customer", 200, resCustMe.status, resCustMe.data?.email);

    // Authenticated /me as Seller
    const resSellMe = await req("GET", "/api/auth/me", { token: sellerToken });
    record("Auth", "GET", "/api/auth/me", "Seller", 200, resSellMe.status, resSellMe.data?.email);

    // Authenticated /me as Superadmin
    const resAdminMe = await req("GET", "/api/auth/me", { token: superadminToken });
    record("Auth", "GET", "/api/auth/me", "Superadmin", 200, resAdminMe.status, resAdminMe.data?.email);

    // Profile update
    const resUpdateProfile = await req("PATCH", "/api/auth/profile", {
      token: customerToken,
      body: { phone: "+91 9999888800" },
    });
    record("Auth", "PATCH", "/api/auth/profile", "Customer", 200, resUpdateProfile.status);

    // Profile update alias /api/auth/me
    const resUpdateMe = await req("PATCH", "/api/auth/me", {
      token: customerToken,
      body: { phone: "+91 9999888801" },
    });
    record("Auth", "PATCH", "/api/auth/me", "Customer", 200, resUpdateMe.status);

    // Register a new customer
    const testRegEmail = `test_api_${Date.now()}@pinkcitytest.com`;
    const resReg = await req("POST", "/api/auth/register", {
      body: {
        name: "API Test User",
        email: testRegEmail,
        password: "TestPassword123!",
        role: "CUSTOMER",
      },
    });
    record("Auth", "POST", "/api/auth/register", "Public", 201, resReg.status, `Created ${testRegEmail}`);

    // Login with the new customer
    const resLogin = await req("POST", "/api/auth/login", {
      body: {
        email: testRegEmail,
        password: "TestPassword123!",
      },
    });
    record("Auth", "POST", "/api/auth/login", "Public", 200, resLogin.status);

    // Resend OTP on already-verified user -> returns 400 (expected)
    const resResendVerified = await req("POST", "/api/auth/resend-otp", {
      body: { email: testRegEmail },
    });
    record("Auth", "POST", "/api/auth/resend-otp (verified user)", "Public", 400, resResendVerified.status, "Already verified");

    // Make user unverified to test OTP flow
    const regUser = await prisma.user.findUnique({ where: { email: testRegEmail } });
    if (regUser) {
      await prisma.user.update({
        where: { id: regUser.id },
        data: { emailVerifiedAt: null },
      });

      // Clear any recent verification records to bypass 60s cooldown
      await prisma.emailVerification.deleteMany({ where: { userId: regUser.id } });

      // Now resend-otp should succeed
      const resResendSuccess = await req("POST", "/api/auth/resend-otp", {
        body: { email: testRegEmail },
      });
      record("Auth", "POST", "/api/auth/resend-otp (unverified user)", "Public", 200, resResendSuccess.status, "Code sent");

      // Verify OTP with wrong code -> 400
      const resBadOtp = await req("POST", "/api/auth/verify", {
        body: { email: testRegEmail, code: "000000" },
      });
      record("Auth", "POST", "/api/auth/verify (invalid code)", "Public", 400, resBadOtp.status);

      // Clean up test user
      await prisma.emailVerification.deleteMany({ where: { userId: regUser.id } }).catch(() => {});
      await prisma.user.delete({ where: { id: regUser.id } }).catch(() => {});
    }

    // Logout
    const resLogout = await req("POST", "/api/auth/logout");
    record("Auth", "POST", "/api/auth/logout", "Public", 200, resLogout.status);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 3. PUBLIC PROPERTIES MODULE
  // ──────────────────────────────────────────────────────────────────────────
  let samplePropertyId = "";
  {
    // List public properties
    const resList = await req("GET", "/api/properties");
    record("Properties", "GET", "/api/properties", "Public", 200, resList.status, `count: ${resList.data?.results?.length ?? 0}`);

    if (resList.data?.results?.length > 0) {
      samplePropertyId = resList.data.results[0].id || resList.data.results[0].propertyId;
    }

    // List with filters
    const resFilter = await req("GET", "/api/properties?city=Jaipur&listingType=BUY");
    record("Properties", "GET", "/api/properties?city=Jaipur", "Public", 200, resFilter.status);

    // Search
    const resSearch = await req("GET", "/api/properties/search?query=Jaipur");
    record("Properties", "GET", "/api/properties/search?query=Jaipur", "Public", 200, resSearch.status);

    // Market insights
    const resInsights = await req("GET", "/api/properties/insights");
    record("Properties", "GET", "/api/properties/insights", "Public", 200, resInsights.status);

    // Map points
    const resMap = await req("GET", "/api/properties/map");
    record("Properties", "GET", "/api/properties/map", "Public", 200, resMap.status);

    // Single property detail
    if (samplePropertyId) {
      const resDetail = await req("GET", `/api/properties/${samplePropertyId}`);
      record("Properties", "GET", `/api/properties/:id`, "Public", 200, resDetail.status, samplePropertyId);
    }

    // Single property not found
    const resNotFound = await req("GET", "/api/properties/non_existent_prop_id_12345");
    record("Properties", "GET", "/api/properties/:invalidId", "Public", 404, resNotFound.status);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 4. SELLER PROPERTIES CRUD
  // ──────────────────────────────────────────────────────────────────────────
  let createdPropId = "";
  {
    // Seller list mine
    const resMine = await req("GET", "/api/properties/mine", { token: sellerToken });
    record("Properties", "GET", "/api/properties/mine", "Seller", 200, resMine.status);

    // Customer trying list mine -> 403
    const resCustMine = await req("GET", "/api/properties/mine", { token: customerToken });
    record("Properties", "GET", "/api/properties/mine", "Customer (RBAC)", 403, resCustMine.status);

    // Seller create property
    const resCreate = await req("POST", "/api/properties", {
      token: sellerToken,
      body: {
        title: "Test Luxury Villa for Automated API Suite",
        description: "Modern automated test villa in Jagatpura with high speed amenities.",
        propertyType: "VILLA",
        listingType: "BUY",
        bhk: 4,
        bathrooms: 4,
        price: 18500000,
        carpetArea: 3200,
        furnishing: "FULLY_FURNISHED",
        address: "77 Orchid Garden, Jagatpura",
        locality: "Jagatpura",
        city: "Jaipur",
        latitude: 26.8211,
        longitude: 75.8542,
        contactName: "Seller Contact",
        contactPhone: "9876543210",
        status: "ACTIVE",
      },
    });
    record("Properties", "POST", "/api/properties", "Seller", 201, resCreate.status);
    if (resCreate.data?.id || resCreate.data?.propertyId) {
      createdPropId = resCreate.data.id || resCreate.data.propertyId;
    }

    if (createdPropId) {
      // Seller update property
      const resUpdate = await req("PATCH", `/api/properties/${createdPropId}`, {
        token: sellerToken,
        body: { price: 18900000 },
      });
      record("Properties", "PATCH", `/api/properties/:id`, "Seller", 200, resUpdate.status);

      // Seller deactivate / status change
      const resDeactivate = await req("POST", `/api/properties/${createdPropId}/deactivate`, {
        token: sellerToken,
        body: { status: "INACTIVE" },
      });
      record("Properties", "POST", `/api/properties/:id/deactivate`, "Seller", 200, resDeactivate.status);

      // Re-activate
      const resReactivate = await req("PATCH", `/api/properties/${createdPropId}/status`, {
        token: sellerToken,
        body: { status: "ACTIVE" },
      });
      record("Properties", "PATCH", `/api/properties/:id/status`, "Seller", 200, resReactivate.status);

      // Seller attempting to mark SOLD directly -> 403 Forbidden
      const resMarkSoldSeller = await req("POST", `/api/sellers/properties/${createdPropId}/sold`, {
        token: sellerToken,
      });
      record("Sellers", "POST", `/api/sellers/properties/:id/sold`, "Seller (Forbidden)", 403, resMarkSoldSeller.status);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 5. PROJECTS MODULE
  // ──────────────────────────────────────────────────────────────────────────
  let createdProjectId = "";
  {
    // Public projects list
    const resProjects = await req("GET", "/api/projects");
    record("Projects", "GET", "/api/projects", "Public", 200, resProjects.status);

    // Seller list mine
    const resProjectsMine = await req("GET", "/api/projects/mine", { token: sellerToken });
    record("Projects", "GET", "/api/projects/mine", "Seller", 200, resProjectsMine.status);

    // Create project as seller
    const projectName = `Test Royal Project ${Date.now()}`;
    const resCreateProj = await req("POST", "/api/projects", {
      token: sellerToken,
      body: {
        name: projectName,
        developerName: "Royal Developers",
        locality: "Mansarovar",
        city: "Jaipur",
        address: "Shipra Path, Mansarovar",
        description: "Test gated township",
        totalUnits: 120,
        totalTowers: 4,
        amenities: ["Swimming Pool", "Gym", "Clubhouse"],
      },
    });
    record("Projects", "POST", "/api/projects", "Seller", 201, resCreateProj.status);
    if (resCreateProj.data?.id) {
      createdProjectId = resCreateProj.data.id;

      // Public get project detail
      const resProjDetail = await req("GET", `/api/projects/${createdProjectId}`);
      record("Projects", "GET", `/api/projects/:id`, "Public", 200, resProjDetail.status);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 6. FAVOURITES MODULE
  // ──────────────────────────────────────────────────────────────────────────
  {
    const targetPropId = createdPropId || samplePropertyId;
    if (targetPropId) {
      // Add to favourites
      const resAddFav = await req("POST", "/api/favourites", {
        token: customerToken,
        body: { propertyId: targetPropId },
      });
      record("Favourites", "POST", "/api/favourites", "Customer", 201, resAddFav.status);

      // List favourites
      const resListFav = await req("GET", "/api/favourites", {
        token: customerToken,
      });
      record("Favourites", "GET", "/api/favourites", "Customer", 200, resListFav.status, `count: ${resListFav.data?.results?.length ?? 0}`);

      // Delete from favourites
      const resDelFav = await req("DELETE", `/api/favourites/${targetPropId}`, {
        token: customerToken,
      });
      record("Favourites", "DELETE", `/api/favourites/:id`, "Customer", 200, resDelFav.status);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 7. CART & CHECKOUT MODULE
  // ──────────────────────────────────────────────────────────────────────────
  {
    const targetPropId = createdPropId || samplePropertyId;
    if (targetPropId) {
      // Get cart
      const resGetCartEmpty = await req("GET", "/api/cart", { token: customerToken });
      record("Cart", "GET", "/api/cart", "Customer", 200, resGetCartEmpty.status);

      // Add to cart
      const resAddCart = await req("POST", "/api/cart", {
        token: customerToken,
        body: { propertyId: targetPropId },
      });
      record("Cart", "POST", "/api/cart", "Customer", 201, resAddCart.status);

      // Checkout (returns 200 with orders array)
      const resCheckout = await req("POST", "/api/cart/checkout", {
        token: customerToken,
      });
      record("Cart", "POST", "/api/cart/checkout", "Customer", 200, resCheckout.status);

      // Remove from cart
      const resRemoveCart = await req("DELETE", `/api/cart/${targetPropId}`, {
        token: customerToken,
      });
      record("Cart", "DELETE", `/api/cart/:propertyId`, "Customer", 200, resRemoveCart.status);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 8. ORDERS MODULE
  // ──────────────────────────────────────────────────────────────────────────
  {
    // Customer orders mine
    const resOrdersMine = await req("GET", "/api/orders/mine", { token: customerToken });
    record("Orders", "GET", "/api/orders/mine", "Customer", 200, resOrdersMine.status, `orders: ${resOrdersMine.data?.orders?.length ?? 0}`);

    // Superadmin all orders
    const resOrdersAll = await req("GET", "/api/orders", { token: superadminToken });
    record("Orders", "GET", "/api/orders", "Superadmin", 200, resOrdersAll.status, `orders: ${resOrdersAll.data?.orders?.length ?? 0}`);

    // Customer forbidden on /api/orders -> 403
    const resCustForbidden = await req("GET", "/api/orders", { token: customerToken });
    record("Orders", "GET", "/api/orders", "Customer (RBAC)", 403, resCustForbidden.status);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 9. CLIENTS & CRM MODULE (Seller)
  // ──────────────────────────────────────────────────────────────────────────
  let createdClientId = "";
  {
    // List clients
    const resClients = await req("GET", "/api/clients", { token: sellerToken });
    record("Clients", "GET", "/api/clients", "Seller", 200, resClients.status);

    // Create client
    const resCreateClient = await req("POST", "/api/clients", {
      token: sellerToken,
      body: {
        name: "Test Client API",
        email: `crm_client_${Date.now()}@example.com`,
        phone: "+91 9123456780",
        notes: "Interested in villas in Jagatpura",
        interestLevel: "HIGH",
      },
    });
    record("Clients", "POST", "/api/clients", "Seller", 201, resCreateClient.status);
    if (resCreateClient.data?.id) {
      createdClientId = resCreateClient.data.id;

      // Get client detail
      const resGetClient = await req("GET", `/api/clients/${createdClientId}`, { token: sellerToken });
      record("Clients", "GET", `/api/clients/:id`, "Seller", 200, resGetClient.status);

      // Update client
      const resPatchClient = await req("PATCH", `/api/clients/${createdClientId}`, {
        token: sellerToken,
        body: { interestLevel: "LOW", notes: "Updated via automated test" },
      });
      record("Clients", "PATCH", `/api/clients/:id`, "Seller", 200, resPatchClient.status);

      // Add interest with interestLevel
      if (createdPropId || samplePropertyId) {
        const resInterest = await req("POST", `/api/clients/${createdClientId}/interests`, {
          token: sellerToken,
          body: { propertyId: createdPropId || samplePropertyId, interestLevel: "HIGH" },
        });
        record("Clients", "POST", `/api/clients/:id/interests`, "Seller", 201, resInterest.status);
      }
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 10. INTERACTIONS MODULE (Seller CRM)
  // ──────────────────────────────────────────────────────────────────────────
  {
    // List interactions
    const resInteractions = await req("GET", "/api/interactions", { token: sellerToken });
    record("Interactions", "GET", "/api/interactions", "Seller", 200, resInteractions.status);

    // Create interaction
    if (createdClientId) {
      const resCreateInt = await req("POST", "/api/interactions", {
        token: sellerToken,
        body: {
          clientId: createdClientId,
          type: "CALL",
          notes: "Spoke with client regarding visit schedule",
        },
      });
      record("Interactions", "POST", "/api/interactions", "Seller", 201, resCreateInt.status);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 11. VISITS MODULE
  // ──────────────────────────────────────────────────────────────────────────
  let createdVisitId = "";
  {
    const targetPropId = createdPropId || samplePropertyId;

    // Customer requests visit
    if (targetPropId) {
      const scheduledTime = new Date(Date.now() + 86400000).toISOString();
      const resReqVisit = await req("POST", "/api/visits/request", {
        token: customerToken,
        body: {
          propertyId: targetPropId,
          scheduledAt: scheduledTime,
          notes: "Would love to visit tomorrow at 2 PM",
          name: "Tour Visitor",
          phone: "+91 9887766554",
        },
      });
      record("Visits", "POST", "/api/visits/request", "Customer", 201, resReqVisit.status);
    }

    // Seller lists visits
    const resVisitsList = await req("GET", "/api/visits", { token: sellerToken });
    record("Visits", "GET", "/api/visits", "Seller", 200, resVisitsList.status, `visits: ${resVisitsList.data?.results?.length ?? 0}`);

    // Seller creates visit
    if (createdClientId && createdPropId) {
      const scheduledTime = new Date(Date.now() + 172800000).toISOString();
      const resCreateVisit = await req("POST", "/api/visits", {
        token: sellerToken,
        body: {
          clientId: createdClientId,
          propertyId: createdPropId,
          scheduledAt: scheduledTime,
          notes: "Scheduled by seller directly",
        },
      });
      record("Visits", "POST", "/api/visits", "Seller", 201, resCreateVisit.status);
      if (resCreateVisit.data?.id) {
        createdVisitId = resCreateVisit.data.id;

        // Seller update status of visit
        const resUpdateVisit = await req("PATCH", `/api/visits/${createdVisitId}`, {
          token: sellerToken,
          body: { status: "COMPLETED", notes: "Client visited and loved the villa" },
        });
        record("Visits", "PATCH", `/api/visits/:id`, "Seller", 200, resUpdateVisit.status);
      }
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 12. SELLERS MODULE
  // ──────────────────────────────────────────────────────────────────────────
  {
    // Seller dashboard
    const resSellerDash = await req("GET", "/api/sellers/dashboard", { token: sellerToken });
    record("Sellers", "GET", "/api/sellers/dashboard", "Seller", 200, resSellerDash.status);

    // Seller profile me
    const resSellerMe = await req("GET", "/api/sellers/me", { token: sellerToken });
    record("Sellers", "GET", "/api/sellers/me", "Seller", 200, resSellerMe.status);

    // Public seller profile
    const sellerProfId = sellerUser.id;
    const resPublicSeller = await req("GET", `/api/sellers/${sellerProfId}`);
    record("Sellers", "GET", `/api/sellers/:id`, "Public", 200, resPublicSeller.status);

    // Public seller profile with alias /api/seller/:id
    const resPublicSellerAlias = await req("GET", `/api/seller/${sellerProfId}`);
    record("Sellers", "GET", `/api/seller/:id`, "Public", 200, resPublicSellerAlias.status);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 13. ADMIN MODULE (Superadmin only)
  // ──────────────────────────────────────────────────────────────────────────
  {
    // Admin dashboard
    const resDash = await req("GET", "/api/admin/dashboard", { token: superadminToken });
    record("Admin", "GET", "/api/admin/dashboard", "Superadmin", 200, resDash.status);

    // Customer trying admin dashboard -> 403
    const resDashForbidden = await req("GET", "/api/admin/dashboard", { token: customerToken });
    record("Admin", "GET", "/api/admin/dashboard", "Customer (RBAC)", 403, resDashForbidden.status);

    // Admin sellers list
    const resSellers = await req("GET", "/api/admin/sellers", { token: superadminToken });
    record("Admin", "GET", "/api/admin/sellers", "Superadmin", 200, resSellers.status, `count: ${resSellers.data?.length ?? 0}`);

    // Admin seller requests
    const resSellerReqs = await req("GET", "/api/admin/sellers/requests", { token: superadminToken });
    record("Admin", "GET", "/api/admin/sellers/requests", "Superadmin", 200, resSellerReqs.status);

    // Create a temporary seller application to test review, approve, reject, deleteSeller
    const tempSellerEmail = `temp_seller_admin_${Date.now()}@example.com`;
    const tempSellerUser = await prisma.user.create({
      data: {
        email: tempSellerEmail,
        passwordHash: "$2b$12$T1kZKqUfTgGWTjVg1sxo0uiiPHYaRida1FY85aEpD22ECJIAPBgSq",
        name: "Temporary Seller Candidate",
        role: "SELLER",
        emailVerifiedAt: new Date(),
      },
    });
    const tempProfile = await prisma.sellerProfile.create({
      data: {
        userId: tempSellerUser.id,
        companyName: "Temp Realty LLC",
        status: "PENDING_APPROVAL",
        isDisabled: false,
      },
    });

    // Admin get seller details
    const resSellerDetail = await req("GET", `/api/admin/sellers/${tempProfile.id}`, { token: superadminToken });
    record("Admin", "GET", `/api/admin/sellers/:id`, "Superadmin", 200, resSellerDetail.status);

    // Review seller (action: APPROVE)
    const resReview = await req("POST", `/api/admin/sellers/${tempProfile.id}/review`, {
      token: superadminToken,
      body: { action: "APPROVE", reason: "Approved via automated API test" },
    });
    record("Admin", "POST", `/api/admin/sellers/:id/review`, "Superadmin", 200, resReview.status);

    // Disable seller
    const resDisableSeller = await req("PATCH", `/api/admin/sellers/${tempProfile.id}/disable`, { token: superadminToken });
    record("Admin", "PATCH", `/api/admin/sellers/:id/disable`, "Superadmin", 200, resDisableSeller.status);

    // Enable seller back
    const resEnableSeller = await req("PATCH", `/api/admin/sellers/${tempProfile.id}/enable`, { token: superadminToken });
    record("Admin", "PATCH", `/api/admin/sellers/:id/enable`, "Superadmin", 200, resEnableSeller.status);

    // Reject seller
    const resReject = await req("POST", `/api/admin/sellers/${tempProfile.id}/reject`, {
      token: superadminToken,
      body: { reason: "Testing rejection flow" },
    });
    record("Admin", "POST", `/api/admin/sellers/:id/reject`, "Superadmin", 200, resReject.status);

    // Approve seller again
    const resApprove = await req("POST", `/api/admin/sellers/${tempProfile.id}/approve`, {
      token: superadminToken,
    });
    record("Admin", "POST", `/api/admin/sellers/:id/approve`, "Superadmin", 200, resApprove.status);

    // Delete seller
    const resDelSeller = await req("DELETE", `/api/admin/sellers/${tempProfile.id}`, { token: superadminToken });
    record("Admin", "DELETE", `/api/admin/sellers/:id`, "Superadmin", 200, resDelSeller.status);

    // Admin users list
    const resUsers = await req("GET", "/api/admin/users", { token: superadminToken });
    record("Admin", "GET", "/api/admin/users", "Superadmin", 200, resUsers.status, `count: ${resUsers.data?.length ?? 0}`);

    // Disable and enable user
    if (customerUser) {
      const resDisableUser = await req("PATCH", `/api/admin/users/${customerUser.id}/disable`, { token: superadminToken });
      record("Admin", "PATCH", `/api/admin/users/:id/disable`, "Superadmin", 200, resDisableUser.status);

      const resEnableUser = await req("PATCH", `/api/admin/users/${customerUser.id}/enable`, { token: superadminToken });
      record("Admin", "PATCH", `/api/admin/users/:id/enable`, "Superadmin", 200, resEnableUser.status);
    }

    // Admin properties list
    const resProps = await req("GET", "/api/admin/properties", { token: superadminToken });
    record("Admin", "GET", "/api/admin/properties", "Superadmin", 200, resProps.status, `count: ${resProps.data?.length ?? 0}`);

    // Disable & enable property
    const propToToggle = createdPropId || samplePropertyId;
    if (propToToggle) {
      const resDisableProp = await req("PATCH", `/api/admin/properties/${propToToggle}/disable`, { token: superadminToken });
      record("Admin", "PATCH", `/api/admin/properties/:id/disable`, "Superadmin", 200, resDisableProp.status);

      const resEnableProp = await req("PATCH", `/api/admin/properties/${propToToggle}/enable`, { token: superadminToken });
      record("Admin", "PATCH", `/api/admin/properties/:id/enable`, "Superadmin", 200, resEnableProp.status);

      // Admin mark SOLD
      const resMarkSold = await req("POST", `/api/admin/properties/${propToToggle}/sold`, { token: superadminToken });
      record("Admin", "POST", `/api/admin/properties/:id/sold`, "Superadmin", 200, resMarkSold.status);
    }

    // Admin disabled items directory
    const resDisabled = await req("GET", "/api/admin/disabled", { token: superadminToken });
    record("Admin", "GET", "/api/admin/disabled", "Superadmin", 200, resDisabled.status);

    // Admin audit logs
    const resAudit = await req("GET", "/api/admin/audit-logs", { token: superadminToken });
    record("Admin", "GET", "/api/admin/audit-logs", "Superadmin", 200, resAudit.status);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 14. CLEANUP TEMPORARY TEST DATA
  // ──────────────────────────────────────────────────────────────────────────
  {
    if (createdPropId) {
      // Superadmin or seller delete test property
      const resDel = await req("DELETE", `/api/admin/properties/${createdPropId}`, { token: superadminToken });
      record("Admin", "DELETE", `/api/admin/properties/:id`, "Superadmin (Cleanup)", 200, resDel.status);
    }

    // Clean up created visit & client & project
    if (createdVisitId) {
      await prisma.propertyVisit.deleteMany({ where: { id: createdVisitId } }).catch(() => {});
    }
    if (createdClientId) {
      await prisma.clientPropertyInterest.deleteMany({ where: { clientId: createdClientId } }).catch(() => {});
      await prisma.client.delete({ where: { id: createdClientId } }).catch(() => {});
    }
    if (createdProjectId) {
      await prisma.project.delete({ where: { id: createdProjectId } }).catch(() => {});
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SUMMARY REPORT
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n========================================================");
  console.log("                   API TEST SUMMARY                     ");
  console.log("========================================================");
  const total = results.length;
  const passed = results.filter((r) => r.pass).length;
  const failed = total - passed;

  console.log(`Total Endpoints Tested: ${total}`);
  console.log(`Passed:                 ${passed}`);
  console.log(`Failed:                 ${failed}`);
  console.log("========================================================");

  if (failed > 0) {
    console.log("\nFAILED TESTS DETAILS:");
    results
      .filter((r) => !r.pass)
      .forEach((f) => {
        console.log(`- [${f.module}] ${f.method} ${f.endpoint} (${f.role})`);
        console.log(`  Expected: ${f.expectedStatus}, Got: ${f.actualStatus}`);
        console.log(`  Notes: ${f.notes}`);
      });
  }

  process.exit(failed === 0 ? 0 : 1);
}

run().catch((err) => {
  console.error("FATAL ERROR IN TEST SUITE:", err);
  process.exit(1);
});
