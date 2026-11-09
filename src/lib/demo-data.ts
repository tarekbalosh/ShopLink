/**
 * DEMO CONTENT — shown only when Supabase is not configured.
 * These products, prices and images are fictional examples so the storefront
 * can be previewed before connecting a real database. They are clearly
 * labelled as demo content in the UI.
 */
import type { Catalog, Category, Product, ShopSettings } from "./types";

const demoSettings: ShopSettings = {
  id: "00000000-0000-4000-8000-000000000001",
  shopName: "Harmoni Bakery (Demo)",
  description:
    "Fresh bread, cakes and pastries baked every morning. Browse the menu, add items to your cart and send your order to us on WhatsApp.",
  logoUrl: null,
  whatsappNumber: null,
  currencyCode: "MYR",
  accentColor: "#c2410c",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const cat = (n: number, name: string, slug: string): Category => ({
  id: `00000000-0000-4000-8000-0000000001${String(n).padStart(2, "0")}`,
  name,
  slug,
  sortOrder: n,
});

const demoCategories: Category[] = [
  cat(1, "Breads", "breads"),
  cat(2, "Pastries", "pastries"),
  cat(3, "Cakes", "cakes"),
  cat(4, "Drinks", "drinks"),
];

const [breads, pastries, cakes, drinks] = demoCategories;

const prod = (
  n: number,
  categoryId: string,
  name: string,
  description: string,
  priceCents: number,
  image: string,
  isAvailable = true,
): Product => ({
  id: `00000000-0000-4000-8000-0000000002${String(n).padStart(2, "0")}`,
  categoryId,
  name,
  description,
  priceCents,
  imageUrl: `/demo/${image}`,
  isAvailable,
  sortOrder: n,
});

const demoProducts: Product[] = [
  prod(1, breads.id, "Country Sourdough Loaf", "Naturally leavened, 24-hour fermented loaf with a crisp crust and open crumb. Approx. 800 g.", 1800, "sourdough-loaf.jpg"),
  prod(2, pastries.id, "Butter Croissant (2 pcs)", "Laminated with pure butter for flaky layers. Best enjoyed warm.", 1100, "butter-croissant.jpg"),
  prod(3, cakes.id, "Chocolate Ganache Cake", "Three layers of moist chocolate sponge with dark chocolate ganache. 6-inch, serves 8.", 8500, "chocolate-cake.jpg"),
  prod(4, pastries.id, "Glazed Cinnamon Roll", "Soft brioche dough swirled with cinnamon sugar and finished with vanilla glaze.", 750, "cinnamon-roll.jpg"),
  prod(5, cakes.id, "Pandan Chiffon Cake", "Light, fluffy chiffon made with fresh pandan juice and coconut milk. 8-inch.", 4200, "pandan-chiffon.jpg"),
  prod(6, breads.id, "Classic Baguette (2 pcs)", "Traditional French baguettes with a thin, crackling crust.", 1200, "baguette.jpg"),
  prod(7, drinks.id, "Iced Latte", "Double-shot espresso with fresh milk over ice. 16 oz.", 1250, "iced-latte.svg"),
  prod(8, pastries.id, "Fresh Fruit Tart", "Buttery tart shell filled with vanilla custard and topped with seasonal fruit.", 1350, "fruit-tart.svg", false),
];

export const demoCatalog: Catalog = {
  settings: demoSettings,
  categories: demoCategories,
  products: demoProducts,
  source: "demo",
};

