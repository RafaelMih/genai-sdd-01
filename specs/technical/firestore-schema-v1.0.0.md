# Firestore Schema

Version: 1.0.0
Status: Approved

## Collections

### users/{uid}

- displayName: string
- email: string
- provider: "password" | "google"
- createdAt: timestamp
- updatedAt: timestamp
- phone: string (optional)
