# Nameless Conflict

## Debug and Run

1. Setup your AWS credentials
   1. Install the [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2-windows.html)s
   1. Run `aws configure`
   1. Enter in your 2-part security credentials (available [here](https://console.aws.amazon.com/iam/home#/security_credentials))
1. Create a file at the root directory called `config.ini`. Contents should look like the following:
    ```ini
    mongoDbLocation=MONGO_DB_CONNECTION_STRING
    s3LoggingBucket=rw3000-logs
    ```
1. Open VS Code
1. Select `Web Server` or `Game Server`
   * These options are specified in `.vscode/launch.json`
1. Click the green triangle to start debugging

## Infrastructure

The `infrastructure/` folder defines all the AWS resources in the form of TypeScript using CDK.

### How to deploy

1. `npm install -g cdk`   if you haven't installed CDK
1. `cd infrastructure`    if you're not in the directory
1. `npm run build`
1. `cdk diff`             see what's going to change before doing it
1. `cdk deploy`
