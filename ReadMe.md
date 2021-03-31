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

The `infrastructure/` folder defines all the AWS resources in the form of TypeScript using CDK (see the [API reference](https://docs.aws.amazon.com/cdk/api/latest/docs/aws-construct-library.html)).

## How to Deploy using Beanstalk
1. Install [EB CLI](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/eb-cli3-install-advanced.html) (Note the compatibility notes. If you have trouble installing, try EB CLI version 3.14.5 or earlier.) (If YAML errors, try: pip install PyYAML==3.11)
1. `cd src`
1. Run `eb deploy`

### How to deploy (OBSOLETE)
1. `npm install -g cdk`   if you haven't installed CDK
1. `cd infrastructure`    if you're not in the directory
1. `npm run build`
1. `cdk diff`             see what's going to change before doing it
1. `cdk deploy`


## Configuring an EC2 instance from Scratch

1. FTP files onto EC2
1. download and install npm
1. npm install nodejs
1. npm install

### Install pm2 to automate server startup
1. sudo su
1. curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.2/install.sh | bash
1. nvm install 12.10.0
1. npm install -g pm2
1. pm2 start app.js -f -- 3001
1. pm2 start app.js -f -- 3002 (etc for however many ports you want to run on a single server)
1. pm2 startup (Gets startup script - run the result in terminal)
1. pm2 save

### Stop app from auto running on ec2 startup:
1. pm2 unstartup systemv
