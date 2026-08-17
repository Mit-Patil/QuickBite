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