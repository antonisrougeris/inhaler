ALTER TABLE "Inventory" ADD CONSTRAINT "inventory_nonnegative" CHECK ("onHand" >= 0 AND "reserved" >= 0 AND "sold" >= 0 AND "reserved" <= "onHand");
ALTER TABLE "Variant" ADD CONSTRAINT "variant_price_nonnegative" CHECK ("price" >= 0 AND "vatBps" >= 0 AND "packSize" > 0);
ALTER TABLE "Order" ADD CONSTRAINT "order_money_valid" CHECK ("total" >= 0 AND "subtotal" >= 0 AND "discount" >= 0 AND "shipping" >= 0 AND "tax" >= 0 AND "total" = "subtotal" - "discount" + "shipping");
ALTER TABLE "OrderItem" ADD CONSTRAINT "order_item_quantity" CHECK ("quantity" > 0 AND "unitPrice" >= 0);
ALTER TABLE "BundleComponent" ADD CONSTRAINT "bundle_quantity" CHECK ("quantity" > 0 AND "bundleId" <> "componentId");
ALTER TABLE "Review" ADD CONSTRAINT "rating_range" CHECK ("rating" BETWEEN 1 AND 5);
