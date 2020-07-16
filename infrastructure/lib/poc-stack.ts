import { Stack, StackProps, Construct } from '@aws-cdk/core';
import { ContainerImage } from '@aws-cdk/aws-ecs';
import { ApplicationLoadBalancedFargateService } from '@aws-cdk/aws-ecs-patterns';

export class PocStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const image = ContainerImage.fromAsset("../example/sticky");

    const fargateService = new ApplicationLoadBalancedFargateService(this, "PocService", {
      assignPublicIp: true,
      desiredCount: 2,
      cpu: 256,
      memoryLimitMiB: 512,
      taskImageOptions: {
        image: image
      }
    });
  }  
}