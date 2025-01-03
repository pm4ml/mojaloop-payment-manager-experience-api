#!/bin/bash
set -e

# Setup steps
echo "Setting up the environment for functional tests..."

# Run functional tests
echo "Running functional tests..."
npm run test:functional

# Teardown steps
echo "Cleaning up after functional tests..."