# Database Indexes Documentation

This document explains the database indexes defined in the Mongoose schemas for the Library Management System.

## Schema Indexes

### Author Schema (`src/schemas/author.schema.ts`)

**Current Indexes:**

```typescript
AuthorSchema.index(
    { email: 1 },
    {
        unique: true,
        partialFilterExpression: {
            deletedAt: null,
        },
    },
);
```

**Why this index?**

- The `email` field is queried frequently during login, signup. token validation, token rotation.
- Enforces uniqueness of email addresses for active authors, preventing registration conflicts.
- Partial filter ensures only non-deleted authors are indexed as we are using soft-delete.

### Book Schema (`src/schemas/book.schema.ts`)

**Current Index:**

```typescript
BookSchema.index(
    { title: 1, author: 1 },
    {
        unique: true,
        partialFilterExpression: {
            deletedAt: null,
        },
    },
);
```

**Why this index?**

- Enforces uniqueness of book titles per author for active books this preventing duplicate titles within an author's catalog. This rule only applied for non-deleted records.
- The compound index supports queries filtering by `author` and `title`.
- Used in book creation to check for existing titles.
- Partial filter focuses on active records, improving efficiency.

### Genre Schema (`src/schemas/genre.schema.ts`)

**Current Index:**

```typescript
GenreSchema.index(
    { creator: 1, name: 1 },
    {
        unique: true,
        partialFilterExpression: {
            deletedAt: null,
        },
    },
);
```

**Why this index?**

- Enforces uniqueness of genre names per creator for active genres, ensuring authors don't create duplicate genres.
- Supports queries filtering by `creator`.
- Used in genre creation to check for existing names .
- Partial filter optimizes for active records and uniqueness only applied for non-deleted records.

- 'partialFilterExpression' provides a targeted, efficient way to enforce uniqueness for active records in soft-deleted system. As we are not tracking and using the deleted records, so partial indexing avoid the pitfall of over-indexing and lower storage overhead.
