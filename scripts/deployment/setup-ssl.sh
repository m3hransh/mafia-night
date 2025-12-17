#!/bin/bash

# SSL Setup Script for Mafia Night
# This script sets up Let's Encrypt SSL certificates on your VPS

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if domain is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Domain name required${NC}"
    echo "Usage: $0 your-domain.com"
    echo "Example: $0 mafianight.com"
    exit 1
fi

DOMAIN=$1

# Load environment variables
if [ -f .env.production ]; then
    source .env.production
else
    echo -e "${RED}Error: .env.production file not found${NC}"
    exit 1
fi

echo -e "${GREEN}Setting up SSL for $DOMAIN${NC}"
echo -e "${YELLOW}This will:${NC}"
echo "  1. Install Certbot on VPS"
echo "  2. Obtain SSL certificate from Let's Encrypt"
echo "  3. Copy certificates to deployment directory"
echo "  4. Set up auto-renewal"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# SSH into VPS and run SSL setup
ssh $DEPLOY_USER@$DEPLOY_HOST << EOF
    set -e

    echo -e "${YELLOW}Installing Certbot...${NC}"
    sudo apt-get update
    sudo apt-get install -y certbot

    echo -e "${YELLOW}Stopping nginx to free port 80...${NC}"
    cd $DEPLOY_PATH
    docker compose -f docker-compose.prod.yml stop nginx

    echo -e "${YELLOW}Obtaining SSL certificate...${NC}"
    echo "You will be prompted for:"
    echo "  - Email address (for renewal notices)"
    echo "  - Agree to Terms of Service"
    echo ""

    sudo certbot certonly --standalone -d $DOMAIN

    echo -e "${YELLOW}Creating SSL directory...${NC}"
    sudo mkdir -p $DEPLOY_PATH/nginx/ssl

    echo -e "${YELLOW}Copying certificates...${NC}"
    sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $DEPLOY_PATH/nginx/ssl/cert.pem
    sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $DEPLOY_PATH/nginx/ssl/key.pem

    echo -e "${YELLOW}Setting permissions...${NC}"
    sudo chown $DEPLOY_USER:$DEPLOY_USER $DEPLOY_PATH/nginx/ssl/*.pem
    sudo chmod 644 $DEPLOY_PATH/nginx/ssl/cert.pem
    sudo chmod 600 $DEPLOY_PATH/nginx/ssl/key.pem

    echo -e "${YELLOW}Setting up auto-renewal...${NC}"
    # Create renewal script
    cat > /tmp/renew-ssl.sh << 'RENEWAL'
#!/bin/bash
certbot renew --quiet
cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $DEPLOY_PATH/nginx/ssl/cert.pem
cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $DEPLOY_PATH/nginx/ssl/key.pem
cd $DEPLOY_PATH && docker compose -f docker-compose.prod.yml restart nginx
RENEWAL

    sudo mv /tmp/renew-ssl.sh /usr/local/bin/renew-ssl.sh
    sudo chmod +x /usr/local/bin/renew-ssl.sh

    # Add to crontab
    (crontab -l 2>/dev/null | grep -v renew-ssl; echo "0 0,12 * * * /usr/local/bin/renew-ssl.sh") | sudo crontab -

    echo -e "${GREEN}SSL setup completed successfully!${NC}"
    echo ""
    echo "Certificates installed at:"
    echo "  - $DEPLOY_PATH/nginx/ssl/cert.pem"
    echo "  - $DEPLOY_PATH/nginx/ssl/key.pem"
    echo ""
    echo "Auto-renewal configured (runs twice daily)"
EOF

echo ""
echo -e "${GREEN}SSL setup complete!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Update nginx/nginx.conf with HTTPS configuration"
echo "   - Replace 'your-domain.com' with '$DOMAIN'"
echo "   - Uncomment HTTPS server block"
echo ""
echo "2. Update .env.production:"
echo "   NEXT_PUBLIC_API_URL=https://$DOMAIN/api"
echo ""
echo "3. Deploy updated configuration:"
echo "   just deploy-prod"
echo ""
echo "4. Test HTTPS:"
echo "   curl https://$DOMAIN"
echo ""
echo -e "${YELLOW}SSL Certificate Details:${NC}"
ssh $DEPLOY_USER@$DEPLOY_HOST "sudo certbot certificates"
