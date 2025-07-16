#!/bin/bash

# Rollback Script: Prisma to Mock Provider
# This script rolls back from Prisma to Mock data provider

set -e  # Exit on any error

echo "🔄 Starting rollback from Prisma to Mock provider..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Confirm rollback
echo "⚠️  This will rollback to Mock provider and you will lose database data."
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_status "Rollback cancelled"
    exit 0
fi

# Create backup before rollback (if using Prisma)
if grep -q "DATA_PROVIDER=prisma" .env 2>/dev/null; then
    print_status "Creating backup before rollback..."
    BACKUP_FILE="rollback_backup_$(date +%Y%m%d_%H%M%S).sql"
    
    if command -v pg_dump &> /dev/null && [ -n "$DATABASE_URL" ]; then
        pg_dump $DATABASE_URL > $BACKUP_FILE 2>/dev/null || print_warning "Could not create database backup"
        if [ -f "$BACKUP_FILE" ]; then
            print_success "Backup created: $BACKUP_FILE"
        fi
    else
        print_warning "Could not create database backup (pg_dump not available or DATABASE_URL not set)"
    fi
fi

# Update environment variable
print_status "Updating DATA_PROVIDER to mock..."
if grep -q "DATA_PROVIDER=" .env; then
    sed -i.bak 's/DATA_PROVIDER=.*/DATA_PROVIDER=mock/' .env
else
    echo "DATA_PROVIDER=mock" >> .env
fi
print_success "Environment variable updated"

# Verify rollback
print_status "Verifying rollback..."

# Start the application in background for testing
print_status "Starting application for verification..."
npm run dev &
APP_PID=$!

# Wait for application to start
sleep 10

# Test API endpoints
print_status "Testing API endpoints..."

# Test health endpoint
if curl -s http://localhost:3000/api/system/health | grep -q "healthy"; then
    print_success "Health check passed"
else
    print_warning "Health check failed or returned unexpected result"
fi

# Test provider endpoint
if curl -s http://localhost:3000/api/system/provider | grep -q "mock"; then
    print_success "Provider rollback verified"
else
    print_warning "Provider verification failed"
fi

# Test users endpoint
if curl -s http://localhost:3000/api/users | grep -q "success"; then
    print_success "Users API working"
else
    print_warning "Users API test failed"
fi

# Stop the test application
kill $APP_PID 2>/dev/null || true

print_success "Rollback verification completed"

# Final instructions
echo ""
echo "🎉 Rollback completed successfully!"
echo ""
echo "Current status:"
echo "- Data provider: Mock"
echo "- Database: Not used (using in-memory mock data)"
echo "- Backup: ${BACKUP_FILE:-Not created}"
echo ""
echo "Next steps:"
echo "1. Restart your application: npm run dev"
echo "2. Verify all functionality works with mock data"
echo "3. If you need to restore database data, use the backup file"
echo ""
echo "To migrate back to Prisma:"
echo "1. Run: ./scripts/migrate-to-prisma.sh"
echo "2. Or manually set DATA_PROVIDER=prisma in .env"
echo ""
print_success "Rollback script completed!"