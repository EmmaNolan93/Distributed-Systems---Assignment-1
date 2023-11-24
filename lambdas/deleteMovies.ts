import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const ddbDocClient = createDynamoDBDocumentClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    console.log('Event: ', event);

    const movieId = event?.pathParameters?.movieId;

    if (!movieId) {
      return {
        statusCode: 400,
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ message: 'Missing movieId parameter' }),
      };
    }

    const commandOutput = await ddbDocClient.send(
      new DeleteCommand({
        TableName: 'Movies',
        Key: { movieId: parseInt(movieId) },
      })
    );

    console.log('DeleteCommand response: ', commandOutput);

    return {
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ message: 'Movie deleted successfully' }),
    };
  } catch (error: any) {
    console.log(JSON.stringify(error));
    return {
      statusCode: 500,
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ error }),
    };
  }
};

function createDynamoDBDocumentClient() {
  const ddbClient = new DynamoDBClient({ region:  "eu-north-1" }); // replace 'your-region' with your AWS region
  const marshallOptions = {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  };
  const unmarshallOptions = {
    wrapNumbers: false,
  };
  const translateConfig = { marshallOptions, unmarshallOptions };
  return DynamoDBDocumentClient.from(ddbClient, translateConfig);
}
