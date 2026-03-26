#!/usr/bin/env bash

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
ssh "$DEPLOY_USER@$DEPLOY_HOST" "mkdir -p $DEPLOY_PATH"

# Sync files to remote server
# --delete ensures files removed from git are also removed on the server (fixes stale file issues)
# --checksum only transfers files whose content has changed
echo -e "${YELLOW}Syncing files to remote server...${NC}"
rsync -avz --checksum --delete \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '.next' \
    --exclude '.direnv' \
    --exclude '.swc' \
    --exclude 'backend/bin' \
    --exclude '.env*' \
    --exclude 'nginx/ssl' \
    --exclude 'frontend/certs' \
    --exclude 'frontend/playwright-report' \
    --exclude 'frontend/test-results' \
    --exclude 'frontend/tsconfig.tsbuildinfo' \
    --exclude 'docs' \
    ./ "$DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH/"

# Copy production environment file
echo -e "${YELLOW}Copying environment configuration...${NC}"
scp .env.production "$DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH/.env"

# Deploy on remote server
# Build first (fail fast before touching running containers), then rolling restart
echo -e "${YELLOW}Deploying application...${NC}"
ssh "$DEPLOY_USER@$DEPLOY_HOST" "
    set -e
    cd $DEPLOY_PATH

    # Build new images first so we fail before taking down the running app
    docker compose -f docker-compose.prod.yml build

    # Rolling restart: bring new containers up, wait for healthchecks, then swap
    docker compose -f docker-compose.prod.yml up -d --no-build --wait

    # Clean up old images
    docker image prune -f

    # Show running containers
    docker compose -f docker-compose.prod.yml ps
"

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${YELLOW}Application should be available at: https://$DEPLOY_HOST${NC}"

# Health check with retries (backend has a 40s start_period healthcheck)
echo -e "${YELLOW}Performing health check...${NC}"
MAX_RETRIES=12
RETRY_INTERVAL=10
for i in $(seq 1 $MAX_RETRIES); do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "https://$DEPLOY_HOST/health" 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}Health check passed!${NC}"
        exit 0
    fi
    echo -e "${YELLOW}[$i/$MAX_RETRIES] Waiting for app to be ready (got $HTTP_CODE)...${NC}"
    sleep $RETRY_INTERVAL
done

echo -e "${RED}Health check failed after $((MAX_RETRIES * RETRY_INTERVAL))s${NC}"
echo -e "${YELLOW}Check logs with: ssh $DEPLOY_USER@$DEPLOY_HOST 'cd $DEPLOY_PATH && docker compose -f docker-compose.prod.yml logs --tail=50'${NC}"
exit 1
