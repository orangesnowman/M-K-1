# Security Specification: custom_thumbnails Collection

This document defines the security specification, data invariants, hostile validation payloads, and test profiles for the `custom_thumbnails` collection.

## 1. Data Invariants
- **ID Integrity**: The document ID must strictly match the `clientId` field.
- **Path Isolation**: Document IDs must be alphanumeric strings (`isValidId`).
- **Completeness**: All 5 required keys (`clientId`, `image`, `posX`, `posY`, `updatedAt`) must be supplied on document creation. No shadow fields are allowed.
- **Payload Boundaries**: The `image` base64 string must not exceed 15MB to prevent denial-of-wallet payload attacks.
- **Coordinate Boundaries**: `posX` and `posY` coordinates must reside within the percentage-based physical space of `[0, 100]`.

## 2. The "Dirty Dozen" Hostile Payloads
The following payloads represent hostile attempts to bypass schema, validation, or size limits:

### Payload 1: ID Mismatch Attack
An attempt to create a document with an ID different from the internal `clientId` field.
```json
{
  "clientId": "malicious_client",
  "image": "data:image/jpeg;base64,abc...",
  "posX": 50,
  "posY": 50,
  "updatedAt": "2026-07-15T17:00:00Z"
}
```

### Payload 2: Ghost Field Injection (Shadow Field)
An attempt to inject an unauthorized administrative field (`isAdmin`).
```json
{
  "clientId": "mandk",
  "image": "data:image/jpeg;base64,abc...",
  "posX": 50,
  "posY": 50,
  "updatedAt": "2026-07-15T17:00:00Z",
  "isAdmin": true
}
```

### Payload 3: Incomplete Creation (Missing posX)
Attempting to create a record without coordinate fields.
```json
{
  "clientId": "mandk",
  "image": "data:image/jpeg;base64,abc...",
  "posY": 50,
  "updatedAt": "2026-07-15T17:00:00Z"
}
```

### Payload 4: Invalid ID Characters (Poisoning Attack)
Attempting to write with an invalid clientId containing path injection characters.
```json
{
  "clientId": "../poison_directory/mandk",
  "image": "data:image/jpeg;base64,abc...",
  "posX": 50,
  "posY": 50,
  "updatedAt": "2026-07-15T17:00:00Z"
}
```

### Payload 5: Out of Bounds Coordinate (posX > 100)
```json
{
  "clientId": "mandk",
  "image": "data:image/jpeg;base64,abc...",
  "posX": 105,
  "posY": 50,
  "updatedAt": "2026-07-15T17:00:00Z"
}
```

### Payload 6: Negative Coordinate (posY < 0)
```json
{
  "clientId": "mandk",
  "image": "data:image/jpeg;base64,abc...",
  "posX": 50,
  "posY": -10,
  "updatedAt": "2026-07-15T17:00:00Z"
}
```

### Payload 7: Oversized Image Base64 String (> 15MB)
An attempt to exhaust Firestore storage via large string payloads.

### Payload 8: Coordinate Type Mismatch (String instead of Float/Int)
```json
{
  "clientId": "mandk",
  "image": "data:image/jpeg;base64,abc...",
  "posX": "50",
  "posY": 50,
  "updatedAt": "2026-07-15T17:00:00Z"
}
```

### Payload 9: Empty Image Field
```json
{
  "clientId": "mandk",
  "image": "",
  "posX": 50,
  "posY": 50,
  "updatedAt": "2026-07-15T17:00:00Z"
}
```

### Payload 10: Missing Image Field
```json
{
  "clientId": "mandk",
  "posX": 50,
  "posY": 50,
  "updatedAt": "2026-07-15T17:00:00Z"
}
```

### Payload 11: Non-string updatedAt Field
```json
{
  "clientId": "mandk",
  "image": "data:image/jpeg;base64,abc...",
  "posX": 50,
  "posY": 50,
  "updatedAt": 1234567890
}
```

### Payload 12: Missing clientId Field entirely
```json
{
  "image": "data:image/jpeg;base64,abc...",
  "posX": 50,
  "posY": 50,
  "updatedAt": "2026-07-15T17:00:00Z"
}
```

## 3. Test Runner
Below is a conceptual Jest / Firebase Emulator test script validating permissions blockages:

```typescript
import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc } from 'firebase/firestore';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'gen-lang-client-0369165455',
  });
});

test('should reject Dirty Dozen payloads', async () => {
  const context = testEnv.unauthenticatedContext();
  const db = context.firestore();
  
  // Test Payload 2 (Ghost Field Injection)
  const docRef = doc(db, 'custom_thumbnails/mandk');
  await expect(setDoc(docRef, {
    clientId: 'mandk',
    image: 'data:image/jpeg;base64,abc',
    posX: 50,
    posY: 50,
    updatedAt: '2026-07-15T17:00:00Z',
    isAdmin: true
  })).rejects.toThrow();
});
```
