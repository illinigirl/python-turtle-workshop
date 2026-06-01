#!/usr/bin/env bash
# Build + deploy the Python Turtle Workshop to AWS (SAM).
# Static frontend files live at the repo root and are the single source of
# truth (shared with the Pi); we copy them into the Lambda package at build.
set -euo pipefail

export AWS_PROFILE="${AWS_PROFILE:-watchtower}"
export AWS_REGION="${AWS_REGION:-us-east-2}"
STACK="${STACK:-python-turtle-workshop}"

cd "$(dirname "$0")"
ROOT="$(cd .. && pwd)"

echo "==> staging static files into the Lambda package"
mkdir -p app/static
for f in index.html style.css lessons.js workshop.js insights.html; do
  cp "$ROOT/$f" "app/static/$f"
done

echo "==> sam build"
sam build

echo "==> sam deploy (stack: $STACK, region: $AWS_REGION)"
# Optional custom domain: set CERT_ARN + DOMAIN to enable. Only pass params that
# are actually set (empty "CertificateArn=" is rejected by sam).
PARAM_ARGS=()
[ -n "${CERT_ARN:-}" ] && PARAM_ARGS+=("CertificateArn=$CERT_ARN")
[ -n "${DOMAIN:-}" ] && PARAM_ARGS+=("DomainName=$DOMAIN")
sam deploy \
  --stack-name "$STACK" \
  --region "$AWS_REGION" \
  --resolve-s3 \
  --capabilities CAPABILITY_IAM \
  --no-confirm-changeset \
  --no-fail-on-empty-changeset \
  ${PARAM_ARGS:+--parameter-overrides "${PARAM_ARGS[@]}"}

URL=$(aws cloudformation describe-stacks --stack-name "$STACK" --region "$AWS_REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" --output text)
echo ""
echo "✅ Deployed. Open: $URL"

TARGET=$(aws cloudformation describe-stacks --stack-name "$STACK" --region "$AWS_REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='CustomDomainTarget'].OutputValue" --output text 2>/dev/null || true)
if [ -n "${TARGET:-}" ] && [ "$TARGET" != "None" ]; then
  echo "   Custom domain: point ${DOMAIN:-your subdomain} CNAME -> $TARGET (Cloudflare, DNS-only)"
fi
