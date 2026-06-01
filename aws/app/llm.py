"""Bedrock helper — Claude via invoke_model. No external API keys (IAM-based)."""
import json
import os

import boto3
from botocore.config import Config

REGION = os.environ.get("AWS_REGION", "us-east-2")
_rt = boto3.client(
    "bedrock-runtime", region_name=REGION,
    config=Config(retries={"max_attempts": 4, "mode": "adaptive"}),
)


def chat(messages, system, model, max_tokens=700):
    """Single completion. `messages` is [{role, content}], returns plain text."""
    body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": max_tokens,
        "messages": messages,
    }
    if system:
        body["system"] = system
    resp = _rt.invoke_model(modelId=model, body=json.dumps(body))
    out = json.loads(resp["body"].read())
    return "".join(b.get("text", "") for b in out.get("content", []) if b.get("type") == "text").strip()
