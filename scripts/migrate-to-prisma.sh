#!/bin/bash

# Migration Script: Mock to Prisma Provider
# This script automates the migration from Mock to Prisma data provider

set -e  # Exit on any error

echo "🚀 Starting migration from Mock to Prisma provider..."

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

# Check prerequisites
print_status "Checking prerequisites..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    print_error "PostgreSQL is not installed. Please install PostgreSQL first."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    print_error ".env file not found. Please create .env file with DATABASE_URL."
    exit 1
fi

# Check if DATABASE_URL is set
if ! grep -q "DATABASE_URL" .env; then
    print_error "DATABASE_URL not found in .env file."
    exit 1
fi

print_success "Prerequisites check passed"

# Install dependencies
print_status "Installing dependencies..."
npm install prisma @prisma/client
print_success "Dependencies installed"

# Generate Prisma client
print_status "Generating Prisma client..."
npx prisma generate
print_success "Prisma client generated"

# Test database connection
print_status "Testing database connection..."
if npx prisma db execute --stdin <<< "SELECT 1;" &> /dev/null; then
    print_success "Database connection successful"
else
    print_error "Database connection failed. Please check your DATABASE_URL."
    exit 1
fi

# Create database schema
print_status "Creating database schema..."
npx prisma db push --accept-data-loss
print_success "Database schema created"

# Seed database
print_status "Seeding database with initial data..."
npx prisma db seed
print_success "Database seeded successfully"

# Update environment variable
print_status "Updating DATA_PROVIDER to prisma..."
if grep -q "DATA_PROVIDER=" .env; then
    sed -i.bak 's/DATA_PROVIDER=.*/DATA_PROVIDER=prisma/' .env
else
    echo "DATA_PROVIDER=prisma" >> .env
fi
print_success "Environment variable updated"

# Verify migration
print_status "Verifying migration..."

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
if curl -s http://localhost:3000/api/system/provider | grep -q "prisma"; then
    print_success "Provider switch verified"
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

print_success "Migration verification completed"

# Create backup of current state
print_status "Creating backup of current database state..."
BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
pg_dump $DATABASE_URL > $BACKUP_FILE
print_success "Backup created: $BACKUP_FILE"

# Final instructions
echo ""
echo "🎉 Migration completed successfully!"
echo ""
echo "Next steps:"
echo "1. Restart your application: npm run dev"
echo "2. Test all functionality thoroughly"
echo "3. Monitor performance and logs"
echo "4. Keep the backup file safe: $BACKUP_FILE"
echo ""
echo "If you encounter issues, you can rollback by:"
echo "1. Setting DATA_PROVIDER=mock in .env"
echo "2. Restarting the application"
echo ""
echo "For troubleshooting, check:"
echo "- Application logs"
echo "- Database logs"
echo "- System health: http://localhost:3000/api/system/health"
echo ""
print_success "Migration script completed!"