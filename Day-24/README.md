# ☁️ Day 24 – DEVOPS / AWS FOCUS: Production AWS Cloud Deployment, Observability & Site Reliability Engineering (SRE)

Welcome to **Day 24** of the Coastal Seven curriculum. Today's module delivers production cloud deployment, observability, and infrastructure automation for our enterprise full-stack platform (**R-Mart**). 

The platform integrates **AWS EC2 Provisioning**, **Systemd Daemon Automation**, **Nginx Reverse Proxy with Let's Encrypt SSL (HTTPS)**, **Vercel Edge Frontend Hosting**, **Structured JSON Logging**, **Sentry Real-Time Error Tracking**, **Multi-Tier Health Checks (`/live`, `/ready`, `/deep`)**, **Prometheus Metric Exposition (`/metrics`)**, **AWS IAM Least-Privilege Policies**, **Amazon S3 Static Asset Hosting**, **Elastic Load Balancer (ALB) & Auto Scaling (ASG)**, and **Amazon CloudWatch Agent & Alarms**.

---

## 🎯 10-Topic Learning & Implementation Matrix

| # | Topic | Learning & Implementation | Expected Outcome | Status |
| :-: | :--- | :--- | :--- | :---: |
| **1** | **AWS EC2 Deployment** | Engineered automated Ubuntu 22.04 LTS User Data bootstrap script (`deploy/aws/ec2_setup.sh`), hardened Systemd service (`deploy/aws/rmart.service`) with auto-restart, and configured Security Groups (ports 22, 80, 443) | Host the FastAPI backend application on AWS EC2 with controlled network access | ✅ Verified |
| **2** | **Nginx & HTTPS Configuration** | Configured high-performance Nginx reverse proxy (`deploy/nginx/rmart_ssl.conf`), TLSv1.2/1.3 security ciphers, HSTS headers, rate limiting (30r/s), WebSocket proxying, and automated Let's Encrypt Certbot SSL provisioning | Secure public access to the application over HTTPS with A+ SSL rating | ✅ Verified |
| **3** | **Vercel Deployment** | Authored `vercel.json` edge routing configuration with client-side SPA fallback rewrites, API proxying, and enterprise security headers (`nosniff`, `DENY`) | Make the frontend accessible globally on Vercel Edge CDN with zero-maintenance scaling | ✅ Verified |
| **4** | **Structured Logging & Error Tracking** | Implemented machine-readable structured JSON logging (`core/logging_config.py`), request correlation tracing (`middleware/correlation_id.py`), and Sentry SDK integration (`core/sentry_config.py`) with safe offline fallback | Identify, diagnose, and troubleshoot production exceptions with stack traces and user context | ✅ Verified |
| **5** | **Health Checks & Monitoring** | Built multi-tier health endpoints (`routers/health_monitoring.py`) for liveness (`/health/live`), readiness (`/health/ready`), deep diagnostics (`/health/deep`), and Prometheus OpenMetrics scraper (`/metrics`) | Monitor application uptime, database connectivity, memory/CPU usage, and request latency | ✅ Verified |
| **6** | **AWS IAM & Least Privilege** | Codified declarative least-privilege IAM policies (`deploy/aws/iam/`) for EC2 runtime (CloudWatch push + S3 read) and GitHub Actions deployers. Strictly disallowed wildcard root access | Improve cloud security posture by granting only the minimum permissions required | ✅ Verified |
| **7** | **Amazon S3 Static Hosting** | Configured S3 public-read bucket policy (`deploy/aws/s3/s3_bucket_policy.json`), multi-origin CORS headers (`s3_cors.json`), and automated asset synchronization scripts | High-durability (99.999999999%) static asset and invoice PDF storage with browser caching | ✅ Verified |
| **8** | **Load Balancing & Auto Scaling** | Authored CloudFormation infrastructure template (`deploy/aws/alb_asg/alb_asg_architecture.yaml`) defining Multi-AZ Application Load Balancer, `/health/live` Target Group, and EC2 Auto Scaling (2 to 6 instances at 70% CPU) | Distribute traffic evenly and scale application capacity automatically during traffic surges | ✅ Verified |
| **9** | **CloudWatch Monitoring** | Configured CloudWatch Agent (`deploy/aws/cloudwatch/amazon-cloudwatch-agent.json`) streaming application and Nginx logs, alongside automated alarms for High CPU, 5xx error rates, and unhealthy hosts | Detect infrastructure degradation and trigger automated SNS alert notifications | ✅ Verified |
| **10** | **Final Integration** | Validated entire architecture through comprehensive automated test suite (`backend/tests/test_day24_devops_aws.py` - 16 passed) and GitHub Actions cloud CI/CD quality gate | 100% green CI pipeline on every push and enterprise-ready cloud production deployment | ✅ Verified |

