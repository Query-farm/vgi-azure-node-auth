import { test, expect } from "bun:test";
import { makeMsalMinter } from "../src/index.js";
import { AuthError } from "@vgi-azure/graph-core";

test("makeMsalMinter builds a TokenMinter; app-only requires a client_secret", async () => {
  const minter = makeMsalMinter();
  expect(typeof minter.mint).toBe("function");
  // No client_secret → app-only client-credentials is impossible → AuthError, before any network.
  await expect(minter.mint({ tenantId: "t", clientId: "c" }, "graph")).rejects.toBeInstanceOf(AuthError);
});
