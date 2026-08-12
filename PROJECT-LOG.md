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