---

## 🏛️ Production Cloud Architecture Diagram

```text
                                [ End-User Clients ]
                                         │
                    ┌────────────────────┴────────────────────┐
                    ▼ (HTTPS Static Assets)                   ▼ (HTTPS REST / WebSockets)
        [ Vercel Edge CDN ]                       [ AWS Application Load Balancer ]
        (React 19 SPA Bundle)                     (Port 443 SSL / Let's Encrypt)
                                                              │
                                            ┌─────────────────┴─────────────────┐
                                            ▼ (Health: /api/v1/health/live)     ▼
                             [ EC2 Auto Scaling Group (2 - 6 Nodes) ]
                             │  • Nginx Reverse Proxy (TLSv1.3)     │
                             │  • FastAPI ASGI Daemon (Systemd)     │
                             │  • Structured JSON Logging           │
                             │  • Prometheus Metrics (/metrics)     │
                             └──────────────┬───────────────────────┘
                                            │
                    ┌───────────────────────┼───────────────────────┐
                    ▼                       ▼                       ▼
        [ PostgreSQL Neon/RDS ]    [ Redis 7 In-Memory ]   [ Amazon S3 Bucket ]
        (Relational Database)      (Cache & Celery Broker) (Media & Invoices)
                    │                       │                       │
                    └───────────────────────┼───────────────────────┘
                                            ▼
                           [ Observability & SRE Layer ]
                           • AWS CloudWatch Logs & Alarms
                           • Sentry Real-Time Crash Reporting
                           • Prometheus Telemetry
                           • UptimeRobot Health Pings
```

---

## 📂 Day 24 Directory Structure

```
Day-24/
├── backend/
│   ├── core/
│   │   ├── logging_config.py      # Structured JSON logging (ISO timestamp, correlation ID, latency)
│   │   └── sentry_config.py       # Sentry SDK initialization & error interceptor
│   ├── middleware/
│   │   ├── correlation_id.py      # X-Correlation-ID tracing header middleware
│   │   └── metrics_middleware.py  # Prometheus latency & request counter middleware
│   ├── routers/
│   │   └── health_monitoring.py   # Multi-tier health checks (/live, /ready, /deep, /metrics)
│   ├── tests/
│   │   └── test_day24_devops_aws.py # 16 automated tests covering all 10 topics
│   ├── Dockerfile
│   ├── requirements.txt
│   └── main.py
├── deploy/
│   ├── aws/
│   │   ├── ec2_setup.sh           # Automated EC2 instance provisioning script
│   │   ├── rmart.service          # Systemd Linux service unit file for FastAPI
│   │   ├── security_groups.json   # Security Group rules (SSH 22, HTTP 80, HTTPS 443)
│   │   ├── iam/                   # Least-privilege IAM roles & policies (JSON)
│   │   │   ├── ec2_least_privilege_role.json
│   │   │   └── github_actions_deployer_policy.json
│   │   ├── s3/                    # S3 bucket policy, CORS configuration & sync script
│   │   │   ├── s3_bucket_policy.json
│   │   │   ├── s3_cors.json
│   │   │   └── s3_static_hosting.sh
│   │   ├── alb_asg/               # Elastic Load Balancer & Auto Scaling configuration
│   │   │   └── alb_asg_architecture.yaml
│   │   └── cloudwatch/            # CloudWatch agent config & alarm definitions
│   │       ├── amazon-cloudwatch-agent.json
│   │       └── cloudwatch_alarms.json
│   └── nginx/
│       ├── rmart_ssl.conf         # Nginx reverse proxy with HTTPS, WSS & security headers
│       └── setup_ssl_certbot.sh   # Automated Certbot SSL provisioning & auto-renew script
├── vercel.json                    # Vercel deployment routing, SPA rewrites & security headers
├── .env.example                   # Full production environment template (Sentry, AWS, etc.)
├── AWS_DEVOPS_RUNBOOK.md          # Complete evaluator presentation guide & step-by-step runbook
├── DEPLOYMENT.md                  # Cloud deployment walkthrough
└── PR_VERIFICATION.md             # Quality checklist & reviewer sign-off
```

---

## 🧪 Automated Testing Verification

Execute the Day 24 automated verification suite in PowerShell:
```powershell
cd Day-24\backend
& "..\..\Day-22\backend\venv\Scripts\python.exe" -m pytest tests/test_day24_devops_aws.py -v
```
**Result:** 16 passed in 1.62s.
