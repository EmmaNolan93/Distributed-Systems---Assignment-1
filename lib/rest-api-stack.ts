import * as cdk from "aws-cdk-lib";
import * as lambdanode from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as custom from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";
// import * as sqs from 'aws-cdk-lib/aws-sqs';
import { generateBatch } from "../shared/util";
import { generateReviewBatch  } from "../shared/util";
import { movies, movieCasts } from "../seed/movies";
import { movieReviews } from "../seed/moviesReview";
import * as apig from "aws-cdk-lib/aws-apigateway";

export class RestAPIStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Tables 
    const moviesTable = new dynamodb.Table(this, "MoviesTable", {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: "movieId", type: dynamodb.AttributeType.NUMBER },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: "Movies",
    });

    // Movie Reviews Table
const movieReviewsTable = new dynamodb.Table(this, "MovieReviewsTable", {
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  partitionKey: { name: "movieId", type: dynamodb.AttributeType.NUMBER },
  removalPolicy: cdk.RemovalPolicy.DESTROY,
  tableName: "MovieReviews",
});

// Add a Global Secondary Index for reviewerName
movieReviewsTable.addGlobalSecondaryIndex({
  indexName: 'ReviewerIndex',
  partitionKey: { name: 'reviewerName', type: dynamodb.AttributeType.STRING },
});


    const movieCastsTable = new dynamodb.Table(this, "MovieCastTable", {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: "movieId", type: dynamodb.AttributeType.NUMBER },
      sortKey: { name: "actorName", type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: "MovieCast",
    });

    movieCastsTable.addLocalSecondaryIndex({
      indexName: "roleIx",
      sortKey: { name: "roleName", type: dynamodb.AttributeType.STRING },
    });

    // Functions 
    const getMovieByIdFn = new lambdanode.NodejsFunction(
      this,
      "GetMovieByIdFn",
      {
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.NODEJS_16_X,
        entry: `${__dirname}/../lambdas/getMovieById.ts`,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: moviesTable.tableName,
          REGION: 'eu-north-1',
        },
      }
      );

      const getAllMoviesFn = new lambdanode.NodejsFunction(
        this,
        "GetAllMoviesFn",
        {
          architecture: lambda.Architecture.ARM_64,
          runtime: lambda.Runtime.NODEJS_16_X,
          entry: `${__dirname}/../lambdas/getAllMovies.ts`,
          timeout: cdk.Duration.seconds(10),
          memorySize: 128,
          environment: {
            TABLE_NAME: moviesTable.tableName,
            REGION: 'eu-north-1',
          },
        }
        );

        const newMovieFn = new lambdanode.NodejsFunction(this, "AddMovieFn", {
          architecture: lambda.Architecture.ARM_64,
          runtime: lambda.Runtime.NODEJS_16_X,
          entry: `${__dirname}/../lambdas/addMovies.ts`,
          timeout: cdk.Duration.seconds(10),
          memorySize: 128,
          environment: {
            TABLE_NAME: moviesTable.tableName,
            REGION: "eu-north-1",
          },
        });

        const newMovieReviewFn = new lambdanode.NodejsFunction(this, "AddMovieReviewFn", {
          architecture: lambda.Architecture.ARM_64,
          runtime: lambda.Runtime.NODEJS_16_X,
          entry: `${__dirname}/../lambdas/addMovieReview.ts`,
          timeout: cdk.Duration.seconds(10),
          memorySize: 128,
          environment: {
            TABLE_NAME: movieReviewsTable.tableName,
            REGION: "eu-north-1",
          },
        });

        const updateReviewFn = new lambdanode.NodejsFunction(this, "updateReviewFn", {
          architecture: lambda.Architecture.ARM_64,
          runtime: lambda.Runtime.NODEJS_16_X,
          entry: `${__dirname}/../lambdas/updateReview.ts`,
          timeout: cdk.Duration.seconds(10),
          memorySize: 128,
          environment: {
            TABLE_NAME: movieReviewsTable.tableName,
            REGION: "eu-north-1",
          },
        });


        const getAllReviewsForMovieFn = new lambdanode.NodejsFunction(
          this,
          "GetAllReviewsForMovieFn",
          {
            architecture: lambda.Architecture.ARM_64,
            runtime: lambda.Runtime.NODEJS_16_X,
            entry: `${__dirname}/../lambdas/getAllMoviesReview.ts`, 
            timeout: cdk.Duration.seconds(10),
            memorySize: 128,
            environment: {
              TABLE_NAME: movieReviewsTable.tableName,
              REGION: 'eu-north-1',
            },
          }
        );

        const getAllReviewsForMovieNameFn = new lambdanode.NodejsFunction(
          this,
          "getAllReviewsForMovieNameFn",
          {
            architecture: lambda.Architecture.ARM_64,
            runtime: lambda.Runtime.NODEJS_16_X,
            entry: `${__dirname}/../lambdas/getMovieReviewByName.ts`, 
            timeout: cdk.Duration.seconds(10),
            memorySize: 128,
            environment: {
              TABLE_NAME: movieReviewsTable.tableName,
              REGION: 'eu-north-1',
            },
          }
        );

        const getAllReviewsByReviewersFn = new lambdanode.NodejsFunction(
          this,
          "getAllReviewsByReviewersFn",
          {
            architecture: lambda.Architecture.ARM_64,
            runtime: lambda.Runtime.NODEJS_16_X,
            entry: `${__dirname}/../lambdas/getReviewsByReviewer.ts`, 
            timeout: cdk.Duration.seconds(10),
            memorySize: 128,
            environment: {
              TABLE_NAME: movieReviewsTable.tableName,
              REGION: 'eu-north-1',
            },
          }
        );

        const getAllReviewsForMovieYearFn = new lambdanode.NodejsFunction(
          this,
          "getAllReviewsForMovieYearFn",
          {
            architecture: lambda.Architecture.ARM_64,
            runtime: lambda.Runtime.NODEJS_16_X,
            entry: `${__dirname}/../lambdas/sortByyear.ts`, 
            timeout: cdk.Duration.seconds(10),
            memorySize: 128,
            environment: {
              TABLE_NAME: movieReviewsTable.tableName,
              REGION: 'eu-north-1',
            },
          }
        );

        const deleteMovieFn = new lambdanode.NodejsFunction(this, 'DeleteMovieFn', {
          architecture: lambda.Architecture.ARM_64,
          runtime: lambda.Runtime.NODEJS_16_X,
          entry: `${__dirname}/../lambdas/deleteMovies.ts`,
          timeout: cdk.Duration.seconds(10),
          memorySize: 128,
          environment: {
            TABLE_NAME: moviesTable.tableName,
            REGION: "eu-north-1",
          },
        });

        const getMovieCastMembersFn = new lambdanode.NodejsFunction(
          this,
          "GetCastMemberFn",
          {
            architecture: lambda.Architecture.ARM_64,
            runtime: lambda.Runtime.NODEJS_16_X,
            entry: `${__dirname}/../lambdas/getMovieCastMember.ts`,
            timeout: cdk.Duration.seconds(10),
            memorySize: 128,
            environment: {
              TABLE_NAME: movieCastsTable.tableName,
              REGION: "eu-north-1",
            },
          }
        );

        new custom.AwsCustomResource(this, "moviesddbInitData", {
          onCreate: {
            service: "DynamoDB",
            action: "batchWriteItem",
            parameters: {
              RequestItems: {
                [moviesTable.tableName]: generateBatch(movies),
                [movieCastsTable.tableName]: generateBatch(movieCasts),  // Added
              },
            },
            physicalResourceId: custom.PhysicalResourceId.of("moviesddbInitData"), //.of(Date.now().toString()),
          },
          policy: custom.AwsCustomResourcePolicy.fromSdkCalls({
            resources: [moviesTable.tableArn, movieCastsTable.tableArn],  // Includes movie cast
          }),
        });

        new custom.AwsCustomResource(this, "movieReviewsDdbInitData", {
          onCreate: {
            service: "DynamoDB",
            action: "batchWriteItem", 
            parameters: {
              RequestItems: {
                [movieReviewsTable.tableName]: generateReviewBatch(movieReviews),
              },
            },
            physicalResourceId: custom.PhysicalResourceId.of("movieReviewsDdbInitData"),
          },
          policy: custom.AwsCustomResourcePolicy.fromSdkCalls({
            resources: [movieReviewsTable.tableArn],
          }),
        });
        // Permissions 
        moviesTable.grantReadData(getMovieByIdFn);
        moviesTable.grantReadData(getAllMoviesFn);
        movieReviewsTable.grantReadData(getAllReviewsForMovieFn);
        moviesTable.grantReadWriteData(newMovieFn);
        moviesTable.grantReadWriteData(newMovieReviewFn);
        movieReviewsTable.grantReadWriteData(newMovieReviewFn);
        movieReviewsTable.grantReadData(getAllReviewsForMovieNameFn);
        moviesTable.grantReadData(getAllReviewsForMovieNameFn);
        moviesTable.grantWriteData(deleteMovieFn);
        movieCastsTable.grantReadData(getMovieCastMembersFn);
        movieReviewsTable.grantReadWriteData(updateReviewFn);
        moviesTable.grantReadData(updateReviewFn);
        movieReviewsTable.grantReadWriteData(getAllReviewsForMovieYearFn);
        moviesTable.grantReadWriteData(getAllReviewsForMovieYearFn);
        movieReviewsTable.grantReadWriteData(getAllReviewsByReviewersFn);
        movieReviewsTable.grantReadData(getAllReviewsByReviewersFn);
