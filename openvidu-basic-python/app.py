import os
import requests
from flask import Flask, request
from flask_cors import CORS
import uuid
import boto3
import config
import ast
from botocore.exceptions import ClientError
from datetime import datetime, timedelta
import threading
import time

AWS_ACCESS_KEY_ID = config.AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY = config.AWS_SECRET_ACCESS_KEY
REGION_NAME = config.REGION_NAME
 
resource = boto3.resource(
   'dynamodb',
   aws_access_key_id     = AWS_ACCESS_KEY_ID,
   aws_secret_access_key = AWS_SECRET_ACCESS_KEY,
   region_name           = REGION_NAME
)
table_name = "meeting-details"
mutex = threading.Lock()

app = Flask(__name__)

# Enable CORS support
cors = CORS(app, resources={r"/*": {"origins": "*"}})

# Load env variables
SERVER_PORT = 9000
OPENVIDU_URL = "https://54.197.183.27:443/"
OPENVIDU_SECRET = "TEST"

def background_task():
    while True:
        response = requests.get(
            OPENVIDU_URL + "openvidu/api/sessions",
            verify=False,
            auth=("OPENVIDUAPP", OPENVIDU_SECRET),
            headers={'Content-type': 'application/json'},
            json={}
        ).json()
        response_1 = requests.get(
            OPENVIDU_URL + "openvidu/api/recordings",
            verify=False,
            auth=("OPENVIDUAPP", OPENVIDU_SECRET),
            headers={'Content-type': 'application/json'},
            json={}
        ).json()
        for content in response["content"]:
            if content["connections"]["numberOfElements"] == 0:
                for record in response_1["items"]:
                    if record["sessionId"] == content["id"]:
                        response = requests.post(
                            OPENVIDU_URL + "/openvidu/api/recordings/stop/" + record["id"],
                            verify=False,
                            auth=("OPENVIDUAPP", OPENVIDU_SECRET),
                            headers={'Content-type': 'application/json'},
                            json={}
                        )
                        break
                response = requests.delete(
                    OPENVIDU_URL + "openvidu/api/sessions/" + content["id"],
                    verify=False,
                    auth=("OPENVIDUAPP", OPENVIDU_SECRET),
                    headers={'Content-type': 'application/json'},
                    json={}
                )
                timee = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                mutex.acquire()
                try:
                    update_item({"meetingID": content["id"]}, "end_time", timee)
                finally:
                    mutex.release()
        time.sleep(30)

threading.Thread(target=background_task, daemon=True).start()

@app.route("/api/sessions", methods=['POST'])
def initializeSession():
    try:
        body = request.json if request.data else {}
        body["recordingMode"] = "ALWAYS"
        response = requests.post(
            OPENVIDU_URL + "openvidu/api/sessions",
            verify=False,
            auth=("OPENVIDUAPP", OPENVIDU_SECRET),
            headers={'Content-type': 'application/json'},
            json=body
        )
        response.raise_for_status()
        details = {
            "meetingID": response.json()["sessionId"],
            "host": "",
            "start_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "end_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "participants": {}
        }
        insert_data(details)
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
    timee = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    mutex.acquire()
    try:
        details = lookup_data({"meetingID": sessionId})
        participants = set(details["participants"])
        if userId not in participants:
            details["participants"][userId] = [["JOINMEETING", timee]]
            update_item({"meetingID": sessionId}, "participants", details["participants"])
        else:
            details["participants"][userId].append(["JOINMEETING", timee])
            update_item({"meetingID": sessionId}, "participants", details["participants"])
    finally:
        mutex.release()
    return "OK"



@app.route("/api/sessions/<sessionId>/participants/<participantId>/events", methods=['POST'])
def recordEvent(sessionId, participantId):
    eventType = request.headers.get('EventType')
    timee = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    mutex.acquire()
    try:
        details = lookup_data({"meetingID": sessionId})
        details["participants"][participantId].append([eventType, timee])
        update_item({"meetingID": sessionId}, "participants", details["participants"])
    finally:
        mutex.release()
    print(eventType, sessionId, participantId)
    return "Ok"


def insert_data(data, db=None, table=table_name):
    if not db:
        db = boto3.resource('dynamodb')
    table = db.Table(table)
    with table.batch_writer() as batch:
        # overwrite if the same index is provided
        response = table.put_item(Item=data)
    return response

def lookup_data(key, db=None, table=table_name):
    if not db:
        db = boto3.resource('dynamodb')
    table = db.Table(table)
    try:
        response = table.get_item(Key=key)
    except ClientError as e:
        print('Error', e.response['Error']['Message'])
    else:
        return response['Item']

def update_item(key, feature_key, feature_value, db=None, table=table_name):
    if not db:
        db = boto3.resource('dynamodb')
    table = db.Table(table)
    # change student location
    response = table.update_item(
        Key=key,
        UpdateExpression="set #feature=:f",
        ExpressionAttributeValues={
            ':f': feature_value
        },
        ExpressionAttributeNames={
            "#feature": feature_key
        },
        ReturnValues="UPDATED_NEW"
    )
    return response

def delete_item(key, db=None, table=table_name):
    if not db:
        db = boto3.resource('dynamodb')
    table = db.Table(table)
    try:
        response = table.delete_item(Key=key)
    except ClientError as e:
        print('Error', e.response['Error']['Message'])
    else:
        return response


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=SERVER_PORT)
