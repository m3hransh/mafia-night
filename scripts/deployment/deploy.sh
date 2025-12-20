#!/bin/bash

# Mafia Night Deployment Script
# This script deploys the application to a DigitalOcean VPS

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

# Check required variables
if [ -z "$DEPLOY_USER" ] || [ -z "$DEPLOY_HOST" ] || [ -z "$DEPLOY_PATH" ]; then
    echo -e "${RED}Error: Missing required deployment variables${NC}"
    echo "Required: DEPLOY_USER, DEPLOY_HOST, DEPLOY_PATH"
    exit 1
fi

echo -e "${GREEN}Starting deployment to $DEPLOY_HOST${NC}"

# Create deployment directory on remote server
echo -e "${YELLOW}Creating deployment directory...${NC}"
ssh $DEPLOY_USER@$DEPLOY_HOST "mkdir -p $DEPLOY_PATH"

# Copy files to remote server
echo -e "${YELLOW}Copying files to remote server...${NC}"
rsync -avz --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '.next' \
    --exclude 'backend/bin' \
    --exclude '.env*' \
    ./ $DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH/

# Copy production environment file
echo -e "${YELLOW}Copying environment configuration...${NC}"
scp .env.production $DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH/.env

# Deploy on remote server
echo -e "${YELLOW}Deploying application...${NC}"
ssh $DEPLOY_USER@$DEPLOY_HOST << EOF
    cd $DEPLOY_PATH

    # Pull latest images or build
    docker compose -f docker-compose.prod.yml pull || true

    # Stop existing containers
    docker compose -f docker-compose.prod.yml down

    # Build and start containers
    docker compose -f docker-compose.prod.yml up -d --build

    # Clean up old images
    docker image prune -f

    # Show running containers
    docker compose -f docker-compose.prod.yml ps
EOF

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${YELLOW}Application should be available at: http://$DEPLOY_HOST${NC}"

# Health check
echo -e "${YELLOW}Performing health check...${NC}"
sleep 10
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://$DEPLOY_HOST/health || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}Health check passed!${NC}"
else
    echo -e "${RED}Health check failed with code: $HTTP_CODE${NC}"
    echo -e "${YELLOW}Check logs with: ssh $DEPLOY_USER@$DEPLOY_HOST 'cd $DEPLOY_PATH && docker-compose -f docker-compose.prod.yml logs'${NC}"
fi
