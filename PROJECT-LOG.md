## Session 1 — 2026-08-08
**Worked on:** 
- Created project skeleton (6 service folders + root files), pushed to GitHub
- Set up Docker Compose with Postgres 16 (port 5433, container name quickbite-postgres)
- Connected pgAdmin4 to dockerized Postgres (not local Postgres install)
- Created `users` table in `quickbite_users` DB via migrations/V1__create_users_table.sql
  - UUID primary key (gen_random_uuid()), role as VARCHAR + CHECK constraint (not native ENUM)

**Decisions made:** 
- All DBs run in Docker only, never installed locally — pgAdmin/Compass are just GUI viewers connecting to containers
- UUID over auto-increment BIGINT for all primary keys — avoids ID collisions across service databases in microservices setup
- Sticking with NetBeans (not switching to IntelliJ) — already familiar from academics
- Using Hoppscotch instead of Postman for API testing

**Blockers/issues:** 
- Initial `docker pull` hit a TLS handshake timeout — resolved by retrying `docker compose up -d`

**Next session starts with:** 
- Spring Boot init for user-service (Web, JPA, Postgres Driver, Security, Validation dependencies)
- Wire up application.yml / .env for DB connection (env-variable driven, no hardcoded secrets)
- Build basic User entity + repository, confirm Spring Boot can read/write to the users table

## Session 2 — 2026-08-09
**Worked on:** 
- Generated user-service Spring Boot project via start.spring.io (Web, JPA, PostgreSQL Driver, Validation, Security)
- Opened project in NetBeans
- Set up .env (DB_URL, DB_USERNAME, DB_PASSWORD) + application.yml, using spring-dotenv to load .env into Spring's environment
- Set ddl-auto: validate (not update) — schema is managed via SQL migrations only, Hibernate just checks entity matches table
- Created User.java entity — UUID id, email/passwordHash/fullName/phone/role, Role enum (CUSTOMER/RESTAURANT_OWNER/DELIVERY_PARTNER/ADMIN) mapped with @Enumerated(STRING), @PrePersist/@PreUpdate for auto timestamps

**Decisions made:** 
- Skipping Lombok for now — writing getters/setters manually to actually understand JPA fundamentals before automating them. Will introduce Lombok in a future entity once comfortable.
- @Enumerated(EnumType.STRING) used deliberately over default ordinal storage — avoids data corruption risk if enum order changes later

**Blockers/issues:** 
- Had a typo (craetedAt → createdAt) caught and fixed before moving on

**Next session starts with:** 
- Create UserRepository interface (Spring Data JPA)
- Create a simple test REST endpoint/controller to confirm end-to-end: NetBeans app → Postgres container → users table
- Run the app, verify no errors from ddl-auto: validate (confirms entity matches table exactly)
- If time permits: insert a test user via endpoint, view it appear in pgAdmin

## Session 3 — 2026-08-10
**Worked on:** 
- Built full registration flow for user-service: UserRepository, DTOs (RegisterRequest/UserResponse), UserService, UserController, SecurityBeansConfig (BCrypt bean), SecurityConfig (public endpoints), GlobalExceptionHandler
- Fixed multiple environment bugs: .env syntax (no spaces around =), spring-dotenv incompatibility with Spring Boot 4.x (switched to native spring.config.import), Windows timezone alias bug (Asia/Calcutta → set via -Duser.timezone=Asia/Kolkata in pom.xml argLine), NetBeans Run button exec:exec issue (use mvnw spring-boot:run directly)
- Verified full flow end-to-end via curl: POST /api/users/register returns 201 with clean UserResponse (no password leaked), duplicate email returns clean 400 via GlobalExceptionHandler

**Decisions made:** 
- Removed role from RegisterRequest entirely — public signup always hardcodes CUSTOMER; other roles (restaurant owner, delivery partner) will get separate endpoints later, never client-selectable — avoids privilege escalation vulnerability
- Centralized error handling via @RestControllerAdvice instead of per-method try/catch — keeps controllers clean, reusable pattern for future services

**Blockers/issues:** 
- PowerShell's Invoke-WebRequest hides response body on non-2xx status — use curl.exe or try/catch pattern to see actual error JSON

**Next session starts with:** 
- Build login endpoint: verify password via passwordEncoder.matches(), generate and return JWT on success
- Add JWT secret to .env, create JwtUtil/JwtService for token generation + validation
- Update SecurityConfig to permit /api/users/login publicly (already pre-listed)

## Session 4 — 2026-08-11
**Worked on:** 
- Built login flow: LoginRequest/LoginResponse DTOs, JwtService (token generation/validation via JJWT), login() in UserService (password verification via passwordEncoder.matches(), generic error message to prevent user enumeration), login endpoint in UserController
- Verified full flow: correct credentials return signed JWT, wrong credentials return clean 400 with generic error

**Decisions made:** 
- JWT secret must be 32+ chars (256-bit minimum) — JJWT enforces this strictly, unlike some looser libraries used in past projects
- Login and registration deliberately kept as separate, isolated code paths — good debugging lesson: when only one endpoint fails, suspect endpoint-specific logic first, not shared infra

**Blockers/issues:** 
- Spent significant time chasing a false lead (403 errors from PowerShell/curl quoting issues masking the real bug) before finding the actual WeakKeyException root cause — real lesson: verbose/raw error output matters, don't trust surface-level status codes alone
- PowerShell's Invoke-RestMethod and curl.exe both hide response bodies on non-2xx errors — use try/catch + StreamReader pattern to see actual server error messages

**Next session starts with:** 
- Build JWT authentication filter (OncePerRequestFilter) — validates Authorization header on protected routes, sets authenticated user context before requests reach controllers
- Wire filter into SecurityConfig, test with a simple protected endpoint (e.g., GET /api/users/me)

