# Adding S3 List Permissions for Video Browser

## Current Issue
Your AWS IAM user `remotion-user` only has permissions to upload files to S3, but not to list the contents of the bucket. To enable the S3 browser functionality, you need to add list permissions.

## Step 1: Find Your Current IAM Policy

1. Go to the AWS Console → IAM → Users
2. Find and click on `remotion-user`
3. Look at the "Permissions" tab
4. You should see a policy attached (probably inline or managed)

## Step 2: Add the Required Permissions

You need to add these permissions to your existing policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:PutObjectAcl",
                "s3:GetObject",
                "s3:GetObjectAcl",
                "s3:DeleteObject",
                "s3:ListBucket",
                "s3:GetBucketLocation"
            ],
            "Resource": [
                "arn:aws:s3:::aiaio3-public-videos",
                "arn:aws:s3:::aiaio3-public-videos/*"
            ]
        }
    ]
}
```

## Step 3: Update Your Policy

### Option A: If you have an inline policy
1. Click on the policy name
2. Click "Edit policy"
3. Add the new permissions to the existing policy
4. Save changes

### Option B: If you have a managed policy
1. IAM → Policies → Find your policy
2. Click "Edit policy"
3. Add the new permissions
4. Save changes

### Option C: Create a new policy (recommended)
1. IAM → Policies → Create policy
2. Use the JSON editor and paste the policy above
3. Name it something like `S3VideosBucketFullAccess`
4. Attach it to your `remotion-user`

## Step 4: Test the Permissions

After updating the permissions:

1. Wait 1-2 minutes for AWS to propagate the changes
2. Refresh your S3 browser page at `/admin/s3-browser`
3. You should see the message change from "Video files loaded from database" to "Files loaded directly from S3 bucket"
4. You should be able to see all files in your S3 bucket, including any that might not be in your database

## What Each Permission Does

- `s3:ListBucket`: Allows listing objects in the bucket (needed for the browser)
- `s3:GetBucketLocation`: Allows getting the bucket region
- `s3:PutObject`: Upload files (you already have this)
- `s3:GetObject`: Download/view files (you already have this)
- `s3:GetObjectAcl`: Get file permissions
- `s3:PutObjectAcl`: Set file permissions
- `s3:DeleteObject`: Delete files (useful for cleanup)

## Security Note

These permissions are scoped to only your specific bucket (`aiaio3-public-videos`), so they won't affect any other S3 buckets in your AWS account.

## Alternative: Minimal Permissions

If you want to be more restrictive, you can add just the list permissions:

```json
{
    "Effect": "Allow",
    "Action": [
        "s3:ListBucket",
        "s3:GetBucketLocation"
    ],
    "Resource": [
        "arn:aws:s3:::aiaio3-public-videos"
    ]
}
```

Add this as a separate statement to your existing policy.
