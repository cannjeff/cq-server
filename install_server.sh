#!/bin/bash

echo "Stopping server..."
forever stop cq-server.js

echo "Removing node_modules..."
rm -r node_modules

echo "Cleaning npm cache..."
npm cache clean

echo "Installing dependencies..."
npm install

echo "Starting server..."
forever start cq-server.js

echo "Done!"
