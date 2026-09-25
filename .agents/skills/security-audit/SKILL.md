---
name: security-audit
description: Comprehensive security auditing and vulnerability scanning for codebases, with specialized focus on React Native, TypeScript, Expo, Node.js, and Android. Use this skill when asked to check code safety, audit security, identify vulnerabilities, verify compliance with OWASP Top 10 / Mobile Top 10, or find leaked secrets.
---

# Code Security Audit Skill

This skill guides Ziryab through conducting systematic, defensive security reviews and static application security testing (SAST / SCA).

## Audit Methodology

When conducting a security audit, follow these 5 phases:

### Phase 1: Secrets & Sensitive Data Leakage
- Scan for hardcoded credentials, API keys, database passwords, JWT secrets, and private keys.
- Check `.gitignore` to ensure `.env`, `.env.local`, keystores, and credentials are never tracked.
- Inspect git history or staged files for accidental secret commits.

### Phase 2: Dependency & Supply Chain Security (SCA)
- Check package lockfiles (`package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`).
- Run `npm audit` or analyze known vulnerable package versions.
- Verify that third-party scripts or libraries are pinned to trusted, secure versions.

### Phase 3: Mobile & Frontend Security (OWASP Mobile Top 10)
- **M1: Insecure Data Storage**:
  - Verify that sensitive data (tokens, passwords, PII) is NOT stored in plain `AsyncStorage` or unencrypted SQLite.
  - Require `expo-secure-store` or platform-native KeyStore/KeyChain for sensitive tokens.
- **M2: Insecure Communication**:
  - Ensure all API endpoints use `https://`.
  - Check for `usesCleartextTraffic="true"` in Android configurations or network security configs.
- **M3: Insecure Authentication / Authorization**:
  - Inspect token handling, refresh logic, and biometric authentication fallbacks.
- **M4: Injection & Input Validation**:
  - Review SQL queries in SQLite / database layers (ensure parameterized queries, avoid raw SQL string concatenation).
  - Check for dangerous functions (`eval`, `new Function`, `dangerouslySetInnerHTML`).
- **M5: Deep Links & Intent Security**:
  - Validate parameters received via custom URL schemes or Android App Links.
  - Review `AndroidManifest.xml` for exported components without permission gates.

### Phase 4: Backend / Cloud & Database Security
- Check database connection strings (ensure SSL/TLS is enforced, e.g., `sslmode=require`).
- Check Row Level Security (RLS) if using Supabase/PostgreSQL/Neon.
- Verify CORS and rate limiting configs if API endpoints exist.

### Phase 5: Reporting & Remediation
Generate a clear, structured audit report using this format:

```markdown
## 🛡️ Security Audit Summary
- **Overall Posture**: [Secure | Needs Attention | Critical Issues]
- **Vulnerabilities Found**: [X Critical, Y High, Z Medium, W Low]

### 🔴 Critical / High Vulnerabilities
#### 1. [Vulnerability Title]
- **Location**: `path/to/file.ts:L12-L15`
- **CWE / OWASP Category**: [e.g. CWE-312: Cleartext Storage of Sensitive Information]
- **Impact**: [Explanation of real-world risk]
- **Remediation**: [Actionable code diff or solution]

### 🟡 Medium / Low Vulnerabilities & Best Practices
...

### 🟢 Positive Security Findings
- [Things the codebase is already doing right]
```
