# Remotion Lambda Deployment Guide

This guide explains how to deploy your Remotion Lambda site when you update or add templates.

---

## 🚀 How to Deploy Remotion Lambda for Updated Templates

### 1. Update Your Remotion Project
- Make changes in the Remotion project (e.g., add or update templates in `remotion/src/compositions/` and register them in `remotion/src/Root.tsx`).

### 2. Build the Remotion Site
```sh
cd remotion
npm install
npm run build
```

### 3. Deploy the Remotion Site to Lambda
If you haven’t installed the Remotion Lambda CLI:
```sh
npm install -g @remotion/lambda
```

Then deploy your site:
```sh
remotion lambda sites deploy --region=us-east-1 --site-name=aiaio3-lullaby
```
- Replace `aiaio3-lullaby` with your preferred site name if needed.
- The CLI will output a new **Serve URL** (e.g., `https://remotionlambda-useast1-xxxx.s3.us-east-1.amazonaws.com/sites/xxxx/index.html`).

### 4. Update Lambda Function (if needed)
If you want to update the Lambda function code or settings, redeploy it:
```sh
remotion lambda functions deploy --region=us-east-1
```
- Usually, you only need to do this if you change Lambda settings or upgrade Remotion.

### 5. Update Environment Variables
Update your `.env` or deployment environment variables to use the new Serve URL:
```
REMOTION_SITE_URL=<your new serve URL>
AWS_LAMBDA_REMOTION_FUNCTION=<your lambda function name>
AWS_REGION=us-east-1
AWS_S3_VIDEO_BUCKET=<your bucket name>
REMOTION_WEBHOOK_URL=<your webhook endpoint, e.g. https://yourdomain.com/api/videos/webhook>
```
- Make sure your backend/API is using the new Serve URL for all render requests.

### 6. Test a Render
- Use your admin UI or an API call to trigger a new render.
- Confirm the new template or changes are reflected in the output video.

### 7. (Optional) Clean Up Old Sites
You can remove old Remotion Lambda sites if you no longer need them:
```sh
remotion lambda sites ls --region=us-east-1
remotion lambda sites rm --region=us-east-1 --site-id=<site-id>
```

---

## 📝 Summary Checklist
- [ ] Update code in `remotion/`
- [ ] `npm run build` in `remotion/`
- [ ] `remotion lambda sites deploy ...`
- [ ] Update `.env`/environment with new Serve URL
- [ ] Test a render
- [ ] (Optional) Remove old sites

---

**Need help?**
- Ask for a script to automate these steps
- Get help with Lambda permissions, environment variables, or debugging 