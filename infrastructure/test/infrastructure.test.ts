import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import cdk = require('@aws-cdk/core');
import Infrastructure = require('../lib/iam-stack');

test('IAM Stack', () => {
    const app = new cdk.App();

    // WHEN
    const stack = new Infrastructure.IamStack(app, 'MyTestStack');

    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});