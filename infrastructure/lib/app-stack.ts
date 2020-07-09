import { Stack, StackProps, Construct } from '@aws-cdk/core';
import { ApplicationLoadBalancer, IpAddressType } from '@aws-cdk/aws-elasticloadbalancingv2';
import { Vpc, SecurityGroup, Port, Protocol, Peer } from '@aws-cdk/aws-ec2';

export class AppStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const defaultVpc = Vpc.fromLookup(this, "defaultVpc", {
      isDefault: true
    });

    const securityGroup = new SecurityGroup(this, "SG-DefaultExternal", {
      securityGroupName: "SG-DefaultExternal",
      description: "Default security group for external-facing web services",
      vpc: defaultVpc,
      allowAllOutbound: true,
    });

    const httpsPort = new Port({
      protocol: Protocol.TCP,
      fromPort: 443,
      toPort: 443,
      stringRepresentation: "HTTPS"
    })

    securityGroup.addIngressRule(Peer.anyIpv4(), httpsPort);
    securityGroup.addIngressRule(Peer.anyIpv6(), httpsPort);

    const gameServiceLB = new ApplicationLoadBalancer(this, "LB-GameService", {
      loadBalancerName: "LB-GameService",
      vpc: defaultVpc,
      internetFacing: true,
      ipAddressType: IpAddressType.IPV4,
      securityGroup: securityGroup,
    });
  }  
}