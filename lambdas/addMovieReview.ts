import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import Ajv from "ajv";
import * as schema from '../shared/types.schema.json';

const ajv = new Ajv();
const isValidBodyParams = ajv.compile(schema.definitions["MovieReview"] || {}); 

const ddbDocClient = createDynamoDBDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
    try {
      console.log("Event: ", event);
      const body = event.body ? JSON.parse(event.body) : undefined;
  
      if (!body) {
        return {
          statusCode: 400,
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({ error: "Missing request body" }),
        };
      }
  
      if (!isValidBodyParams(body)) {
        return {
          statusCode: 400,
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            error: "Incorrect type. Must match MovieReview schema",
            schema: schema.definitions["MovieReview"],
          }),
        };
      }
  
      const commandOutput = await ddbDocClient.send(
        new PutCommand({
          TableName: 'MovieReviews',
          Item: body,
        })
      );
  
      return {
        statusCode: 201,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ message: "Movie review added" }),
      };
    } catch (error: any) {
      console.log("Error: ", error);
      return {
        statusCode: 500,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ error: error.message || "Internal Server Error" }),
      };
    }
  };

function createDynamoDBDocClient() {
  const ddbClient = new DynamoDBClient({ region: "eu-north-1" });
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
