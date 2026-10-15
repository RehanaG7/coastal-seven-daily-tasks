# 🚀 Day 24: Production Cloud Deployment & AWS Infrastructure Guide

This guide details how to deploy the **R-Mart** full-stack architecture to **AWS (Amazon Web Services)** and **Vercel Edge CDN**.

---

## 🏗️ 1. Cloud Architecture Overview

```text
                       [ Internet Users ]
                                │
               ┌────────────────┴────────────────┐
               ▼                                 ▼
      [ Vercel Edge CDN ]           [ AWS Route 53 (DNS) ]
     (React 19 Frontend)                         │
               │                                 ▼
               │                [ Application Load Balancer (ALB) ]
               │                (HTTPS Port 443 / SSL Termination)
               │                                 │
               │                    ┌────────────┴────────────┐
               │                    ▼                         ▼
               │          [ EC2 Instance 1 ]        [ EC2 Instance 2 ]
               │          (Nginx + FastAPI)         (Nginx + FastAPI)
               │                    │                         │
               └────────────────────┼─────────────────────────┘
                                    ▼
                         [ Shared Data Services ]
                         • PostgreSQL (Neon / RDS)
                         • Redis 7 Cache & Broker
                         • Amazon S3 Static Assets
                         • AWS CloudWatch & Sentry
```

---

## 💻 2. Step-by-Step Deployment Instructions

### A. Frontend Deployment (Vercel)
1. Ensure [`Day-24/vercel.json`](vercel.json) is committed to your repository.
2. Log into [Vercel](https://vercel.com) using your GitHub account (`RehanaG7`).
3. Import the `coastal-seven-daily-tasks` repository.
4. Set the **Root Directory** to `Day-24`.
5. Configure Environment Variables:
   - `VITE_API_URL`: `https://api.rmart.store/api/v1` (or your EC2/ALB domain)
   - `VITE_WS_URL`: `wss://api.rmart.store/ws`
6. Click **Deploy**. Vercel will build and host the app at `https://coastal-seven-daily-tasks-rehanag7.vercel.app`.

---

### B. Backend Deployment (AWS EC2)
1. **Launch EC2 Instance:**
   - AMI: Ubuntu Server 22.04 LTS (x86_64)
   - Instance Type: `t3.medium` (or `t3.small`)
   - Security Group: Attach rules from [`deploy/aws/security_groups.json`](deploy/aws/security_groups.json) (allow ports 22, 80, 443).
2. **Bootstrap via User Data:**
   - In Advanced Details ➔ User Data, paste the script from [`deploy/aws/ec2_setup.sh`](deploy/aws/ec2_setup.sh).
3. **Attach IAM Role:**
   - Attach an IAM role using [`deploy/aws/iam/ec2_least_privilege_role.json`](deploy/aws/iam/ec2_least_privilege_role.json) to allow CloudWatch log streaming and S3 reads.
4. **Configure HTTPS & Certbot:**
   - SSH into the instance:
     ```bash
     ssh -i your-key.pem ubuntu@your-ec2-ip
     sudo bash /opt/rmart/Day-24/deploy/nginx/setup_ssl_certbot.sh api.yourdomain.com your-email@example.com
     ```
5. **Verify Service Health:**
   ```bash
   curl -i http://localhost:8000/api/v1/health/live
   curl -i http://localhost:8000/metrics
   ```

---

### C. Observability & Monitoring Setup
1. **Sentry Error Tracking:** Set `SENTRY_DSN` in `/etc/rmart/.env`.
2. **CloudWatch Agent:** Run `/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/opt/rmart/Day-24/deploy/aws/cloudwatch/amazon-cloudwatch-agent.json`.
3. **UptimeRobot:** Create an HTTP(s) monitor pointing to `https://api.yourdomain.com/api/v1/health/live` with a 60-second polling interval.
