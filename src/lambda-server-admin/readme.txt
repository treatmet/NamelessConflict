Upload to lambda:
Create zip file from all code in src/lambda. (E.g.: index.zip)
aws lambda update-function-code --function-name gameServerAdmin --zip-file fileb://index.zip

Test Locally:
run "node index.js" in src/lambda
You will need to configure environment variables in a config.json file located in src/lambda-server-admin
