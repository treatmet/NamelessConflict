#!/usr/bin/env node
import 'source-map-support/register';
import { App }  from '@aws-cdk/core';
import { IamStack } from '../lib/iam-stack';
import { AppStack } from '../lib/app-stack';
import { PocStack } from '../lib/poc-stack';

const app = new App();

const defaultStackProps = {
  env: {
    account: "231793983438",
    region: "us-east-2"
  }
};

new IamStack(app, 'IamStack', defaultStackProps);
new AppStack(app, 'AppStack', defaultStackProps);
new PocStack(app, 'PocStack', defaultStackProps);
