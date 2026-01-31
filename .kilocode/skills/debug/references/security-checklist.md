# Security Checklist (OWASP 2025)

> Quick security validation checklist based on OWASP Top 10 2025.

## Top 10 Vulnerabilities

| # | Vulnerability | Description |
|---|---------------|-------------|
| 1 | Broken Access Control | Users acting outside permissions |
| 2 | Cryptographic Failures | Sensitive data exposure |
| 3 | Injection | SQL, NoSQL, command injection |
| 4 | Insecure Design | Missing security controls |
| 5 | Security Misconfiguration | Default configs, open ports |
| 6 | Vulnerable Components | Outdated dependencies |
| 7 | Auth Failures | Weak passwords, session issues |
| 8 | Data Integrity Failures | Untrusted data accepted |
| 9 | Logging Failures | Missing audit trails |
| 10 | SSRF | Server-side request forgery |

---

## Quick Checks

### 1. Access Control
```typescript
// ✅ Always verify auth
const identity = await ctx.auth.getUserIdentity();
if (!identity) throw new Error("Unauthorized");

// ✅ Check ownership
const item = await ctx.db.get(itemId);
if (item.userId !== identity.subject) throw new Error("Forbidden");
```

### 2. Secrets
```bash
# Check for exposed secrets
grep -r "sk_live\|password\|api_key" src/
# Should return nothing

# Verify .env is gitignored
cat .gitignore | grep ".env"
```

### 3. Injection Prevention
```typescript
// ✅ Parameterized queries (Drizzle)
db.select().from(users).where(eq(users.id, userId))

// ❌ Never string concat SQL
db.execute(`SELECT * FROM users WHERE id = ${userId}`)
```

### 4. Dependencies
```bash
# Check for vulnerabilities
bun audit
npm audit
```

### 5. Headers & CORS
```typescript
// Verify security headers
app.use(helmet());

// CORS configuration
cors({
  origin: ['https://yourdomain.com'],
  credentials: true
});
```

---

## Review Checklist

### Authentication
- [ ] All routes require auth check
- [ ] Session tokens are HTTP-only cookies
- [ ] Passwords hashed (bcrypt/argon2)
- [ ] Rate limiting on login attempts

### Authorization
- [ ] Role-based access implemented
- [ ] Resource ownership verified
- [ ] Admin routes protected

### Data Protection
- [ ] Sensitive data encrypted at rest
- [ ] HTTPS enforced in production
- [ ] PII handling follows LGPD

### Input Validation
- [ ] All inputs validated with Zod
- [ ] File uploads type-checked
- [ ] Size limits enforced

### Logging
- [ ] Failed auth attempts logged
- [ ] Admin actions audited
- [ ] No sensitive data in logs

---

## Commands

```bash
# Check dependencies
bun audit

# Check for secrets
git secrets --scan

# Security headers test
curl -I https://yoursite.com | grep -E "X-|Content-Security"
```
