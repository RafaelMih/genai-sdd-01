# Feature Spec: User Signup

Version: 1.0.0
Status: Draft

## Objective

Allow a new user to create an account using name, email, and password.

## Scope

- Signup page
- Form validation
- Firebase Auth user creation
- Firestore user document creation
- Redirect after success
- Friendly error handling

## Out of scope

- Google sign-in
- Password reset
- MFA
- Email verification

## User flow

1. User opens /signup
2. User fills name, email, password, confirm password
3. System validates fields
4. System creates Firebase Auth user
5. System creates Firestore user document
6. On success, redirect to /dashboard
7. On failure, show error message

---

## Validation contract

- Email regex:
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/

- Password:
  min length = 6

- Name:
  min length = 2
  max length = 100

---

## Error messages contract

| Firebase error code         | Message                              |
| --------------------------- | ------------------------------------ |
| auth/email-already-in-use   | Este e-mail já está em uso.          |
| auth/network-request-failed | Erro de conexão. Tente novamente.    |
| auth/too-many-requests      | Muitas tentativas. Tente mais tarde. |
| auth/operation-not-allowed  | Operação não permitida.              |
| default                     | Erro ao criar conta.                 |

---

## Redirect contract

| Trigger        | From    | To         | Type    | Back behavior |
| -------------- | ------- | ---------- | ------- | ------------- |
| success signup | /signup | /dashboard | replace | cannot return |

---

## Auth state contract

| State         | Behavior               |
| ------------- | ---------------------- |
| undefined     | show loading           |
| null          | allow access           |
| authenticated | redirect to /dashboard |

---

## UI state contract

| State      | Button label     | Disabled |
| ---------- | ---------------- | -------- |
| default    | Criar conta      | false    |
| submitting | Criando conta... | true     |
| error      | Criar conta      | false    |
| success    | Criar conta      | true     |

---

## Firestore write contract

Collection: users  
Document ID: user.uid

Fields:

```ts
{
  uid: string;
  displayName: string;
  email: string;
  provider: "password";
  createdAt: serverTimestamp();
  updatedAt: serverTimestamp();
}
```
