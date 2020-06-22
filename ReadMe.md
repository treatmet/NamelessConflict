# Nameless Conflict

## Debug and Run

1. Setup your AWS credentials
   1. Install the AWS CLI
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
