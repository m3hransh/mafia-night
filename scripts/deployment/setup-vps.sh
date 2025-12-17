#!/bin/bash

# VPS Initial Setup Script for DigitalOcean
# Run this script on your VPS to prepare it for deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting VPS setup for Mafia Night...${NC}"

# Update system
echo -e "${YELLOW}Updating system packages...${NC}"
sudo apt-get update
sudo apt-get upgrade -y

# Install required packages
echo -e "${YELLOW}Installing prerequisite packages...${NC}"
sudo apt-get install -y ca-certificates curl gnupg git ufw

# Set up Docker's official GPG Key and Repository
echo -e "${YELLOW}Setting up Docker Repository...${NC}"
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Add the repository to Apt sources:
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update

# Install Docker Engine, CLI, and Compose Plugin
echo -e "${YELLOW}Installing Docker and Docker Compose Plugin...${NC}"
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add current user to docker group
if ! getent group docker > /dev/null; then
    sudo groupadd docker
fi
sudo usermod -aG docker $USER

# Configure firewall
echo -e "${YELLOW}Configuring firewall...${NC}"
sudo ufw --force enable
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw status

# Create deployment user
echo -e "${YELLOW}Creating deployment user...${NC}"
if ! id "deploy" &>/dev/null; then
    sudo useradd -m -s /bin/bash deploy
    sudo usermod -aG docker deploy
    sudo mkdir -p /home/deploy/.ssh

    echo -e "${YELLOW}Add your public SSH key to /home/deploy/.ssh/authorized_keys${NC}"
    
    sudo chown -R deploy:deploy /home/deploy/.ssh
    sudo chmod 700 /home/deploy/.ssh
else
    echo -e "${GREEN}Deploy user already exists${NC}"
fi

# Create deployment directory
echo -e "${YELLOW}Creating deployment directory...${NC}"
sudo mkdir -p /opt/mafia-night
sudo chown deploy:deploy /opt/mafia-night

# Enable Docker on boot
echo -e "${YELLOW}Enabling Docker services...${NC}"
sudo systemctl enable docker
sudo systemctl start docker

# Display versions
echo -e "${GREEN}Installation complete!${NC}"
echo -e "${YELLOW}Installed versions:${NC}"
docker --version
docker compose version

echo -e "${GREEN}VPS setup completed!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Add your SSH public key to /home/deploy/.ssh/authorized_keys"
echo "2. Create .env.production file locally"
echo "3. Run: ./scripts/deployment/deploy.sh"
echo ""
echo -e "${RED}IMPORTANT: Log out and log back in (or run 'newgrp docker') for group changes to take effect.${NC}"
