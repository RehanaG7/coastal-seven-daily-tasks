#!/usr/bin/env bash
# ==============================================================================
# Day 24 DevOps / AWS Focus: Amazon S3 Static Hosting & Asset Sync Automation
# ==============================================================================

set -euo pipefail

BUCKET_NAME="${1:-rmart-static-assets-2026}"
REGION="${2:-us-east-1}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=================================================="
echo "Configuring Amazon S3 Static Hosting: $BUCKET_NAME"
echo "=================================================="

# 1. Create S3 Bucket if it doesn't already exist
if ! aws s3api head-bucket --bucket "$BUCKET_NAME" 2>/dev/null; then
    echo "Creating S3 bucket: $BUCKET_NAME in $REGION..."
    if [ "$REGION" = "us-east-1" ]; then
        aws s3api create-bucket --bucket "$BUCKET_NAME" --region "$REGION"
    else
        aws s3api create-bucket --bucket "$BUCKET_NAME" --region "$REGION" \
            --create-bucket-configuration LocationConstraint="$REGION"
    fi
fi

# 2. Disable Block Public Access for static web delivery
aws s3api put-public-access-block \
    --bucket "$BUCKET_NAME" \
    --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

# 3. Apply Public Read Bucket Policy
aws s3api put-bucket-policy \
    --bucket "$BUCKET_NAME" \
    --policy "file://$SCRIPT_DIR/s3_bucket_policy.json"

# 4. Apply CORS Configuration
aws s3api put-bucket-cors \
    --bucket "$BUCKET_NAME" \
    --cors-configuration "file://$SCRIPT_DIR/s3_cors.json"

# 5. Enable Static Website Hosting
aws s3 website "s3://$BUCKET_NAME" \
    --index-document index.html \
    --error-document index.html

# 6. Synchronize production assets with gzip caching
echo "Syncing compiled frontend static assets..."
if [ -d "$SCRIPT_DIR/../../../dist" ]; then
    aws s3 sync "$SCRIPT_DIR/../../../dist" "s3://$BUCKET_NAME" \
        --delete \
        --cache-control "max-age=31536000,public,immutable"
fi

echo "S3 Static Website URL: http://$BUCKET_NAME.s3-website-$REGION.amazonaws.com"
