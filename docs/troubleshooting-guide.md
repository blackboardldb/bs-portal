# Troubleshooting Guide

## Overview

This guide provides solutions for common issues encountered during and after the data layer migration from Mock to Prisma provider.

## Table of Contents

1. [Common Issues](#common-issues)
2. [Error Messages](#error-messages)
3. [Performance Issues](#performance-issues)
4. [Data Inconsistencies](#data-inconsistencies)
5. [Provider Switching Issues](#provider-switching-issues)
6. [Database Connection Issues](#database-connection-issues)
7. [Debugging Tools](#debugging-tools)
8. [Emergency Procedures](#emergency-procedures)

## Common Issues

### 1. Application Won't Start

**Symptoms:**

- Application crashes on startup
- Error messages about missing dependencies
- Database connection errors

**Solutions:**

1. **Check Environment Variables**

   ```bash
   # Verify .env file exists and has correct values
   cat .env | grep -E "(DATA_PROVIDER|DATABASE_URL)"
   ```

2. **Install Missing Dependencies**

   ```bash
   npm install prisma @prisma/client
   npx prisma generate
   ```

3. **Verify Database Connection**

   ```bash
   # Test PostgreSQL connection
   psql $DATABASE_URL -c "SELECT version();"
   ```

4. **Check Node.js Version**
   ```bash
   node --version  # Should be >= 18.0.0
   ```

### 2. Provider Switch Fails

**Symptoms:**

- API returns errors after switching providers
- Health check shows unhealthy status
- Data not loading in frontend

**Solutions:**

1. **Verify Provider Configuration**

   ```bash
   curl http://localhost:3000/api/system/provider
   ```

2. **Check Database Schema**

   ```bash
   npx prisma db push
   npx prisma generate
   ```

3. **Restart Application**

   ```bash
   # Kill existing process and restart
   pkill -f "next dev"
   npm run dev
   ```

4. **Emergency Rollback**
   ```bash
   ./scripts/rollback-to-mock.sh
   ```

### 3. Data Not Loading

**Symptoms:**

- Empty lists in frontend
- API returns empty arrays
- No error messages

**Solutions:**

1. **Check Database Data**

   ```bash
   npx prisma studio
   # Or check directly
   psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
   ```

2. **Re-seed Database**

   ```bash
   npm run db:seed
   ```

3. **Verify API Endpoints**

   ```bash
   curl http://localhost:3000/api/users
   curl http://localhost:3000/api/classes
   ```

4. **Check Service Layer**
   ```bash
   curl "http://localhost:3000/api/system/health?metrics=true"
   ```

## Error Messages

### Database Connection Errors

#### Error: `Can't reach database server`

**Cause:** PostgreSQL server is not running or not accessible

**Solutions:**

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL if stopped
sudo systemctl start postgresql

# Check connection string format
echo $DATABASE_URL
# Should be: postgresql://user:password@host:port/database
```

#### Error: `Authentication failed`

**Cause:** Incorrect database credentials

**Solutions:**

```bash
# Verify credentials
psql -h localhost -U your_username -d your_database

# Update .env file with correct credentials
DATABASE_URL="postgresql://correct_user:correct_password@localhost:5432/database"
```

#### Error: `Database does not exist`

**Cause:** Target database hasn't been created

**Solutions:**

```sql
-- Connect to PostgreSQL and create database
CREATE DATABASE your_database_name;
GRANT ALL PRIVILEGES ON DATABASE your_database_name TO your_user;
```

### Prisma Errors

#### Error: `Schema validation failed`

**Cause:** Prisma schema has syntax errors

**Solutions:**

```bash
# Validate schema
npx prisma validate

# Format schema
npx prisma format

# Check for common issues:
# - Missing relations
# - Invalid field types
# - Duplicate model names
```

#### Error: `Migration failed`

**Cause:** Database schema conflicts or permission issues

**Solutions:**

```bash
# Reset database (CAUTION: Deletes all data)
npx prisma migrate reset

# Or push schema without migration
npx prisma db push --accept-data-loss

# Check migration status
npx prisma migrate status
```

### API Errors

#### Error: `Provider not found`

**Cause:** DataProviderFactory can't create the specified provider

**Solutions:**

```bash
# Check environment variable
grep DATA_PROVIDER .env

# Verify valid values: mock or prisma
# Update if necessary
sed -i 's/DATA_PROVIDER=.*/DATA_PROVIDER=mock/' .env
```

#### Error: `Service initialization failed`

**Cause:** Service layer can't connect to data provider

**Solutions:**

```bash
# Check system health
curl http://localhost:3000/api/system/health

# Restart application
npm run dev

# Check logs for detailed error messages
```

## Performance Issues

### Slow API Responses

**Symptoms:**

- API calls take longer than expected
- Frontend shows loading states for extended periods
- Timeout errors

**Diagnosis:**

```bash
# Check performance metrics
curl "http://localhost:3000/api/system/health?metrics=true"

# Monitor database queries (if using Prisma)
# Enable query logging in schema.prisma:
# generator client {
#   provider = "prisma-client-js"
#   log      = ["query", "info", "warn", "error"]
# }
```

**Solutions:**

1. **Database Optimization**

   ```sql
   -- Add indexes for frequently queried fields
   CREATE INDEX idx_users_email ON users(email);
   CREATE INDEX idx_class_sessions_date ON class_sessions(date_time);
   CREATE INDEX idx_class_sessions_discipline ON class_sessions(discipline_id);
   ```

2. **Connection Pool Tuning**

   ```env
   # Adjust connection limits
   DB_CONNECTION_LIMIT=20
   DB_QUERY_TIMEOUT=10000
   ```

3. **Query Optimization**
   - Use appropriate pagination limits
   - Avoid N+1 queries
   - Use database indexes

### High Memory Usage

**Symptoms:**

- Application crashes with out-of-memory errors
- Slow performance over time
- High memory usage in monitoring

**Solutions:**

1. **Monitor Memory Usage**

   ```bash
   # Check current memory usage
   curl "http://localhost:3000/api/system/health" | grep memory
   ```

2. **Optimize Queries**

   - Limit result sets with `take` parameter
   - Use pagination for large datasets
   - Clear unused data from memory

3. **Restart Application Periodically**
   ```bash
   # In production, consider process managers like PM2
   pm2 restart app
   ```

## Data Inconsistencies

### Missing Data After Migration

**Symptoms:**

- Some records missing after switching to Prisma
- Data doesn't match between providers

**Solutions:**

1. **Compare Data Sources**

   ```bash
   # Check mock data
   curl http://localhost:3000/api/users?provider=mock

   # Check database data
   psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
   ```

2. **Re-run Seed Script**

   ```bash
   npm run db:seed
   ```

3. **Manual Data Verification**
   ```bash
   npx prisma studio
   # Manually verify data integrity
   ```

### Incorrect Data Format

**Symptoms:**

- JSON fields not parsing correctly
- Date format issues
- Type conversion errors

**Solutions:**

1. **Check JSON Field Structure**

   ```sql
   -- Verify JSON fields in database
   SELECT membership FROM users LIMIT 1;
   ```

2. **Update Data Transformation**
   - Check repository implementations
   - Verify data mapping in services
   - Update type definitions if needed

## Provider Switching Issues

### Switch Doesn't Take Effect

**Symptoms:**

- API still uses old provider after switch
- Health check shows wrong provider type

**Solutions:**

1. **Verify Environment Variable**

   ```bash
   grep DATA_PROVIDER .env
   ```

2. **Clear Application Cache**

   ```bash
   # Remove .next cache
   rm -rf .next
   npm run dev
   ```

3. **Force Provider Reset**
   ```bash
   # Use API to switch provider
   curl -X POST http://localhost:3000/api/system/provider \
     -H "Content-Type: application/json" \
     -d '{"provider": "prisma"}'
   ```

### Partial Provider Switch

**Symptoms:**

- Some operations work, others don't
- Inconsistent behavior across different endpoints

**Solutions:**

1. **Check Service Initialization**

   ```bash
   curl "http://localhost:3000/api/system/health?metrics=true"
   ```

2. **Restart All Services**

   ```bash
   pkill -f "next"
   npm run dev
   ```

3. **Verify All Repositories**
   - Test each API endpoint individually
   - Check logs for specific errors

## Database Connection Issues

### Connection Pool Exhausted

**Symptoms:**

- "Too many connections" errors
- Intermittent connection failures
- Slow response times

**Solutions:**

1. **Adjust Connection Limits**

   ```env
   DB_CONNECTION_LIMIT=10  # Reduce if needed
   ```

2. **Check for Connection Leaks**

   ```bash
   # Monitor active connections
   psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"
   ```

3. **Implement Connection Retry**
   ```env
   DB_RETRY_ATTEMPTS=3
   DB_QUERY_TIMEOUT=5000
   ```

### SSL Connection Issues

**Symptoms:**

- SSL-related connection errors
- Certificate validation failures

**Solutions:**

1. **Update Connection String**

   ```env
   # For development (disable SSL)
   DATABASE_URL="postgresql://user:pass@localhost:5432/db?sslmode=disable"

   # For production (require SSL)
   DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
   ```

2. **Check SSL Configuration**
   ```bash
   # Test SSL connection
   psql "$DATABASE_URL?sslmode=require" -c "SELECT version();"
   ```

## Debugging Tools

### Health Check Dashboard

Access comprehensive system health information:

```bash
# Basic health check
curl http://localhost:3000/api/system/health

# Detailed health with metrics
curl "http://localhost:3000/api/system/health?metrics=true&logs=true"

# Quick health check
curl "http://localhost:3000/api/system/health?quick=true"
```

### Provider Management

```bash
# Check current provider
curl http://localhost:3000/api/system/provider

# Switch provider
curl -X POST http://localhost:3000/api/system/provider \
  -H "Content-Type: application/json" \
  -d '{"provider": "mock"}'

# Clear performance metrics
curl -X POST http://localhost:3000/api/system/health \
  -H "Content-Type: application/json" \
  -d '{"action": "clear_metrics"}'
```

### Database Tools

```bash
# Prisma Studio (GUI)
npx prisma studio

# Database shell
psql $DATABASE_URL

# Schema inspection
npx prisma db pull

# Migration status
npx prisma migrate status
```

### Log Analysis

```bash
# Application logs
tail -f logs/application.log

# Database logs (PostgreSQL)
tail -f /var/log/postgresql/postgresql-*.log

# System logs
journalctl -u your-app-service -f
```

## Emergency Procedures

### Complete System Failure

1. **Immediate Rollback**

   ```bash
   ./scripts/rollback-to-mock.sh
   ```

2. **Verify Basic Functionality**

   ```bash
   curl http://localhost:3000/api/system/health
   ```

3. **Investigate Root Cause**
   - Check application logs
   - Review recent changes
   - Test individual components

### Data Corruption

1. **Stop Application**

   ```bash
   pkill -f "next dev"
   ```

2. **Restore from Backup**

   ```bash
   # Restore database from backup
   psql $DATABASE_URL < backup_file.sql
   ```

3. **Verify Data Integrity**

   ```bash
   # Run data validation queries
   psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
   ```

4. **Restart Application**
   ```bash
   npm run dev
   ```

### Performance Degradation

1. **Check System Resources**

   ```bash
   # Memory usage
   free -h

   # CPU usage
   top

   # Disk space
   df -h
   ```

2. **Analyze Performance Metrics**

   ```bash
   curl "http://localhost:3000/api/system/health?metrics=true"
   ```

3. **Optimize or Scale**
   - Increase server resources
   - Optimize database queries
   - Implement caching
   - Scale horizontally if needed

## Getting Help

### Internal Resources

- System Health Dashboard: `/api/system/health`
- Provider Management: `/api/system/provider`
- Performance Metrics: `/api/system/health?metrics=true`

### Log Locations

- Application logs: Check console output or configured log files
- Database logs: PostgreSQL log directory
- System logs: `/var/log/` or `journalctl`

### Diagnostic Commands

```bash
# Quick system check
curl http://localhost:3000/api/system/health?quick=true

# Full diagnostic
curl "http://localhost:3000/api/system/health?metrics=true&logs=true"

# Provider status
curl http://localhost:3000/api/system/provider

# Database connection test
npx prisma db execute --stdin <<< "SELECT 1;"
```

### Emergency Contacts

- Database Administrator: [Contact Info]
- DevOps Team: [Contact Info]
- Development Team Lead: [Contact Info]
- On-call Engineer: [Contact Info]

---

**Last Updated**: [Current Date]
**Version**: 1.0
**Reviewed By**: [Reviewer Name]
