import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir:"./e2e",timeout:45_000,fullyParallel:false,workers:1,
  use:{baseURL:"http://127.0.0.1:3101",browserName:"chromium",trace:"retain-on-failure"},
  webServer:[{command:"npm run start -- --port 3101",url:"http://127.0.0.1:3101",reuseExistingServer:false,timeout:60_000,
    env:{PILOT_DEPLOYMENT:"local",PILOT_REQUIRE_INVITE:"0",PILOT_TRUST_PROXY:"0",PILOT_PUBLIC_ORIGIN:"http://127.0.0.1:3101",FEEDBACK_SECRET:"e2e-test-only-secret-not-production-123456",PILOT_TESTER_CODES:"E2E-TESTER-ONLY",PILOT_FEEDBACK_DIR:"test-results/isolated-feedback",PILOT_LEDGER_DIR:"test-results/isolated-ledger"}},
    {command:"npm run start -- --port 3102",url:"http://127.0.0.1:3102",reuseExistingServer:false,timeout:60_000,
      env:{PILOT_DEPLOYMENT:"staging",PILOT_REQUIRE_INVITE:"1",PILOT_PUBLIC_ORIGIN:"http://127.0.0.1:3102",PILOT_TRUST_PROXY:"0",FEEDBACK_SECRET:"e2e-public-pilot-only-secret-1234567890",PILOT_TESTER_CODES:Array.from({length:10},(_,i)=>`PUBLIC-TEST-CODE-${i}-1234567890`).join(","),PILOT_FEEDBACK_DIR:"test-results/public-isolated-feedback",PILOT_LEDGER_DIR:"test-results/public-isolated-ledger"}}],
  projects:[{name:"existing",testMatch:["pilot.spec.ts","design.spec.ts","consumer.spec.ts","landing.spec.ts","recovery.spec.ts","discovery.spec.ts","portfolio.spec.ts","terminal.spec.ts","aggregation.spec.ts"],use:{baseURL:"http://127.0.0.1:3101"}},
    {name:"private-pilot",testMatch:"public-pilot.spec.ts",use:{baseURL:"http://127.0.0.1:3102"}}],
  reporter:[["list"]]
});
