import { Stack, StackProps, Construct } from '@aws-cdk/core';
import { ContainerImage } from '@aws-cdk/aws-ecs';
import { ApplicationLoadBalancedFargateService } from '@aws-cdk/aws-ecs-patterns';
import { Role } from '@aws-cdk/aws-iam';

export class PocStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const image = ContainerImage.fromAsset("../example/sticky");

    const taskExecutionRole = Role.fromRoleArn(this, "taskRole", 
      "arn:aws:iam::231793983438:role/aws-service-role/ecs.amazonaws.com/AWSServiceRoleForECS");

    const fargateService = new ApplicationLoadBalancedFargateService(this, "PocService", {
      assignPublicIp: true,
      desiredCount: 2,
      cpu: 256,
      memoryLimitMiB: 512,
      taskImageOptions: {
        image: image,
        // TODO: change this role to include whatever permissions the app needs
        taskRole: taskExecutionRole,
        executionRole: taskExecutionRole
      },
    });
  }  
}