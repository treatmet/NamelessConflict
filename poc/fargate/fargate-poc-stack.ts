import { Stack, StackProps, Construct } from '@aws-cdk/core';
import { ContainerImage } from '@aws-cdk/aws-ecs';
import { ApplicationLoadBalancedFargateService } from '@aws-cdk/aws-ecs-patterns';
import { Role } from '@aws-cdk/aws-iam';
import { Vpc } from '@aws-cdk/aws-ec2';

export class FargatePocStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const image = ContainerImage.fromAsset("../example/sticky");

    const defaultVpc = Vpc.fromLookup(this, "defaultVpc", {
      isDefault: true
    });

    const fargateService = new ApplicationLoadBalancedFargateService(this, "PocService", {
      assignPublicIp: true,
      desiredCount: 2,
      cpu: 256,
      memoryLimitMiB: 512,
      vpc: defaultVpc,
      taskImageOptions: {
        image: image,
        enableLogging: false
      },
    });
  }  
}