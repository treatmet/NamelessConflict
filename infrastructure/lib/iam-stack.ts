import { Stack, Construct, StackProps } from '@aws-cdk/core';
import { PolicyStatement, Effect, ManagedPolicy, Group, User } from '@aws-cdk/aws-iam';
import {createEc2Role} from './iam/role';

export class IamStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    var accessKeyPolicy = new ManagedPolicy(this, "Policy-IamSelfManageAccessKeys", {
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

    var opsGroup = new Group(this, "Group-Ops", {
      groupName: "Ops",
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName("ReadOnlyAccess"),
        ManagedPolicy.fromAwsManagedPolicyName("IAMUserChangePassword"),
        accessKeyPolicy,
        ManagedPolicy.fromAwsManagedPolicyName("AWSCloudFormationFullAccess"),
        ManagedPolicy.fromAwsManagedPolicyName("AmazonEC2FullAccess"),
        ManagedPolicy.fromAwsManagedPolicyName("AmazonS3FullAccess"),
        ManagedPolicy.fromAwsManagedPolicyName("CloudWatchFullAccess"),
        ManagedPolicy.fromAwsManagedPolicyName("AmazonCognitoPowerUser"),
        ManagedPolicy.fromAwsManagedPolicyName("AmazonECS_FullAccess"),
      ]
    });

    new User(this, "User-PrestonRobertson", {
      userName: "PrestonRobertson",
      groups: [opsGroup]
    });

    var s3LogBucketPolicy = new ManagedPolicy(this, "Policy-S3LogBucketPolicy", {
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