// REST API 
const api = new apig.RestApi(this, "RestAPI", {
  description: "demo api",
  deployOptions: {
    stageName: "dev",
  },
  // 👇 enable CORS
  defaultCorsPreflightOptions: {
    allowHeaders: ["Content-Type", "X-Amz-Date"],
    allowMethods: ["OPTIONS", "GET", "POST", "PUT", "PATCH", "DELETE"],
    allowCredentials: true,
    allowOrigins: ["*"],
  },
});

const moviesEndpoint = api.root.addResource("movies");
moviesEndpoint.addMethod(
  "GET",
  new apig.LambdaIntegration(getAllMoviesFn, { proxy: true })
);
moviesEndpoint.addMethod(
  "POST",
  new apig.LambdaIntegration(newMovieFn, { proxy: true })
);

const movieEndpoint = moviesEndpoint.addResource("{movieId}");
movieEndpoint.addMethod(
  "GET",
  new apig.LambdaIntegration(getMovieByIdFn, { proxy: true })
);
movieEndpoint.addMethod(
  "DELETE",
  new apig.LambdaIntegration(deleteMovieFn, { proxy: true })
);
const movieCastEndpoint = moviesEndpoint.addResource("cast");
movieCastEndpoint.addMethod(
    "GET",
    new apig.LambdaIntegration(getMovieCastMembersFn, { proxy: true })
);
//const movieReviewsEndpoint = api.root.addResource("MovieReviewsTable");

