#!/bin/bash

# Update and Install Dependencies
echo "Updating system and installing required packages..."
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y curl wget gnupg2 lsb-release ca-certificates

# Install Node.js and NPM
echo "Installing Node.js and NPM..."
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
echo "Installing PM2..."
sudo npm install -g pm2

# Install Git
echo "Installing Git..."
sudo apt-get install -y git

# Clone the Repository from GitHub
echo "Cloning the repository..."
git clone https://github.com/Kennno/Wireguard-VPN-API.git /root/vpn-api
cd /root/vpn-api

# Install project dependencies
echo "Installing project dependencies..."
npm install

# Set up SSL certificates directory
echo "Creating certs directory..."
mkdir -p /root/vpn-api/certs

# Set environment variables by copying the .env.example to .env
echo "Setting up environment variables..."
cp .env.example .env

# Start the VPN API
echo "Starting VPN API with PM2..."
pm2 start /root/vpn-api/index.js --name vpn-api

# Ensure PM2 restarts on boot
echo "Setting up PM2 to restart on boot..."
pm2 startup
pm2 save

echo "Setup complete!"
