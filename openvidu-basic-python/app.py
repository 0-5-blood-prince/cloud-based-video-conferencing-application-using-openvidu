import os
import requests
from flask import Flask, request
from flask_cors import CORS
import uuid
from boto3 import resource
import config

AWS_ACCESS_KEY_ID = config.AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY = config.AWS_SECRET_ACCESS_KEY
REGION_NAME = config.REGION_NAME
 
resource = resource(
   'dynamodb',
   aws_access_key_id     = AWS_ACCESS_KEY_ID,
   aws_secret_access_key = AWS_SECRET_ACCESS_KEY,
   region_name           = REGION_NAME
)

app = Flask(__name__)

# Enable CORS support
cors = CORS(app, resources={r"/*": {"origins": "*"}})

# Load env variables
SERVER_PORT = 9000
OPENVIDU_URL = "https://54.197.183.27:443/"
# OPENVIDU_IP = "54.197.183.27"
# OPENVIDU_URL = "http://localhost:4443/"
OPENVIDU_SECRET = "TEST"


def create_table_meeting():   
   table = resource.create_table(
       TableName = 'Meeting', # Name of the table
       KeySchema = [
           {
               'AttributeName': 'meetingId',
               'KeyType'      : 'HASH' #RANGE = sort key, HASH = partition key
           }
       ],
       AttributeDefinitions = [
           {
               'AttributeName': 'meetingId', # Name of the attribute
               'AttributeType': 'S'   # N = Number (B= Binary, S = String)
           }
       ],
       ProvisionedThroughput={
           'ReadCapacityUnits'  : 10,
           'WriteCapacityUnits': 10
       }
   )
   return table



# @app.route("/createDB",methods=["POST"])
# def createDB():
#     create_table_meeting()
#     return 200

@app.route("/api/sessions", methods=['POST'])
def initializeSession():
    try:
        body = request.json if request.data else {}
        body['recordingMode'] = "ALWAYS"
        response = requests.post(
            OPENVIDU_URL + "openvidu/api/sessions",
            verify=False,
            auth=("OPENVIDUAPP", OPENVIDU_SECRET),
            headers={'Content-type': 'application/json'},
            json=body
        )
        response.raise_for_status()
        return response.json()["sessionId"]
    except requests.exceptions.HTTPError as err:
        if (err.response.status_code == 409):
            # Session already exists in OpenVidu
            print("Already Exists")
            return request.json["customSessionId"]
        else:
            return err


@app.route("/api/sessions/<sessionId>/connections", methods=['POST'])
def createConnection(sessionId):
    makeHost = request.headers.get('makeHost')
    role = "PUBLISHER"
    print(makeHost)
    if makeHost:
        role = "MODERATOR"
    print(role)
    body = request.json if request.data else {}
    body['role'] = role
    response =  requests.post(
        OPENVIDU_URL + "openvidu/api/sessions/" + sessionId + "/connection",
        verify=False,
        auth=("OPENVIDUAPP", OPENVIDU_SECRET),
        headers={'Content-type': 'application/json', 'role':role},
        json=body
    ).json()
    token = response['token']
    # token = token.replace(OPENVIDU_IP, OPENVIDU_IP+":443")
    return token


@app.route("/api/sessions/<sessionId>/participants", methods=['POST'])
def participantCreated(sessionId):
    userId = request.headers.get('UserId')
    print(userId)
    return "OK"



@app.route("/api/sessions/<sessionId>/participants/<participantId>/events", methods=['POST'])
def recordEvent(sessionId, participantId):
    eventType = request.headers.get('EventType')
    print(eventType, sessionId)
    return "Ok"





if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=SERVER_PORT)