## Session 5 — 2026-08-12
**Worked on:** 
- Built JwtAuthFilter (OncePerRequestFilter) — extracts Bearer token from Authorization header, validates via JwtService, attaches authenticated identity (userId + role) to SecurityContextHolder
- Wired filter into SecurityConfig via addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
- Added protected test endpoint GET /api/users/me to verify full auth chain
- Verified all three scenarios: no token → 403, valid token → 200 with correct identity, invalid/fake token → 403

**Decisions made:** 
- Filter design: missing/invalid token doesn't immediately reject — it lets the request continue unauthenticated, and Spring Security's authorizeHttpRequests rules (anyRequest().authenticated()) handle the actual rejection. Keeps filter's responsibility narrow (attach identity if valid) vs authorization decision (separate concern)

**Blockers/issues:** 
- Daily recurring issue: Postgres Docker container not running after reboot — always run `docker compose up -d` before starting work

**Next session starts with:** 
- User Service core auth is now feature-complete (register, login, JWT issuance, JWT validation on protected routes)
- Next: decide between (a) adding role-based authorization (e.g. @PreAuthorize / hasRole checks for future restaurant-owner/delivery-partner endpoints) to round out User Service, or (b) moving on to restaurant-order-service and starting Saga/Kafka work

## Session 6 — 2026-08-13
**Worked on:** 
- Designed and locked final schema for role-specific profile tables: customer_profile (gender, DOB, profile pic), addresses (one-to-many, label/landmark/coordinates/is_default), delivery_partner_profile (vehicle info, verification_status, availability, live location), restaurant_owner_profile (business name, logo, verification_status)
- Ran V2 migration, created all 4 tables in pgAdmin
- Built JPA entities: CustomerProfile, Address, DeliveryPartnerProfile, RestaurantOwnerProfile (introduced @OneToOne + @MapsId pattern for 1:1 profile tables, @ManyToOne for one-to-many addresses)
- Built repositories for all 4 entities
- Built RegisterRestaurantOwnerRequest / RegisterDeliveryPartnerRequest DTOs
- Extended UserService: register() now also creates CustomerProfile row; added registerRestaurantOwner() and registerDeliveryPartner(), all wrapped in @Transactional for atomic multi-table writes
- Added /register/restaurant-owner and /register/delivery-partner endpoints, updated SecurityConfig to permit them publicly
- Verified restaurant-owner registration end-to-end: 201 response, correct role, profile row created atomically

