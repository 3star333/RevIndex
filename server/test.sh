#!/usr/bin/env bash
# ─────────────────────────────────────────────
#  RevIndex — Backend Test Script (Phase 3)
#  Run: bash test.sh   (server must be running)
# ─────────────────────────────────────────────

BASE="http://localhost:5000"

pass() { echo "  ✅  $1"; }
fail() { echo "  ❌  $1"; }
header() { echo; echo "━━━ $1 ━━━"; }

# ── Health Check ──────────────────────────────
header "HEALTH CHECK"
RES=$(curl -s "$BASE/")
echo "$RES" | python3 -m json.tool
echo "$RES" | grep -q "RevIndex" && pass "Server is up" || fail "Server not responding"

# ── Vehicles ──────────────────────────────────
header "POST /vehicles  (valid)"
RES=$(curl -s -X POST "$BASE/vehicles" \
  -H "Content-Type: application/json" \
  -d '{"make":"Toyota","model":"Camry","year":2020,"nickname":"Daily Driver"}')
echo "$RES" | python3 -m json.tool
echo "$RES" | grep -q '"id"' && pass "Vehicle created" || fail "Vehicle creation failed"

header "POST /vehicles  (second vehicle — no nickname)"
RES=$(curl -s -X POST "$BASE/vehicles" \
  -H "Content-Type: application/json" \
  -d '{"make":"Honda","model":"Accord","year":2018}')
echo "$RES" | python3 -m json.tool
echo "$RES" | grep -q '"id"' && pass "Vehicle created without nickname" || fail "Failed"

header "POST /vehicles  (missing required fields → 400)"
RES=$(curl -s -X POST "$BASE/vehicles" \
  -H "Content-Type: application/json" \
  -d '{"make":"Ford"}')
echo "$RES" | python3 -m json.tool
echo "$RES" | grep -q '"error"' && pass "Validation error returned correctly" || fail "Expected 400 error"

header "GET /vehicles"
RES=$(curl -s "$BASE/vehicles")
echo "$RES" | python3 -m json.tool
echo "$RES" | grep -q '"make"' && pass "Vehicles listed" || fail "No vehicles returned"

# ── Logs ──────────────────────────────────────
header "POST /logs  (valid)"
RES=$(curl -s -X POST "$BASE/logs" \
  -H "Content-Type: application/json" \
  -d '{"vehicle_id":1,"type":"Oil Change","cost":49.99,"mileage":35000,"notes":"Synthetic 5W-30","date":"2026-03-24"}')
echo "$RES" | python3 -m json.tool
echo "$RES" | grep -q '"id"' && pass "Log created" || fail "Log creation failed"

header "POST /logs  (second log — no notes)"
RES=$(curl -s -X POST "$BASE/logs" \
  -H "Content-Type: application/json" \
  -d '{"vehicle_id":1,"type":"Tire Rotation","cost":25.00,"mileage":37000,"date":"2026-03-10"}')
echo "$RES" | python3 -m json.tool
echo "$RES" | grep -q '"id"' && pass "Log created without notes" || fail "Failed"

header "POST /logs  (missing fields → 400)"
RES=$(curl -s -X POST "$BASE/logs" \
  -H "Content-Type: application/json" \
  -d '{"vehicle_id":1,"type":"Brake Check"}')
echo "$RES" | python3 -m json.tool
echo "$RES" | grep -q '"error"' && pass "Validation error returned correctly" || fail "Expected 400"

header "GET /vehicles/1/logs"
RES=$(curl -s "$BASE/vehicles/1/logs")
echo "$RES" | python3 -m json.tool
echo "$RES" | grep -q '"type"' && pass "Logs returned for vehicle 1" || fail "No logs returned"

header "GET /vehicles/999/logs  (non-existent vehicle → empty array)"
RES=$(curl -s "$BASE/vehicles/999/logs")
echo "$RES" | python3 -m json.tool
echo "$RES" | grep -q '\[\]' && pass "Empty array for unknown vehicle" || fail "Unexpected response"

# ── Listings ──────────────────────────────────
header "POST /listings  (valid)"
RES=$(curl -s -X POST "$BASE/listings" \
  -H "Content-Type: application/json" \
  -d '{"make":"Honda","model":"Civic","year":2019,"price":18500,"mileage":42000}')
echo "$RES" | python3 -m json.tool
echo "$RES" | grep -q '"id"' && pass "Listing created" || fail "Listing creation failed"

header "POST /listings  (second listing)"
RES=$(curl -s -X POST "$BASE/listings" \
  -H "Content-Type: application/json" \
  -d '{"make":"Ford","model":"Fusion","year":2017,"price":12000,"mileage":78000}')
echo "$RES" | python3 -m json.tool
echo "$RES" | grep -q '"id"' && pass "Second listing created" || fail "Failed"

header "POST /listings  (missing fields → 400)"
RES=$(curl -s -X POST "$BASE/listings" \
  -H "Content-Type: application/json" \
  -d '{"make":"BMW","model":"X5"}')
echo "$RES" | python3 -m json.tool
echo "$RES" | grep -q '"error"' && pass "Validation error returned correctly" || fail "Expected 400"

header "GET /listings"
RES=$(curl -s "$BASE/listings")
echo "$RES" | python3 -m json.tool
echo "$RES" | grep -q '"price"' && pass "Listings returned" || fail "No listings returned"

echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  All tests complete."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
