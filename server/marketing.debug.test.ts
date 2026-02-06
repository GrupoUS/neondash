import { describe, expect, it } from "vitest";

describe("Marketing area regressions", () => {
  it("zapi router should expose campaign procedures", async () => {
    const { zapiRouter } = await import("./zapiRouter");

    expect(zapiRouter._def.procedures).toHaveProperty("createCampaign");
    expect(zapiRouter._def.procedures).toHaveProperty("sendCampaign");
    expect(zapiRouter._def.procedures).toHaveProperty("listCampaigns");
    expect(zapiRouter._def.procedures).toHaveProperty("getCampaignStats");
  });

  it("instagram router publishPost should be available as mutation", async () => {
    const { instagramRouter } = await import("./instagramRouter");

    expect(instagramRouter._def.procedures).toHaveProperty("publishPost");
    const publishProcedure = instagramRouter._def.procedures.publishPost;
    expect(publishProcedure._def.type).toBe("mutation");
  });

  it("marketing router should keep campaign/post procedures available", async () => {
    const { marketingRouter } = await import("./marketingRouter");

    expect(marketingRouter._def.procedures).toHaveProperty("createCampaign");
    expect(marketingRouter._def.procedures).toHaveProperty("createPost");
    expect(marketingRouter._def.procedures).toHaveProperty("updatePost");
    expect(marketingRouter._def.procedures).toHaveProperty("generateCaption");
    expect(marketingRouter._def.procedures).toHaveProperty("generateImage");
  });
});