const movieReviewsForMovieEndpoint = movieEndpoint.addResource("reviews");
movieReviewsForMovieEndpoint.addMethod(
  "GET",
  new apig.LambdaIntegration(getAllReviewsForMovieFn, { proxy: true })
);
const postReviewsForMovieEndpoint = moviesEndpoint.addResource("reviews");
postReviewsForMovieEndpoint.addMethod(
  "POST",
  new apig.LambdaIntegration(newMovieReviewFn, { proxy: true })
);

const movieReviewYearEndpoint = movieReviewsForMovieEndpoint.addResource("{year}");
movieReviewYearEndpoint.addMethod(
  "GET",
  new apig.LambdaIntegration(getAllReviewsForMovieYearFn, { proxy: true })
);
const movieReviewByReviewerEndpoint = movieReviewsForMovieEndpoint.addResource("reviewer");
movieReviewByReviewerEndpoint.addMethod(
  "GET",
  new apig.LambdaIntegration(getAllReviewsForMovieNameFn, { proxy: true })
);
movieReviewByReviewerEndpoint.addMethod(
  "PUT",
  new apig.LambdaIntegration(updateReviewFn, { proxy: true })
);
// Add a new resource for 'reviews' under 'movies'
const reviewsResource =  postReviewsForMovieEndpoint.addResource('{reviewername}')

// Add a new method for 'GET' HTTP verb
reviewsResource.addMethod(
    "GET",
    new apig.LambdaIntegration(getAllReviewsByReviewersFn, { proxy: true })
);
}
}