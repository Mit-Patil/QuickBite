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

