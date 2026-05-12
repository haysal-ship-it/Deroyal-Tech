# Firebase Security Specification

## Data Invariants
- Users can only read and write their own profile in `/users/{userId}`.
- Only admins can write to `/settings/branding`.
- Anyone (even unauthenticated for login screen?) can read `/settings/branding`.
- Emails in `/users` must be valid.
- App name and image URLs must be strings with size limits.

## The Dirty Dozen Payloads (to be blocked)
1. **Identity Spoofing**: User A trying to update User B's profile.
2. **Privilege Escalation**: Sales user trying to set their role to 'admin'.
3. **Global Config Hijack**: Sales user trying to update `/settings/branding`.
4. **Invalid Type Injection**: Sending an object where a string is expected for `sidebarName`.
5. **Massive Payload**: Sending a 1MB string for `sidebarName`.
6. **Shadow Fields**: Adding a `isVerified: true` field to a user profile if not in schema.
7. **Malformed ID**: Accessing `/users/!!invalid!!`.
8. **Owner Mutation**: User A trying to change the `email` of their own profile to another user's email (if we enforce email uniqueness, though rules don't easily do uniqueness checks without a dedicated collection, but we can prevent mutation of some fields).
9. **Unauthenticated Write**: Someone who is not logged in trying to write to `/test/connection`.
10. **Admin Claim Spoof**: Trying to write as admin without being in the admins collection (if using an admins collection).
11. **Terminal State Break**: If we had statuses, trying to move from 'completed' to 'open'.
12. **PII Leak**: Non-admin user trying to list all users and their emails.

## Test Runner (Conceptual)
`firestore.rules.test.ts` will verify these are blocked.
