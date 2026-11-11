# Ecommerce module

The public route is `/shop` (`src/pages/shop.js`). All shop components, catalog data and scoped styles live here. Shop artwork lives in `public/images/ecommerce/`.

`ShopHome.jsx` renders the storefront, search, category selection, filters, image category tiles, a continuous product grid, grid/list views, wishlist and a right-side drawer for product details and the cart. `components/ShopIcon.jsx` provides the shop's SVG icons. `data/catalog.mjs` holds the sample products and catalog filtering functions.

This is a frontend demo. Wishlist and cart quantities are saved under `epic-shop-demo` in browser local storage. No purchases, payment processing, order tracking backend or ecommerce API calls are implemented. Connect a product API and checkout service when those contracts are available.

Run `node --test tests/ecommerceCatalog.test.mjs` for catalog behavior checks and `npm.cmd run build` for a production build on Windows.

Artwork generation prompts are recorded in `public/images/ecommerce/image-prompts.md`.


Shop Management lives at `/dashboard/shop`. It shares the admin shell styling but has a distinct shop sidebar with Dashboard, Categories, Products and Orders. The bottom action returns to `/superadmin/dashboard`. Only ADMIN and SUPER_ADMIN sessions can access shop routes. The previous partner route redirects to this admin route.

Category management uses `/add-category` and `/categories`. `management/categories/EcommerceCategoryForm.jsx` creates categories, `EcommerceCategoryList.jsx` paginates them, and `EcommerceCategoryDetails.jsx` loads a selected category in a dialog. `src/util/ecommerceCategories.mjs` uses the shared authenticated client against `/admin/ecommerce/categories` and sends exactly `name`, `description` and numeric `sortOrder` on create. Category totals on the shop overview come from this endpoint. Product and order panels remain sample previews.

The API response formats are not yet live-verified. Local verification uses `postman/simulations/ecommerce-categories.sim.yaml`; assumptions and evidence are in the adjacent context file. Run `tests/ecommerceCategories.test.mjs` with `ECOMMERCE_CATEGORIES_SIMULATION_URL` set to the simulation's `/categories-api/api/v1` base URL, plus `tests/ecommerceCategories.ui.test.cjs` for compiled rendering and access checks.

Subcategories are managed under the same Categories sidebar group at `/add-subcategory` and `/subcategories`. The form builds SELECT and BOOLEAN specification templates and sends only the supplied POST schema to `/admin/ecommerce/subcategories`. The list defaults to all categories and sends `categoryId` only when a parent is selected. Category options load every page of the category API. The subcategory table searches and paginates the loaded result set locally because backend search/pagination parameters were not supplied. Its specification fields expand in each row. Category-table search applies to the current page.

Run category and subcategory HTTP tests serially against the same local simulation: `node --test --test-concurrency=1 tests/ecommerceCategories.test.mjs tests/ecommerceSubcategories.test.mjs tests/ecommerceCategories.ui.test.cjs`, with `ECOMMERCE_CATEGORIES_SIMULATION_URL` set as described above.

The shop overview lives at `/dashboard/shop`. Shop sidebar pages use root-level URLs: `/add-category`, `/categories`, `/add-subcategory`, `/subcategories`, `/products` and `/orders`. Previous nested `/dashboard/shop/*` and `/superadmin/shop-*` URLs redirect to their matching canonical pages. All these routes require an admin session. The shared shop table header places the title on its own row and search/filter controls in the following row.
