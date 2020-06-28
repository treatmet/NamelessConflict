import { Stack, StackProps, Construct } from '@aws-cdk/core';
import { ApplicationLoadBalancer } from '@aws-cdk/aws-elasticloadbalancingv2';
import { Vpc } from '@aws-cdk/aws-ec2';

export class AppStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const defaultVpc = Vpc.fromLookup(this, "defaultVpc", {
      isDefault: true
    });
  }  
}