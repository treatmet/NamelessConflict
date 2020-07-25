const aws = require("aws-sdk");

const s3  = new aws.S3();
const eb = new aws.ElasticBeanstalk();

const app = "";
const version = "";

const bucketName = "";
const bucketKey = `${app}/${version}.zip`;

async function deploy() {
  await s3.upload({
    Bucket: bucketName,
    Key = bucketKey 
  });

  await eb.createApplicationVersion({
    ApplicationName = "ebs-node-poc",
    VersionLabel = "0.4",
    SourceBundle = {
      S3Bucket = "",
      S3Key = ""
    }
  }).promise();
}

deploy();

