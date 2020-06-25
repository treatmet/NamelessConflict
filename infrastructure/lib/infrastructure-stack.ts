import cdk = require('@aws-cdk/core');
import iam = require('@aws-cdk/aws-iam');
import { PolicyStatement, Effect } from '@aws-cdk/aws-iam';

export class InfrastructureStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    var credentialSelfManagementPolicy = new iam.Policy(scope, "credentialSelfManagementPolicy", {
      policyName: "CredentialSelfManagement",
      statements: [
        new PolicyStatement({
          sid: "AllowViewAccountInfo",
          effect: Effect.ALLOW,
          actions: [
            "iam:GetAccountPasswordPolicy",
            "iam:GetAccountSummary"
          ],
          resources: ["*"]
        }),
        new PolicyStatement({
          sid: "AllowManageOwnPasswords",
          effect: Effect.ALLOW,
          actions: [
            "iam:ChangePassword",
            "iam:GetUser"
          ],
          resources: ["arn:aws:iam::*:user/${aws:username}"]
        }),
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
        }),
        new PolicyStatement({
            sid: "AllowManageOwnSSHPublicKeys",
            effect: Effect.ALLOW,
            actions: [
              "iam:DeleteSSHPublicKey",
              "iam:GetSSHPublicKey",
              "iam:ListSSHPublicKeys",
              "iam:UpdateSSHPublicKey",
              "iam:UploadSSHPublicKey"
            ],
            resources: ["arn:aws:iam::*:user/${aws:username}"]
        })
      ]
    });

    var iamReadonlyPolicy = iam.ManagedPolicy.fromAwsManagedPolicyName("IAMReadOnlyAccess");

    var opsGroup = new iam.Group(scope, "opsGroup", {
      groupName: "Ops"
    })

    opsGroup.addManagedPolicy(iamReadonlyPolicy);
    opsGroup.attachInlinePolicy(credentialSelfManagementPolicy);

    opsGroup.addUser(iam.User.fromUserName(scope, "userPreston", "Preston"));
  }
}
