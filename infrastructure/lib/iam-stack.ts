import cdk = require('@aws-cdk/core');
import iam = require('@aws-cdk/aws-iam');
import { PolicyStatement, Effect } from '@aws-cdk/aws-iam';
import {createEc2Role} from './iam/role';

export class IamStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    var accessKeyPolicy = new iam.ManagedPolicy(this, "Policy-IamSelfManageAccessKeys", {
      managedPolicyName: "IamSelfManageAccessKeys",
      statements: [
        new PolicyStatement({
            sid: "AllowManageOwnAccessKeys",
            effect: Effect.ALLOW,
            actions: [
                "iam:CreateAccessKey",
                "iam:DeleteAccessKey",
                "iam:ListAccessKeys",
                "iam:UpdateAccessKey"
            ],
            resources: ["arn:aws:iam::*:user/${aws:username}"]
        })
      ]
    });

    
    var opsGroup = new iam.Group(this, "Group-Ops", {
      groupName: "Ops",
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName("ReadOnlyAccess"),
        iam.ManagedPolicy.fromAwsManagedPolicyName("IAMUserChangePassword"),
        accessKeyPolicy,
        iam.ManagedPolicy.fromAwsManagedPolicyName("AWSCloudFormationFullAccess"),
        iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonEC2FullAccess"),
        iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonS3FullAccess"),
        iam.ManagedPolicy.fromAwsManagedPolicyName("CloudWatchFullAccess"),
        iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonCognitoPowerUser"),
      ]
    });

    new iam.User(this, "User-PrestonRobertson", {
      userName: "PrestonRobertson",
      groups: [opsGroup]
    });

    var s3LogBucketPolicy = new iam.ManagedPolicy(this, "Policy-S3LogBucketPolicy", {
      managedPolicyName: "S3LogBucketPolicy",
      statements: [
        new PolicyStatement({
            effect: Effect.ALLOW,
            actions: [
                "s3:PutObject",
                "s3:GetObject",
                "s3:ListBucket",
            ],
            resources: [
              "arn:aws:s3:::rw3000-logs",
              "arn:aws:s3:::rw3000-logs/*",
            ]
        })
      ]
    });

    createEc2Role(this, {
      name: "AdminService",
      description: "The IAM role for the admin service",
      managedPolicies: [
        s3LogBucketPolicy
      ]
    });

    createEc2Role(this, {
      name: "GameService",
      description: "The IAM role for the game service",
      managedPolicies: [
        s3LogBucketPolicy
      ]
    });
  }  
}