**Decisions made:** 
- Restaurant/delivery partner accounts get verification_status (PENDING/APPROVED/REJECTED) — matches real-world onboarding (Swiggy/Zomato don't auto-activate these roles), admin approval flow deferred to later
- profile_pic_url / logo_url deliberately excluded from registration DTOs — file uploads belong in a separate "update profile" flow, not signup
- Kept registration DTOs separate per role (not one shared DTO) — validation differs meaningfully per role or would require dropping @NotBlank annotations; some field duplication accepted as reasonable tradeoff for clarity
- @Transactional added to all multi-table register methods — ensures User + Profile insert together or not at all, preventing orphaned user rows

**Blockers/issues:** 
- None significant today — smooth session once schema was properly planned upfront (worth the extra discussion time before writing SQL)

**Next session starts with:** 
- Test delivery-partner registration endpoint (same pattern, not yet verified)
- Build GET /api/users/me (proper version — replace today's test stub) returning full profile data joined with role-specific profile
- Build PUT /api/users/me for profile updates (including profilePicUrl/logoUrl, address management)
- Add role-based authorization (@PreAuthorize) once role-specific endpoints exist (e.g. only DELIVERY_PARTNER can toggle their own availability)

## Session 7 — 2026-08-14
**Worked on:** 
- Verified delivery-partner registration end-to-end (201, correct role, profile row created)
- Built proper GET /api/users/me — replaces earlier test stub, now fetches role-specific profile table (CustomerProfile/DeliveryPartnerProfile/RestaurantOwnerProfile) based on user's role using a switch expression, combines with base user data
- Built three role-specific response DTOs (CustomerProfileResponse, DeliveryPartnerProfileResponse, RestaurantOwnerProfileResponse)
- Verified /me correctly returns full profile for users registered after the @Transactional fix, and correctly throws clean "Profile not found" error for older users registered before profile-row creation existed (expected legacy data gap, not a bug)

**Decisions made:** 
- Conversation getting very long (multiple sessions in one chat) — decided to continue in this same chat rather than split, to preserve flow across the 4-service project; will rely on PROJECT-LOG.md + context doc if a fresh chat becomes necessary later

**Blockers/issues:** 
- Old test users (test2@example.com etc.) lack profile rows since they predate today's @Transactional register() change — not a bug, just stale test data from earlier sessions

**Next session starts with:** 
- Build PUT /api/users/me for profile updates (role-specific: gender/DOB/profilePicUrl for customer, vehicle info for delivery partner, business info for restaurant owner)
- Build address management endpoints (POST/GET/PUT/DELETE for addresses table)
- Add role-based authorization (@PreAuthorize) — e.g. restrict certain future endpoints to specific roles

## Session 8 — 2026-08-15
**Worked on:** 
- Built role-specific profile update endpoints (PUT /me/customer, /me/delivery-partner, /me/restaurant-owner) — partial updates, only non-null fields applied
- Added @PreAuthorize role checks on top of existing service-layer role checks (defense in depth — rejects unauthorized role access before reaching controller/DB)
- Built full address CRUD: POST/GET/PUT/DELETE /me/addresses, with ownership verification (users can only modify their own addresses) and single-default-address enforcement via clearExistingDefault()
- Verified full test matrix: partial updates preserve untouched fields, role mismatches correctly rejected at both @PreAuthorize and service layer, cross-user address modification blocked

**Decisions made:** 
- User Service declared feature-complete for now: registration (3 roles), login, JWT auth + validation filter, role-based authorization, full profile CRUD, full address CRUD
- Deferred: admin verification-approval endpoints, logout/token-blocklist — both depend on needs from other services not yet built, revisit when actually needed rather than building speculatively
- Confirmed sequencing: finish restaurant-order-service (Saga/Kafka) before starting frontend, so UI work isn't done against a single-service backend

**Blockers/issues:** 
- None — clean session, no debugging detours

**Next session starts with:** 
- Start restaurant-order-service: new Spring Boot project, own Postgres database (DB-per-service), initial schema (restaurants, menu_items, orders, order_items)
- This is a new, larger service — expect multiple sessions covering Saga orchestration pattern and eventual Kafka integration

## Session 9 — 2026-08-16
**Worked on:** 
- Locked full restaurant-order-service schema: expanded from initial 4 tables to 10 — added cart layer (carts, cart_items, cart_item_addons) and GST/stock tracking after identifying real gaps (multi-restaurant cart confusion, no inventory field, no tax field)
- Wrote V1 (restaurants, menu_items, item_variants, item_addons), V2 (orders, order_items, order_item_addons), V3 (carts, cart_items, cart_item_addons) migrations, ran all against quickbite_orders — clean
- Built all 10 JPA entities with Lombok (@Data, @Builder, @NoArgsConstructor, @AllArgsConstructor) — first real use of Lombok in the project
- Introduced and correctly implemented: @ManyToOne + FetchType.LAZY for cross-table refs within same DB, BigDecimal for all money fields (never double/float), @PrePersist/@PreUpdate for timestamp automation, @Embeddable + @EmbeddedId + @MapsId for CartItemAddon's composite primary key (cart_item_id + addon_id, no standalone id column)
- Verified BUILD SUCCESS on full project compile

**Decisions made:** 
- Cart is single-restaurant per active cart (UNIQUE constraint on customer_id) — enforces "no multi-restaurant order" rule at the DB level, matches real Swiggy/Zomato UX, resolves multi-restaurant-order question cleanly
- Cart data is live/mutable (references menu_items/item_variants/item_addons directly, no snapshotting); Order data is frozen/snapshotted (item_name, variant_name, unit_price, addon_name, addon_price all copied at order-placement time) — core principle: past receipts must never change even if menu prices change later
- stock_quantity on menu_items is nullable (NULL = untracked/unlimited); auto-decrements on order placement, ties directly into future Saga reserve/compensate step
- tax_amount added to orders (GST), snapshotted like everything else; actual rate kept in application.yml config, not DB
- Per-day operating hours (Mon–Sun schedule) considered and deliberately deferred — read overhead not worth it given other priority work (Saga/Kafka); simple is_24_7 + single opening/closing time used instead
- restaurant_type (RESTAURANT vs CLOUD_KITCHEN) added to distinguish home/cloud kitchens from physical dine-in locations

**Blockers/issues:** 
- Two real entity bugs caught and fixed during hand-writing: GenerationType.IDENTITY used incorrectly on a UUID @Id (would have broken inserts — corrected to GenerationType.UUID), and a plain UUID restaurantId field written instead of a proper @ManyToOne relationship (would have required manual joins everywhere — corrected to @ManyToOne + @JoinColumn)
- CartItemAddon's composite key was the one genuinely new JPA pattern this session — required @Embeddable/@EmbeddedId, distinct from the @OneToOne + @MapsId pattern already known from CustomerProfile

**Next session starts with:** 
- Build repositories for all 10 entities (should move fast — Spring Data JPA interfaces are largely one-liners once entities are correct)
- Then DTOs + service layer for: restaurant CRUD, menu management, cart operations (add/remove item, clear on restaurant switch), order placement (this is where Saga orchestration begins)


## Session 10 — 2026-08-17
**Worked on:** 
- Fixed a real repository bug from Session 9's build: typo in MenuItemRepository derived-query method (findByRestaurantIdAndIsAvaiableTrue → IsAvailableTrue) — caught via app startup failure, not a compile error, confirmed BUILD SUCCESS after fix
- Built all 16 DTOs across restaurant, menu (+ variants/addons), cart, and order — request/response split for each
- Locked Lombok convention for DTOs specifically: request DTOs get @Data only (Jackson deserializes these, needs implicit no-arg constructor); response DTOs get @Data + @Builder (constructed manually in service code, never deserialized)
- Introduced nested DTO composition (List<OtherDTO> fields) for one-to-many response shapes (MenuItemResponse holding variants/addons, OrderResponse holding order items)

**Decisions made:** 
- is_active deliberately excluded from all owner-facing restaurant DTOs (create and update) — admin-only field, owner must never be able to reactivate their own deactivated restaurant; will get a separate admin DTO/endpoint later
- is_open included on UpdateRestaurantRequest but not CreateRestaurantRequest — schema default (true) handles initial state, owner only needs to toggle it after the restaurant already exists
- PlaceOrderRequest kept intentionally minimal (just deliveryAddressId) — order contents/prices are always derived server-side from the cart + live menu data at checkout time, never trusted from the client, consistent with the role-stripping pattern from user-service
- CartItemResponse uses flat List<String> for addon names (display-only, no price breakdown needed); OrderItemResponse uses full List<OrderItemAddonResponse> DTOs (permanent receipt needs per-addon pricing) — DTO shape follows what each specific screen needs, not a 1:1 mirror of the schema

**Blockers/issues:** 
- One real typo bug in MenuItemRepository (isAvaiable vs isAvailable) — invisible to compiler, only surfaced at Spring Boot startup when the derived query gets parsed; good reminder that `mvn compile` alone doesn't validate repository method names, need a full app boot/`mvn clean install`

**Next session starts with:** 
- Build the service layer: RestaurantService, MenuItemService (+ variant/addon management), CartService (live price computation on every fetch), OrderService (checkout flow — cart → order snapshot, this is where Saga orchestration begins: reserve stock → trigger payment → confirm order, with compensation on failure)
- This is the biggest jump in complexity so far — first real business logic tying entities + repositories + DTOs together


## Session 11 — 2026-08-18
**Worked on:** 
- Built RestaurantService: createRestaurant, getMyRestaurants, getById, updateRestaurant, plus private toResponse() mapper method
- Reviewed and confirmed: toResponse() pattern exists for reuse across multiple methods + separation of business logic from DTO conversion; builder field order is irrelevant (named calls, not positional); ownerId cannot be fetched cross-DB (no REFERENCES to users table) — will be extracted from validated JWT at the controller layer once security is wired in, passed to service as a plain parameter
- Confirmed each microservice needs its own GlobalExceptionHandler — no cross-service class sharing possible (separate JVM/Spring context/classpath per service), not duplication, correct microservices design
- Identified a likely compile blocker: is24x7 field name has 'is' followed by a digit, not uppercase letter, so Lombok's boolean-getter special case may not trigger, causing a getter name mismatch (isIs24x7() vs expected is24x7())

**Decisions made:** 
- Renaming is24x7 → twentyFourSeven (or similar) across Restaurant entity, CreateRestaurantRequest, UpdateRestaurantRequest, RestaurantResponse to avoid Lombok's digit-after-is ambiguity entirely, rather than relying on IDE-suggested naming
- Confirmed ownerId extraction belongs in the controller layer (post-JWT-validation), not the service layer — keeps service methods agnostic to how identity was obtained

**Blockers/issues:** 
- JWT validation not yet wired into restaurant-order-service — open decision from Session 10, still pending: copy JwtService/JwtAuthFilter from user-service before building the controller layer

**Next session starts with:** 
- Complete is24x7 → twentyFourSeven rename across all 5 affected files, verify build success
- Decide and wire JWT validation into restaurant-order-service (copy JwtService/JwtAuthFilter pattern from user-service)
- Continue service layer: MenuItemService (+ variant/addon management), then CartService, then OrderService

## Session 12 — 2026-08-19
**Worked on:** 
- Wired JWT validation into restaurant-order-service: JwtService (validation-only, no issuance), JwtAuthFilter (OncePerRequestFilter, identical shape to user-service), SecurityConfig (stateless, /browse/** public, everything else authenticated)
- Built RestaurantController: create/getMyRestaurants/getById/update, with @PreAuthorize role checks and getCurrentUserId() helper reading UUID directly from SecurityContextHolder principal


**Decisions made:** 
- Same JWT secret shared across user-service and restaurant-order-service .env files — lets this service trust tokens without ever calling back to user-service or its database
- getById endpoint deliberately has no @PreAuthorize — public restaurant browsing needs no authentication, matches real-world menu browsing UX

**Blockers/issues:** 
- None this session — clean build, clean tests

**Next session starts with:** 
- MenuItemController + MenuItemService (+ variant/addon sub-resource endpoints) — same shape as Restaurant now that the security pattern is proven and repeatable
- Then CartService/CartController, then OrderService (Saga begins)


## Session 13 — 2026-08-19 (cont.)
**Worked on:** 
- Built MenuItemService : : createMenuItem, getMenuForRestaurant, getById, updateMenuItem,addVariant,addAddon, plus private toResponse() mapper method which also return ItemVariant, ItemAddon
- Built MenuItemController: create/getMenu/getById/update/addVariant/addAddon, with @PreAuthorize role checks and getCurrentUserId() helper reading UUID directly from SecurityContextHolder principal

**Decisions made:** 
- variant/addon sub-resource endpoints


**Next session starts with:** 
- test the MenuItemService + MenuItemController With proper endpoints

## Session 14 — 2026-08-21
**Worked on:** 
- Built MenuItemService: createMenuItem, getMenuForRestaurant, getById, updateMenuItem, addVariant, addAddon, plus a private toResponse() mapper that also fetches and nests ItemVariant/ItemAddon lists via separate repository calls
- Built MenuItemController: create/getMenu/getById/update/addVariant/addAddon, with @PreAuthorize role checks and a getCurrentUserId() helper reading UUID directly from SecurityContextHolder's principal
- Fixed spring-boot:run timezone bug (Asia/Calcutta) via System.setProperty("user.timezone", "Asia/Kolkata") in main() — more robust than the surefire-only argLine fix since it covers every launch method
- Fixed a real JWT validation bug: @Value("${jwt.secret") was missing its closing brace, silently breaking signature verification on every request
- Found and fixed a Jackson/Lombok interaction bug: primitive boolean fields named isXxx (isVeg, isDefault) silently failed to deserialize from JSON, since Lombok strips the "is" prefix from primitive boolean getters/setters, causing Jackson to derive the wrong JSON property name — fixed via @JsonProperty, then cleaned up resulting duplicate JSON keys via @JsonIgnoreProperties
- Full curl/Invoke-RestMethod regression pass across Restaurant + MenuItem endpoints: create, get-by-id (public), my-restaurants, update, nested variant/addon serialization, and negative auth tests (no token, wrong role) — all passing

**Decisions made:** 
- Menu item ownership check walks the restaurant relationship (menuItem.getRestaurant().getOwnerId()), since MenuItem has no ownerId of its own — same pattern will apply to variants/addons
- Route design: create/get-menu nested under /api/restaurants/{restaurantId}/menu-items (created in context of a restaurant); get-by-id/update/variants/addons flat under /api/menu-items/{id} (operate directly by resource ID once it exists)
- Adopted try/catch as the standard pattern for negative-auth PowerShell tests, since Invoke-RestMethod throws on non-2xx instead of returning the body directly

**Blockers/issues:** 
- Three real bugs found and fixed this session (timezone, JWT secret typo, Jackson boolean naming) — all silent failures with no startup error, reinforcing that clean compile/build doesn't guarantee correct runtime behavior

**Next session starts with:** 
- CartService + CartController — live price computation logic (cart items reference menu live, never snapshotted)

## Session 15 — 2026-08-22
**Worked on:** 
- Built CartService: addToCart (auto-creates cart on first item, enforces single-restaurant-per-cart via IllegalArgumentException), getCart (live price computation: unitPrice from variant or base price, addonsTotal summed from cart_item_addons, lineTotal computed fresh every call), removeCartItem (ownership check), clearCart
- Built CartController with class-level @PreAuthorize("hasRole('CUSTOMER')")
- Found and fixed a significant, previously-undetected security gap: @EnableMethodSecurity was never added to SecurityConfig, meaning @PreAuthorize annotations across the ENTIRE service (Restaurant, MenuItem, and now Cart controllers) were silently non-functional since they were first written -- only anyRequest().authenticated() (valid-token check) was actually enforced, not role checks
- Verified fix via direct positive test: CUSTOMER token correctly rejected with 403 on a CUSTOMER-only-blocked... [RESTAURANT_OWNER]-only cart endpoint, confirming @PreAuthorize now actually fires

**Decisions made:** 
- Kept IllegalArgumentException (400) rather than IllegalStateException (409) for the cross-restaurant-cart conflict case -- functionally fine, GlobalExceptionHandler already covers it, just less precise HTTP semantics than ideal
- Test scripts now explicitly verify prerequisite state (e.g. menu item count) before proceeding, and auto-create missing prerequisites, rather than assuming stale session variables are valid -- PowerShell variables don't persist across terminal sessions, root-caused several earlier false failures

**Blockers/issues:** 
- The @EnableMethodSecurity gap likely means any authenticated user (regardless of role) could have created/updated restaurants and menu items in every session since RestaurantController was built -- retroactively fixed now, but worth remembering as a class of bug: annotations that require separate explicit enabling can silently no-op with no startup error

**Next session starts with:** 
- Re-verify @PreAuthorize enforcement specifically on RestaurantController and MenuItemController (wrong-role tests), not just Cart
- OrderService -- checkout flow, cart-to-order snapshot, Saga orchestration begins

## Session 16 — 2026-08-23
**Worked on:** 
- Refactored item_addons from menu-item-scoped to restaurant-scoped, added menu_item_addons join table for true addon reuse across items (V4 migration, dropped+recreated affected tables since only test data existed)
- Added special_instructions free-text field to cart_items and order_items, separate from structured addons
- Updated entities (ItemAddon, new MenuItemAddonId/MenuItemAddon composite-key pair), repositories, DTOs, and all three services (MenuItemService split addAddon into createAddon + attachAddon; CartService and OrderService pass specialInstructions through)
- Found and fixed a real Hibernate bug in OrderService.placeOrder(): TransientPropertyValueException caused by querying CartItemAddon mid-loop, interleaved with unrelated writes (menu_items stock updates) within the same @Transactional block -- fixed by pre-fetching all cart item addon links into a Map before any writes begin
- Full end-to-end verification: registration -> login -> restaurant -> restaurant-level addons -> menu items -> addon attachment (confirmed same addon ID reused across two different menu items) -> variant -> cart with special instructions -> order placement -> stock decrement -> cart clear -> order history/get-by-id
- Verified out-of-stock rejection correctly returns 409 via the validation-first design

**Decisions made:** 
- Addon design settled on restaurant-level pool + explicit per-item attachment (not "suggested vs full list" two-tier system) -- owner attaches whichever addons apply per item, matches real Swiggy/Zomato behavior without extra complexity
- No stock/quantity tracking added to addons or variants, consistent with the is_available-over-numeric-counting philosophy already applied to menu items

**Blockers/issues:** 
- Unresolved: DELETE /api/cart (clearCart) returns 403 Forbidden with a token that successfully authenticates GET /api/cart moments later, under the same class-level @PreAuthorize. Real inconsistency, not yet root-caused -- worth checking for a routing ambiguity between the two @DeleteMapping methods in CartController (clearCart vs removeItem) first thing next session. Workaround used this session: direct SQL DELETE in pgAdmin to clear test cart state.
- Missing businessName field caused a silent registration failure earlier in the session -- reinforced the value of surfacing real error bodies (GetResponseStream/StreamReader pattern) instead of letting try/catch swallow details

**Next session starts with:** 
- Root-cause and fix the DELETE /api/cart 403 issue
- Once resolved, re-verify full cart-clear flow
- Begin payment-service (Node.js + MongoDB) -- first non-Java, non-Postgres service in the project

## Session 17 — 2026-08-24
**Worked on:** 
- Root-caused the DELETE /api/cart 403 mystery from Session 16 using Spring Security debug logging (logging.level.org.springframework.security: DEBUG)
- Actual cause: NOT an authorization bug. CartService.clearCart() was missing @Transactional, and its derived-delete-query call (cartItemRepository.deleteByCartId) requires an explicit transaction, unlike simple save()/deleteById() which Spring Data wraps automatically. This threw a TransactionRequiredException (a real 500-class error)
- The misleading 403 was a side-effect: after the uncaught exception, Spring internally redirects to GET /error to render the error response; since /error isn't in permitAll() and has no authenticated context for that internal redirect, Security correctly (but confusingly) rejected THAT request with 403 -- completely masking the real underlying exception from the client
- Fixed by adding @Transactional to clearCart()
- Verified fix with a definitive test: added a real item (confirmed via non-zero subtotal), cleared with no exception thrown, confirmed cart genuinely empty afterward via a clean 400 "Cart is empty" from getCart()

**Decisions made:** 
- Noted for future cleanup (not urgent): SecurityConfig's permitAll() patterns for /api/restaurants/* and /api/menu-items/* apply to all HTTP methods, not just GET as originally intended -- currently harmless since @PreAuthorize enforces the real restriction at the method level, but should eventually be scoped with HttpMethod.GET for clarity

**Blockers/issues:** 
- None remaining -- this session's investigation is fully closed
- Key lesson: an HTTP status code alone (403) can be actively misleading when it results from an internal error-handling redirect rather than the original request's real failure. Security debug logging was the only way to see the true sequence of events. Also reinforced: PowerShell variables from a prior terminal session are gone in a fresh window -- always verify a variable actually holds a real value (not blank) before trusting a test result built on it, since an empty ID silently produces a "correct-looking" 400 that proves nothing

**Next session starts with:** 
- Full regression pass across all four controllers (Restaurant, MenuItem, Cart, Order) now that Session 16-17's addon refactor and bug fixes are stable
- Begin payment-service (Node.js + MongoDB) -- first non-Java, non-Postgres service in the project


## Session 18 — 2026-08-24 (cont.)
**Worked on:** 
- Added MongoDB (mongo:7) to docker-compose.yml, separate container from Postgres, per DB-per-service and polyglot persistence design from the original architecture doc
- Fixed Windows PowerShell execution policy blocking npm (Set-ExecutionPolicy RemoteSigned, CurrentUser scope)
- Scaffolded payment-service: npm init, installed express/mongoose/dotenv/jsonwebtoken/cors, dev dependency nodemon
- Built folder structure (models/routes/controllers/middleware/config), centralized config (config/env.js) and centralized error-handling middleware (middleware/errorHandler.js) -- deliberately mirroring the "one place for config, one place for errors" pattern already established in restaurant-order-service's application.yml + GlobalExceptionHandler
- Verified MongoDB connection via terminal (docker exec + mongosh) and via app health check endpoint
- Designed and built the Payment Mongoose model: orderId/customerId/restaurantId as plain strings (no native UUID type in MongoDB, same cross-service reasoning as Postgres FK-less owner_id), method enum (CARD/UPI/COD/WALLET), status enum (PENDING/SUCCESS/FAILED/REFUNDED), timestamps: true replacing manual @PrePersist/@PreUpdate equivalent
- Began payment controller logic: simulateCharge() function -- COD always succeeds instantly, other methods simulate ~90% success rate with a generated transactionRef, designed so a real Razorpay integration can later replace just this one function without touching schema, Saga logic, or frontend contract

**Decisions made:** 
- MongoDB stays local via Docker for now, not Atlas -- consistent with Postgres also being local, and matches the project's staged infra path (Docker Compose -> K8s -> cloud) from the original architecture doc; swapping to Atlas later is a one-line MONGO_URI change given config is centralized
- Payment-service scoped to customer-pays-for-order only, NOT delivery-partner payouts -- different transaction type/timing/trigger, deferred until delivery-matching-service exists and its actual payout needs are known
- Dropped a currency field from the Payment schema -- project is single-currency (INR) scoped throughout, unnecessary complexity
- Customer selects payment method at checkout (real choice, not fixed); actual charge is simulated, not a real Razorpay SDK integration, until a frontend exists to redirect through a real checkout flow

**Blockers/issues:** 
- None

**Next session starts with:** 
- Wire paymentController into an actual Express route (routes/paymentRoutes.js), add JWT validation middleware (Node equivalent of JwtAuthFilter)
- Test payment creation end-to-end via curl/Invoke-RestMethod against the running payment-service


## Session 19 — 2026-08-25
**Worked on:** 
- Built JWT middleware (middleware/auth.js) for payment-service -- Node equivalent of JwtAuthFilter, verifies token signature via shared secret, attaches userId/userRole to req object (Express's equivalent of SecurityContextHolder)
- Built paymentRoutes.js wiring authenticate middleware + createPayment controller, mounted at /api/payments
- Fixed createPayment to pull customerId from the validated JWT (req.userId), not trust it from the request body -- same security principle as role being stripped from RegisterRequest in user-service
- Debugged and fixed a real runtime bug: "Payment is not defined" -- missing require('../models/Payment') import in paymentController.js, a Node-specific failure mode since missing imports aren't caught at compile time (no compilation step), only surface when that code path actually executes
- Full verification: successful UPI payment (customerId correctly sourced from JWT not client), COD instant-success with distinct reference prefix, no-token request correctly rejected 403, simulated ~10% UPI failure rate observed in a small sample run

**Decisions made:** 
- No role-middleware system built for payment-service yet, given only one role (CUSTOMER) needs access right now -- an inline check would suffice if/when a second role needs different payment-service access, rather than building Spring-style declarative role annotations in Express prematurely

**Blockers/issues:** 
- None -- clean session, one bug found and fixed quickly

**Next session starts with:** 
- Wire payment-service into restaurant-order-service's checkout flow -- this is where real Saga orchestration begins: OrderService calls payment-service after cart validation, handles SUCCESS (confirm order) vs FAILED (compensate: release any reserved stock, mark order PAYMENT_FAILED) as two separate database transactions coordinated by application logic, not one shared DB transaction

## Session 20 — 2026-08-26
**Worked on:** 
- Built RestClientConfig for connecting 2 diffrent service PaymentService and OrderService Together and created PaymentRequest and PaymentResponse Dto and added Payment Method field in PlaceOrderRequest and Implemented PlaceOrder Logic for payment 


**Next session starts with:** 
- Complete the Payment and orderservice logic that will work together and testing all possible testcases 


## Session 20 — 2026-08-27
**Worked on:** 
- Wired the order-to-payment Saga call in OrderService.placeOrder(): PaymentRequest/PaymentResponse DTOs, RestClient bean (payment-service base URL, connect/read timeouts), try/catch around the cross-service call with compensateFailedPayment() restoring decremented stock on failure
- Threaded the customer's JWT from OrderController through to the payment-service call via @RequestHeader
- Fixed RestClientConfig compile errors by switching to JdkClientHttpRequestFactory wrapping java.net.http.HttpClient -- more version-stable than Spring Boot's shifting internal class names
- Diagnosed and fixed a double "Bearer" prefix bug: OrderService's payment call was doing "Bearer " + authToken, but authToken (from @RequestHeader) already contained the full "Bearer ..." string, producing "Bearer Bearer eyJ..." and failing JWT verification on every attempt. Root-caused via systematic diagnostic logging added across all three services (payment-service request logger, auth.js token/secret preview) that isolated the exact malformed header value
- Verified full end-to-end Saga flow: cart -> order validation -> snapshot -> stock decrement -> payment-service call -> CONFIRMED status -> correct subtotal/tax/total calculation
- Confirmed compensation logic (stock restoration on payment failure) works correctly, verified independently before the header bug was found

**Decisions made:** 
- None new this session -- primarily debugging and verification of previously-designed Saga logic

**Blockers/issues:** 
- None remaining -- full order-to-payment flow confirmed working
- Noted for next session (cosmetic, not urgent): taxAmount/totalAmount display with 4 decimal places (e.g. 25.0000) due to BigDecimal.multiply() combining decimal scales rather than rounding -- values are correct, just need .setScale(2, RoundingMode.HALF_UP) before saving for clean display

**Next session starts with:** 
- Apply .setScale(2, RoundingMode.HALF_UP) to taxAmount/totalAmount calculation in OrderService
- Remove/quiet verbose debug logging added this session (JWT secret/token previews, request loggers) now that the bug is fixed -- useful for diagnosis, too noisy for normal operation
- Run a full regression pass across Restaurant/MenuItem/Cart/Order/Payment together, including a genuine simulated-failure case now that success is confirmed
- Then: frontend planning, per the earlier agreed sequencing (finish backend core + Saga first, frontend next, especially given the exam-timing plan)


## Session 21 — 2026-08-29
**Worked on:** 
- Closed the two identified backend gaps for restaurant owner order management: getRestaurantOrders (moved to RestaurantController, correcting a route-nesting bug where it was originally double-prefixed under OrderController's /api/orders mapping) and updateOrderStatus with a full state-machine validation (validateStatusTransition map) preventing illegal status jumps
- Fixed BigDecimal display formatting: taxAmount/totalAmount now use .setScale(2, RoundingMode.HALF_UP), fixing the 4-decimal-place display bug from Session 20
- Removed verbose JWT secret/token preview debug logging from payment-service's auth.js (added during the Bearer-bug investigation), kept the basic error message log
- Added order cancellation: V5 migration (cancellation_reason column), CancelOrderRequest DTO, OrderService.cancelOrder() reusing validateStatusTransition, new PATCH /api/orders/{id}/cancel endpoint (restaurant-owner only)
- Full regression test: status progression (CONFIRMED -> PREPARING -> READY_FOR_PICKUP -> OUT_FOR_DELIVERY -> DELIVERED), invalid transition rejection (409), terminal-state guard, owner-only access control, cancellation with reason visible to both owner and customer, re-cancellation blocked

**Decisions made:** 
- Cancellation reason is free-text, stored on the order -- kept deliberately separate from menu_items.is_available; a cancellation does NOT automatically toggle item availability, since cancellation reasons don't always relate to item stock (wrong address, customer changed mind, etc.) -- matches the existing manual-toggle-over-automatic-inference philosophy from the addon/stock design sessions
- Deferred: refund handling (payment-service REFUNDED status + reversal call) and double-submission/idempotency guard -- both scoped as next session's focus, deliberately not rushed at the end of this session
- Deferred: full idempotency-key infrastructure remains out of scope pre-exams given its open-ended debugging risk (similar in kind to the multi-session Bearer-prefix bug); a narrower double-submission guard (processing flag on Cart) was scoped as a cheaper, bounded alternative for next session instead

**Blockers/issues:** 
- None this session

**Next session starts with:** 
- Double-submission guard: add a processing flag/status check on Cart, set at the start of placeOrder() inside the transaction, to prevent a second rapid order submission from double-processing the same cart during the narrow race window before cart deletion
- Refund handling: payment-service REFUNDED status transition + reversal endpoint, called from OrderService.cancelOrder() when cancelling an order that was successfully paid
- After both: move to frontend, per the earlier agreed sequencing

## Session 22 — 2026-08-30
**Worked on:** 
- Added double-submission guard: processing boolean flag on Cart entity (V6 migration), set true at the start of OrderService.placeOrder() before any validation/writes, checked first and rejected with 409 if already true, reset to false on any failure path that doesn't delete the cart. Verified via genuine concurrent requests (PowerShell background jobs) -- one succeeded, one correctly rejected with "already being processed"
- Added refund handling: payment-service gets a new POST /api/payments/:orderId/refund endpoint (finds the SUCCESS payment for that order, transitions it to REFUNDED), protected by a new internal-service-to-service auth mechanism (X-Internal-Key header + shared secret comparison, deliberately separate and simpler than customer JWT auth since the trust model differs -- trusted peer service vs. external user)
- Wired OrderService.cancelOrder() to call the refund endpoint when cancelling a paid order (CONFIRMED/PREPARING/READY_FOR_PICKUP), with refund failure logged but not blocking cancellation itself
- Debugged and fixed the refund call failing with "Invalid internal service key" / undefined received key -- root cause was the header name itself: the original placeholder code sent .header("Authorization", "system") and only the header VALUE was updated to the real secret during the internal-auth implementation, never the header NAME (should have been "X-Internal-Key", matching what internalAuth.js middleware actually reads)
- Full end-to-end verification: place order -> cancel -> refund processed and logged in payment-service, confirmed via matching debug logs on both sides

**Decisions made:** 
- Internal service auth uses a static shared secret checked via plain string comparison (X-Internal-Key header), not JWT verification -- appropriate for trusted service-to-service calls within owned infrastructure, distinct from customer-facing auth which needs real identity/role verification

**Blockers/issues:** 
- None remaining -- this closes out all three backend gaps identified two sessions ago (double-submission guard, cancellation, refund)

**Next session starts with:** 
- All planned backend work for restaurant-order-service, payment-service is complete for the scoped feature set (idempotency-key infrastructure remains explicitly deferred, documented as future work)
- Move to frontend, per the long-agreed sequencing -- restaurant-order-service and payment-service are now stable enough to build a UI against

## Session 23 — 2026-08-31
**Worked on:** 
- Implemented full idempotency handling for the order-to-payment Saga call: idempotencyKey field on Payment schema (unique index), createPayment checks for existing key before charging and returns the original result on replay (200, not 201), new GET /api/payments/status/:idempotencyKey endpoint (internal-auth protected) for reconciliation queries
- Reworked OrderService's payment-call catch block: instead of assuming failure on any timeout/exception, it now queries payment-service for the real outcome of that specific attempt via the idempotency key, and only compensates/fails the order if the real status is confirmed FAILED or genuinely unreachable -- if reconciliation finds SUCCESS, the order is confirmed instead of incorrectly compensated
- Used order.getId() itself as the idempotency key (already stable and unique per attempt, no separate key-generation needed)
- Extensive, deliberate testing using a temporary artificial delay in payment-service to force real RestClient timeouts (not just simulated ones) -- proved three distinct scenarios with direct log evidence: (1) idempotent replay preventing a double charge when the underlying HTTP client auto-retried, (2) reconciliation correctly compensating when the real status was FAILED, (3) reconciliation correctly confirming the order when the real status was SUCCESS despite the client-side timeout
- Removed temporary test-only code (artificial response delay, forced-success override) after successful verification

**Decisions made:** 
- None new this session -- pure implementation and rigorous verification of the design from Session 22

**Blockers/issues:** 
- None remaining. This closes the idempotency gap that was the last explicitly deferred backend item since Session 17/22 discussions -- all identified Saga/payment edge cases (double-submission, cancellation, refund, idempotent replay, lost-response reconciliation) are now implemented and verified with real evidence, not just assumed

**Next session starts with:** 
- Backend scope for restaurant-order-service and payment-service is now considered complete for the project's current phase
- Move to frontend, per the long-agreed sequencing -- this was the last blocker

## Session 24 — 2026-09-02
**Worked on:**
- Scaffolded quickbite-frontend with Vite (React template), installed axios and react-router-dom, chose ESLint over Oxlint for linting
- Built src/api/axiosClient.js — factory function creating configured axios instances per service (userClient, orderClient, paymentClient), with a request interceptor attaching JWT from localStorage and a response interceptor normalizing three inconsistent backend error shapes (string body from IllegalStateException, { error: "..." } from IllegalArgumentException, dynamic field:message pairs from validation errors) into one consistent { message, status, raw } object, plus centralized console logging per failed request
- Built src/api/userService.js — thin per-endpoint wrapper functions around userClient (register/login/getMe), returning promises un-awaited so error/loading handling stays in components
- Built src/auth/AuthContext.jsx (login/logout, user state backed by localStorage) and src/auth/ProtectedRoute.jsx (role-gated route guard using useAuth + Navigate)
- Wired src/main.jsx (BrowserRouter > AuthProvider > App) and src/App.jsx (routes for /login, /customer/*, /restaurant/*, root redirect to /login)
- Built placeholder pages: Login.jsx (full working form wired to AuthContext.login, role-based redirect on success, loading-disabled submit button), CustomerHome.jsx, RestaurantDashboard.jsx (stubs)
- Fixed CORS: added CorsConfigurationSource bean to SecurityConfig in user-service and restaurant-order-service (allowed origin http://localhost:5173, credentials true), added cors middleware to payment-service's Express app
- Extracted reusable ErrorMessage component (src/components/ErrorMessage.jsx + .module.css) and started src/styles/tokens.css (--color-danger, --color-danger-bg) imported into global.css, replacing Login's inline error styling
- Verified end-to-end: login works fully (form -> userService -> axiosClient -> AuthContext -> localStorage -> role-based redirect), landing on Customer Home / Restaurant Dashboard correctly per role

**Decisions made:**
- Frontend built skeleton-first, unstyled, before any CSS polish — same layer-by-layer sequencing as the backend build
- Skipped decoding JWT client-side for role info — /login already returns { token, email, role } directly, so decoding would be pure duplication
- AuthContext.login() left uncaught internally (no try/catch) so the calling component owns error display, same separation-of-concerns pattern as userService.js
- ProtectedRoute explicitly treated as UX-only, not real security — actual enforcement remains server-side via @PreAuthorize
- Root path "/" currently hard-redirects to /login unconditionally (placeholder); revisit once a real "already logged in" check is worth adding
- Established tokens.css (raw design values) vs component CSS Modules (applied styling) split as the project's CSS convention going forward

**Blockers/issues:**
- CORS was not configured on any of the three backend services — frontend requests were blocked by the browser at the preflight stage; fixed today (root-cause note: response.data is undefined for CORS-blocked requests, so the axios error interceptor's generic fallback message fires instead of a real backend error — a useful signal for future CORS-vs-real-bug triage)

**Next session starts with:**
- Build Register pages (Customer, Restaurant-owner, Delivery-partner) reusing ErrorMessage + a form-input pattern
- Consider a shared Input/Button component once Register forms make the duplication concrete
- Continue expanding tokens.css as new components need shared values