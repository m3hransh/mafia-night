#!/bin/bash

# Rollback Script for Mafia Night
# This script rolls back to the previous deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Load environment variables
if [ -f .env.production ]; then
    source .env.production
else
    echo -e "${RED}Error: .env.production file not found${NC}"
    exit 1
fi

echo -e "${YELLOW}Starting rollback on $DEPLOY_HOST${NC}"

ssh $DEPLOY_USER@$DEPLOY_HOST << EOF
    cd $DEPLOY_PATH

    # Check if backup exists
    if [ ! -d "./backup" ]; then
        echo -e "${RED}No backup found! Cannot rollback.${NC}"
        exit 1
    fi

    # Stop current containers
    docker-compose -f docker-compose.prod.yml down

    # Restore from backup
    rm -rf docker-compose.prod.yml backend frontend nginx
    cp -r backup/* .

    # Start containers with previous version
    docker-compose -f docker-compose.prod.yml up -d

    echo -e "${GREEN}Rollback completed!${NC}"
    docker-compose -f docker-compose.prod.yml ps
EOF

echo -e "${GREEN}Rollback completed successfully!${NC}"
