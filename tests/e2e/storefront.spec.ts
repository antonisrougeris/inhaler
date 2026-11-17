import { test, expect } from "@playwright/test";
test("Greek storefront, language switch and responsive layout", async ({
  page,
}) => {
  await page.goto("/el");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "τελετουργία",
  );
  await expect(page.locator("body")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("link", { name: "EN", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "kind of ritual",
  );
});
test("catalog and variants remain previews before launch", async ({ page }) => {
  await page.goto("/en/shop/form-01");
  await page.getByRole("button", { name: "Graphite", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Graphite", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("link", { name: "Notify me at launch" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Add to bag" })).toHaveCount(0);
});
test("kit builder preserves pack choices visually", async ({ page }) => {
  await page.goto("/en/starter-kit");
  await page.getByRole("button", { name: "4 packs" }).click();
  await expect(page.getByRole("button", { name: "4 packs" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByLabel("Pack 4", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Keep me in the loop" }),
  ).toBeVisible();
});
test("prelaunch checkout and unauthorized admin are protected", async ({
  page,
  request,
}) => {
  await page.goto("/en/checkout");
  await expect(
    page.getByText("Purchases are not available yet."),
  ).toBeVisible();
  expect((await request.get("/api/admin/orders")).status()).toBe(401);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/el\/account/);
});
test("FAQ expands without motion dependency", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/en/faq");
  const question = page.locator("summary").filter({
    hasText: "What is flavored air?",
  });
  await question.click();
  await expect(question.locator("..")).toHaveAttribute("open", "");
  await expect(
    page.getByText(
      "The concept passes air through an aroma core, without a heating mechanism.",
      { exact: false },
    ),
  ).toBeVisible();
});
