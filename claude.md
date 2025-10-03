# TiltPay Architecture

## Domain-Driven Design (DDD) Structure

This project follows Domain-Driven Design principles with a modular architecture organized by business domains.

## Directory Structure

```
app/
├── domains/
│   ├── {DOMAIN}/
│   │   ├── models/          # Domain entities and value objects
│   │   ├── services/        # Business logic and domain services
│   │   ├── controllers/     # HTTP request handlers
│   │   ├── validators/      # Input validation schemas
│   │   ├── adapters/        # External service integrations and repositories
│   │   └── exceptions/      # Domain-specific exceptions
```

## Layer Responsibilities

### models/

- Domain entities representing core business objects
- Value objects for immutable domain concepts
- Aggregate roots that maintain consistency boundaries
- Domain events

### services/

- Business logic and use cases
- Domain services for operations that don't belong to a single entity
- Application services orchestrating domain operations
- Transaction management

### controllers/

- HTTP request/response handling
- Route definitions
- Request parsing and response formatting
- Delegation to services

### validators/

- Input validation schemas
- Request validation logic
- Data sanitization
- Validation rules and constraints

### adapters/

- Repository implementations for data persistence
- External API clients
- Third-party service integrations
- Infrastructure adapters (email, SMS, payment gateways)

### exceptions/

- Domain-specific error types
- Business rule violation exceptions
- Custom error handling
- Error codes and messages

## Design Principles

1. **Separation of Concerns**: Each layer has a single, well-defined responsibility
2. **Dependency Inversion**: Core domain logic doesn't depend on infrastructure
3. **Encapsulation**: Domain logic is protected within the domain layer
4. **Ubiquitous Language**: Code reflects business domain terminology
5. **Bounded Contexts**: Each domain is self-contained with clear boundaries

## Example Domain Structure

```
src/domains/payment/
├── models/
│   ├── Payment.ts
│   ├── PaymentMethod.ts
│   └── Transaction.ts
├── services/
│   ├── PaymentService.ts
│   └── RefundService.ts
├── controllers/
│   ├── PaymentController.ts
│   └── RefundController.ts
├── validators/
│   ├── PaymentValidator.ts
│   └── RefundValidator.ts
├── adapters/
│   ├── PaymentRepository.ts
│   └── StripeAdapter.ts
└── exceptions/
    ├── PaymentFailedException.ts
    └── InsufficientFundsException.ts
```
