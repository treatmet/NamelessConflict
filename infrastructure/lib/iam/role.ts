import cdk = require('@aws-cdk/core');
import iam = require('@aws-cdk/aws-iam');
import {IManagedPolicy, PolicyDocument} from '@aws-cdk/aws-iam';

/**
 * Properties for defining an EC2 IAM Role
 */
export interface Ec2RoleProps {
  /**
   * A name for the IAM role.
   */
  readonly name: string;
  /**
   * A list of managed policies associated with this role.
   *
   * You can add managed policies later using
   * `addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName(policyName))`.
   *
   * @default - No managed policies.
   */
  readonly managedPolicies?: IManagedPolicy[];
  /**
   * A list of named policies to inline into this role. These policies will be
   * created with the role, whereas those added by ``addToPolicy`` are added
   * using a separate CloudFormation resource (allowing a way around circular
   * dependencies that could otherwise be introduced).
   *
   * @default - No policy is inlined in the Role resource.
   */
  readonly inlinePolicies?: {
      [name: string]: PolicyDocument;
  };
  /**
   * AWS supports permissions boundaries for IAM entities (users or roles).
   * A permissions boundary is an advanced feature for using a managed policy
   * to set the maximum permissions that an identity-based policy can grant to
   * an IAM entity. An entity's permissions boundary allows it to perform only
   * the actions that are allowed by both its identity-based policies and its
   * permissions boundaries.
   *
   * @link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-iam-role.html#cfn-iam-role-permissionsboundary
   * @link https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_boundaries.html
   *
   * @default - No permissions boundary.
   */
  readonly permissionsBoundary?: IManagedPolicy;
  
  /**
   * A description of the role. It can be up to 1000 characters long.
   *
   * @default - No description.
   */
  readonly description?: string;
}

export function createEc2Role(scope: cdk.Construct, props: Ec2RoleProps) {
  var role = new iam.Role(scope, `Role-${props.name}`, {
    roleName: `EC2-${props.name}`,
    assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
    description: props.description,
    managedPolicies: props.managedPolicies,
    inlinePolicies: props.inlinePolicies,
    permissionsBoundary: props.permissionsBoundary
  });

  new iam.CfnInstanceProfile(scope, `InstanceProfile-${props.name}`, {
    instanceProfileName: `EC2-${props.name}`,
    roles: [role.roleName],
  });
}