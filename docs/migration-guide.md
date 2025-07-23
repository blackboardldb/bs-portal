# Data Layer Migration Guide

## Overview

This guide provides step-by-step instructions for migrating from the Mock data provider to the Prisma database provider in the BlackSheep CrossFit application.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Migration Process](#migration-process)
5. [Verification](#verification)
6. [Rollback Procedures](#rollback-procedures)
7. [Troubleshooting](#troubleshooting)
8. [Performance Considerations](#performance-considerations)

## Prerequisites

Before starting the migration, ensure you have:

- [ ] PostgreSQL database server installed and running
- [ ] Database credentials and connection details
- [ ] Backup of current application state (if applicable)
- [ ] Access to environment configuration
- [ ] Understanding of current data structure

### Required Software Versions

- Node.js: >= 18.0.0
- PostgreSQL: >= 13.0
- Prisma CLI: >= 5.0.0

## Environment Setup

### 1. Install Dependencies

Ensure all required dependencies are installed:

```bash
npm install prisma @prisma/client
npm install --save-dev prisma
```

### 2. Environment Variables

Create or update your `.env` file with the following variables:

```env
# Data Provider Configuration
DATA_PROVIDER=prisma

# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/blacksheep_db"

# Optional: Performance Settings
DB_CONNECTION_LIMIT=20
DB_QUERY_TIMEOUT=10000
DB_RETRY_ATTEMPTS=3

# Optional: Logging
LOG_LEVEL=info
LOG_PROVIDER_OPERATIONS=true
```

### 3. Environment-Specific Configurations

#### Development Environment

```env
DATA_PROVIDER=prisma
DATABASE_URL="postgresql://dev_user:dev_pass@localhost:5432/blacksheep_dev"
DB_CONNECTION_LIMIT=5
LOG_LEVEL=debug
```

#### Staging Environment

```env
DATA_PROVIDER=prisma
DATABASE_URL="postgresql://staging_user:staging_pass@staging-db:5432/blacksheep_staging"
DB_CONNECTION_LIMIT=10
LOG_LEVEL=info
```

#### Production Environment

```env
DATA_PROVIDER=prisma
DATABASE_URL="postgresql://prod_user:prod_pass@prod-db:5432/blacksheep_prod"
DB_CONNECTION_LIMIT=20
LOG_LEVEL=error
```

## Database Setup

### 1. Create Database

Connect to your PostgreSQL server and create the database:

```sql
CREATE DATABASE blacksheep_db;
CREATE USER blacksheep_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE blacksheep_db TO blacksheep_user;
```

### 2. Verify Connection

Test the database connection:

```bash
psql -h localhost -U blacksheep_user -d blacksheep_db -c "SELECT version();"
```

## Migration Process

### Phase 1: Pre-Migration Validation

1. **Validate Current System**

   ```bash
   # Check current provider status
   curl http://localhost:3000/api/system/provider

   # Verify system health
   curl http://localhost:3000/api/system/health
   ```

2. **Export Current Data (if needed)**
   ```bash
   # Export current mock data for reference
   curl http://localhost:3000/api/system/health?metrics=true > pre-migration-state.json
   ```

### Phase 2: Database Schema Setup

1. **Initialize Prisma**

   ```bash
   npx prisma init
   ```

2. **Create Schema File**

   Create `prisma/schema.prisma`:

   ```prisma
   generator client {
     provider = "prisma-client-js"
   }

   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }

   model User {
     id        String   @id @default(cuid())
     firstName String
     lastName  String
     email     String   @unique
     phone     String?
     role      String   @default("user")
     createdAt DateTime @default(now())
     updatedAt DateTime @updatedAt

     // Membership information stored as JSON
     membership Json?

     @@map("users")
   }

   model ClassSession {
     id                        String   @id @default(cuid())
     organizationId           String
     disciplineId             String
     name                     String
     dateTime                 DateTime
     durationMinutes          Int
     instructorId             String
     capacity                 Int
     registeredParticipantsIds String[]
     waitlistParticipantsIds   String[]
     status                   String   @default("scheduled")
     notes                    String?
     isGenerated              Boolean  @default(false)
     createdAt                DateTime @default(now())
     updatedAt                DateTime @updatedAt

     @@map("class_sessions")
   }

   model Discipline {
     id             String   @id @default(cuid())
     organizationId String
     name           String
     description    String?
     color          String   @default("#3b82f6")
     isActive       Boolean  @default(true)
     schedule       Json?
     createdAt      DateTime @default(now())
     updatedAt      DateTime @updatedAt

     @@map("disciplines")
   }

   model Instructor {
     id        String   @id @default(cuid())
     firstName String
     lastName  String
     email     String   @unique
     phone     String?
     role      String   @default("instructor")
     isActive  Boolean  @default(true)
     createdAt DateTime @default(now())
     updatedAt DateTime @updatedAt

     @@map("instructors")
   }

   model MembershipPlan {
     id          String   @id @default(cuid())
     name        String   @unique
     description String?
     price       Float
     duration    Int      // Duration in months
     features    Json?    // Plan features as JSON
     isActive    Boolean  @default(true)
     createdAt   DateTime @default(now())
     updatedAt   DateTime @updatedAt

     @@map("membership_plans")
   }

   // Expense model - for tracking business expenses
   model Expense {
     id        String   @id @default(cuid())
     motivo    String   // Reason for the expense
     fecha     DateTime // Date of the expense
     monto     Float    // Amount spent
     createdAt DateTime @default(now())
     updatedAt DateTime @updatedAt

     @@map("expenses")
     @@index([fecha])
     @@index([createdAt])
   }
   ```

3. **Generate Migration**

   ```bash
   npx prisma migrate dev --name init
   ```

4. **Generate Prisma Client**
   ```bash
   npx prisma generate
   ```

### Phase 3: Data Migration

1. **Seed Database with Initial Data**

   Create `prisma/seed.ts`:

   ```typescript
   import { PrismaClient } from "@prisma/client";
   import {
     initialUsers,
     initialDisciplines,
     initialInstructors,
     initialMembershipPlans,
   } from "../lib/mock-data";

   const prisma = new PrismaClient();

   async function main() {
     console.log("Seeding database...");

     // Seed disciplines
     for (const discipline of initialDisciplines) {
       await prisma.discipline.upsert({
         where: { id: discipline.id },
         update: {},
         create: discipline,
       });
     }

     // Seed instructors
     for (const instructor of initialInstructors) {
       await prisma.instructor.upsert({
         where: { email: instructor.email },
         update: {},
         create: instructor,
       });
     }

     // Seed membership plans
     for (const plan of initialMembershipPlans) {
       await prisma.membershipPlan.upsert({
         where: { name: plan.name },
         update: {},
         create: plan,
       });
     }

     // Seed users
     for (const user of initialUsers) {
       await prisma.user.upsert({
         where: { email: user.email },
         update: {},
         create: user,
       });
     }

     console.log("Database seeded successfully");
   }

   main()
     .catch((e) => {
       console.error(e);
       process.exit(1);
     })
     .finally(async () => {
       await prisma.$disconnect();
     });
   ```

2. **Run Seed Script**
   ```bash
   npx prisma db seed
   ```

### Phase 4: Provider Switch

1. **Update Environment Variables**

   ```bash
   # Update .env file
   DATA_PROVIDER=prisma
   ```

2. **Restart Application**

   ```bash
   npm run dev
   ```

3. **Verify Provider Switch**

   ```bash
   # Check provider status
   curl http://localhost:3000/api/system/provider

   # Should return: {"provider": "prisma", "status": "healthy"}
   ```

### Phase 5: Validation

1. **Test Basic Operations**

   ```bash
   # Test user operations
   curl http://localhost:3000/api/users
   curl http://localhost:3000/api/users/stats

   # Test class operations
   curl http://localhost:3000/api/classes

   # Test discipline operations
   curl http://localhost:3000/api/disciplines

   # Test expense operations (admin only)
   curl http://localhost:3000/api/expenses
   ```

2. **Run Health Check**

   ```bash
   curl http://localhost:3000/api/system/health
   ```

3. **Performance Validation**
   ```bash
   # Check performance metrics
   curl "http://localhost:3000/api/system/health?metrics=true"
   ```

## Verification

### Automated Verification Script

Create `scripts/verify-migration.js`:

```javascript
const axios = require("axios");

async function verifyMigration() {
  const baseUrl = "http://localhost:3000";

  try {
    // Check provider status
    const providerResponse = await axios.get(`${baseUrl}/api/system/provider`);
    console.log("✓ Provider Status:", providerResponse.data.provider);

    // Check system health
    const healthResponse = await axios.get(`${baseUrl}/api/system/health`);
    console.log("✓ System Health:", healthResponse.data.overall);

    // Test data operations
    const usersResponse = await axios.get(`${baseUrl}/api/users?limit=5`);
    console.log("✓ Users API:", usersResponse.data.data.length, "users found");

    const classesResponse = await axios.get(`${baseUrl}/api/classes?limit=5`);
    console.log(
      "✓ Classes API:",
      classesResponse.data.data.length,
      "classes found"
    );

    const expensesResponse = await axios.get(`${baseUrl}/api/expenses?limit=5`);
    console.log(
      "✓ Expenses API:",
      expensesResponse.data.data.length,
      "expenses found"
    );

    console.log("\n🎉 Migration verification completed successfully!");
  } catch (error) {
    console.error("❌ Migration verification failed:", error.message);
    process.exit(1);
  }
}

verifyMigration();
```

Run verification:

```bash
node scripts/verify-migration.js
```

### Manual Verification Checklist

- [ ] Application starts without errors
- [ ] Provider status shows "prisma"
- [ ] System health check passes
- [ ] User operations work (list, create, update, delete)
- [ ] Class operations work (list, create, register)
- [ ] Discipline operations work
- [ ] Instructor operations work
- [ ] Plan operations work
- [ ] Expense operations work (admin)
- [ ] Financial calculations are correct
- [ ] Frontend components load correctly
- [ ] No console errors in browser
- [ ] Performance is acceptable

## Rollback Procedures

### Emergency Rollback

If issues occur during migration, you can quickly rollback:

1. **Switch Back to Mock Provider**

   ```bash
   # Update .env
   DATA_PROVIDER=mock

   # Restart application
   npm run dev
   ```

2. **Verify Rollback**
   ```bash
   curl http://localhost:3000/api/system/provider
   # Should return: {"provider": "mock"}
   ```

### Planned Rollback

For a planned rollback with data preservation:

1. **Export Current Database Data**

   ```bash
   pg_dump -h localhost -U blacksheep_user blacksheep_db > backup.sql
   ```

2. **Switch Provider**

   ```bash
   DATA_PROVIDER=mock
   ```

3. **Restart and Verify**

## Troubleshooting

### Common Issues

#### 1. Database Connection Errors

**Error**: `Can't reach database server`

**Solutions**:

- Verify PostgreSQL is running: `sudo systemctl status postgresql`
- Check connection string format
- Verify firewall settings
- Test connection manually: `psql -h localhost -U username -d database`

#### 2. Migration Failures

**Error**: `Migration failed`

**Solutions**:

- Check database permissions
- Verify schema syntax
- Review migration logs
- Reset database if needed: `npx prisma migrate reset`

#### 3. Performance Issues

**Symptoms**: Slow response times

**Solutions**:

- Check database indexes
- Monitor connection pool usage
- Adjust `DB_CONNECTION_LIMIT`
- Review query performance

#### 4. Data Inconsistencies

**Symptoms**: Missing or incorrect data

**Solutions**:

- Re-run seed script
- Check data mapping in repositories
- Verify JSON field structures
- Compare with mock data

### Debug Commands

```bash
# Check Prisma client generation
npx prisma generate

# View database schema
npx prisma db pull

# Reset database (CAUTION: Deletes all data)
npx prisma migrate reset

# View migration status
npx prisma migrate status

# Open Prisma Studio for data inspection
npx prisma studio
```

### Logging and Monitoring

Enable detailed logging during migration:

```env
LOG_LEVEL=debug
LOG_PROVIDER_OPERATIONS=true
```

Monitor logs for:

- Connection errors
- Query performance
- Data validation issues
- Provider switch events

## Performance Considerations

### Database Optimization

1. **Indexes**

   ```sql
   -- Add indexes for frequently queried fields
   CREATE INDEX idx_users_email ON users(email);
   CREATE INDEX idx_class_sessions_date ON class_sessions(date_time);
   CREATE INDEX idx_class_sessions_discipline ON class_sessions(discipline_id);
   CREATE INDEX idx_expenses_fecha ON expenses(fecha);
   CREATE INDEX idx_expenses_created_at ON expenses(created_at);
   ```

2. **Connection Pooling**

   ```env
   # Adjust based on your server capacity
   DB_CONNECTION_LIMIT=20
   DB_QUERY_TIMEOUT=10000
   ```

3. **Query Optimization**
   - Use appropriate `take` and `skip` for pagination
   - Avoid N+1 queries with proper includes
   - Monitor slow queries

### Monitoring Setup

1. **Performance Metrics**

   - Monitor response times
   - Track database connection usage
   - Watch for slow queries

2. **Health Checks**
   - Set up automated health monitoring
   - Configure alerts for failures
   - Monitor system resources

## Post-Migration Tasks

### 1. Update Documentation

- [ ] Update API documentation
- [ ] Update deployment guides
- [ ] Update development setup instructions

### 2. Team Training

- [ ] Train team on Prisma usage
- [ ] Share troubleshooting procedures
- [ ] Document new development workflows

### 3. Monitoring Setup

- [ ] Configure production monitoring
- [ ] Set up alerting
- [ ] Establish backup procedures

### 4. Performance Baseline

- [ ] Establish performance baselines
- [ ] Set up performance monitoring
- [ ] Document optimization procedures

## Support and Resources

### Documentation Links

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)

### Internal Resources

- System Health Dashboard: `/api/system/health`
- Provider Management: `/api/system/provider`
- Performance Metrics: `/api/system/health?metrics=true`

### Emergency Contacts

- Database Administrator: [Contact Info]
- DevOps Team: [Contact Info]
- Development Team Lead: [Contact Info]

---

**Last Updated**: [Current Date]
**Version**: 1.0
**Reviewed By**: [Reviewer Name]
