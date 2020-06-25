import cdk = require('@aws-cdk/core');
import iam = require('@aws-cdk/aws-iam');
import { PolicyStatement, Effect } from '@aws-cdk/aws-iam';

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
  }  
}