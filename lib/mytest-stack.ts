import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as aws_s3_deployment from 'aws-cdk-lib/aws-s3-deployment';
import * as pipelines from 'aws-cdk-lib/pipelines';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as codecommit from 'aws-cdk-lib/aws-codecommit'
// import * as sqs from 'aws-cdk-lib/aws-sqs';


const app = new cdk.App();

export class BucketStack extends cdk.Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id);
    const encryptionKey = new kms.Key(this, 'ArtifactsBucketEncryptionKey');
    const bucket = new s3.Bucket(this, 'MyFirstBucket', {
      encryptionKey,
      encryption: s3.BucketEncryption.KMS,
    });
    new aws_s3_deployment.BucketDeployment(this, 'BucketDeployment', {
      destinationBucket: bucket,
      sources: [aws_s3_deployment.Source.asset('lib')]
    });

  }

}
class MyApplication extends cdk.Stage {
  constructor(scope: Construct, id: string, props?: cdk.StageProps) {
    super(scope, id, props);

    new BucketStack(this, 'bucket-stack');

  }
}

export class MytestStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const pipeline = new pipelines.CodePipeline(this, 'Pipeline', {
      crossAccountKeys: true,
      synth: new pipelines.ShellStep('Synth', {
        // Use a connection created using the AWS console to authenticate to GitHub
        // Other sources are available.
        input: pipelines.CodePipelineSource.gitHub('xazhao/TestCDK', 'main'),
        commands: [
          'aws sts get-caller-identity'
          // 'npm ci',
          // 'npm run build',
          // 'npx cdk synth',
        ],
      }),
    });

    // 'MyApplication' is defined below. Call `addStage` as many times as
    // necessary with any account and region (may be different from the
    // pipeline's).
    pipeline.addStage(new MyApplication(this, 'Prod', {
      env: {
        account: '714425508342',
        region: 'us-west-2',
      }
    }));
  }
  
}
