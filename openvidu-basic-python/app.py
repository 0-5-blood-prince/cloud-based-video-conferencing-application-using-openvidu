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
DB = resource
table_name = "meeting-details"
mutex = threading.Lock()
mutex_1 = threading.Lock()

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
        #print(response)
        for content in response["content"]:
            if content["connections"]["numberOfElements"] == 0:
                print("triggered")
                for record in response_1["items"]:
                    if record["sessionId"] == content["id"]:
                        response = requests.post(
                            OPENVIDU_URL + "openvidu/api/recordings/stop/" + record["id"],
                            verify=False,
                            auth=("OPENVIDUAPP", OPENVIDU_SECRET),
                            headers={'Content-type': 'application/json'},
                            json={}
                        )
                        print("found")
                        break
                response = requests.delete(
                    OPENVIDU_URL + "openvidu/api/sessions/" + content["id"],
                    verify=False,
                    auth=("OPENVIDUAPP", OPENVIDU_SECRET),
                    headers={'Content-type': 'application/json'},
                    json={}
                )
                print(response)
                timee = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                mutex.acquire()
                try:
                    update_item({"meetingID": content["id"]}, "end_time", timee)
                finally:
                    mutex.release()
                sqs = boto3.client(
                        'sqs',
                        aws_access_key_id     = AWS_ACCESS_KEY_ID,
                        aws_secret_access_key = AWS_SECRET_ACCESS_KEY,
                        region_name           = REGION_NAME)
                queue = sqs.get_queue_url(QueueName="session-analytics-queue")

                #queue_url = 'https://sqs.us-east-1.amazonaws.com/329147244489/session-analytics-queue'
                message_body = content['id']
                response = sqs.send_message(
                                QueueUrl=queue['QueueUrl'],
                                MessageBody=message_body)
                print(response)

                #queue = sqs.get_queue_url(QueueName="video-processing-queue")

                #queue_url = 'https://sqs.us-east-1.amazonaws.com/329147244489/session-analytics-queue'
                #message_body = content['id']
                #response = sqs.send_message(
                #                QueueUrl=queue['QueueUrl'],
                #               MessageBody=message_body)
                #print(response)

            time.sleep(180)

threading.Thread(target=background_task, daemon=True).start()

@app.route("/health", methods=['GET'])
def health():
return "OK"
@app.route("/api/sessions", methods=['POST'])
def initializeSession():
    email = request.headers.get('email')
    userid = request.headers.get('participantName')

    mutex_1.acquire()
    try:
        insert_data({"userId": userid, "email": email}, table = "email_data")
    finally:
        mutex_1.release()

    try:
        body = request.json if request.data else {}
        #body["recordingMode"] = "ALWAYS"
        print(request.headers.get('participantName'))
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
            "host": request.headers.get('participantName'),
            "start_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "end_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "participants": {}
        }
        mutex.acquire()
        try:
            insert_data(details)
        finally:
            mutex.release()
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
   user = request.headers.get('participantName')
   role = "PUBLISHER"
   print(user)
   mutex.acquire()
   try:
       details = lookup_data({"meetingID": sessionId})
       if user == details["host"]:
           role = "MODERATOR"
   finally:
       mutex.release()
   #if makeHost:
   #    role = "MODERATOR"
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
   if eventType == "STARTRECORDING":
       print(eventType)
       print(sessionId)
       i = 0
       mutex.acquire()
       try:
           details = lookup_data({"meetingID": sessionId})
           if participantId == details["host"]:
               i = 1
       finally:
          mutex.release()
      if i == 0:
          return "Ok"
      body = {"session": sessionId}
      response = requests.post(
              OPENVIDU_URL + "openvidu/api/recordings/start",
              verify=False,
              auth=("OPENVIDUAPP", OPENVIDU_SECRET),
              headers={'Content-type': 'application/json'},
              json=body
          )
    if eventType == "STOPRECORDING":
        i = 0
        mutex.acquire()
        try:
            details = lookup_data({"meetingID": sessionId})
            if participantId == details["host"]:
                i = 1
        finally:
            mutex.release()
        if i == 0:
            return "Ok"
        response_1 = requests.get(
                    OPENVIDU_URL + "openvidu/api/recordings",
                    verify=False,
                    auth=("OPENVIDUAPP", OPENVIDU_SECRET),
                    headers={'Content-type': 'application/json'},
                    json={}
                ).json()
        for record in response_1["items"]:
            if record["sessionId"] == sessionId:
                print(record)
                response = requests.post(
                        OPENVIDU_URL + "openvidu/api/recordings/stop/" + record["id"],
                        verify=False,
                        auth=("OPENVIDUAPP", OPENVIDU_SECRET),
                        headers={'Content-type': 'application/json'},
                        print(response)
                        break
    if eventType == "LEFTMEETING":
        response = requests.get(
            OPENVIDU_URL + "openvidu/api/sessions",
            verify=False,
            auth=("OPENVIDUAPP", OPENVIDU_SECRET),
            headers={'Content-type': 'application/json'},
            json={}
        ).json()
        found = False
        for session in response['content']:
            if session['id'] == sessionId:
                found = True
                break
        if not found:
            timee = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            mutex.acquire()
            try:
                update_item({"meetingID": sessionId}, "end_time", timee)
            finally:
                mutex.release()
            sqs = boto3.client(
                    'sqs',
                    aws_access_key_id     = AWS_ACCESS_KEY_ID,
                    aws_secret_access_key = AWS_SECRET_ACCESS_KEY,
                    region_name           = REGION_NAME)
            queue = sqs.get_queue_url(QueueName="session-analytics-queue")
            #queue_url = 'https://sqs.us-east-1.amazonaws.com/329147244489/session-analytics-queue'
            message_body = sessionId
            response = sqs.send_message(
            message_body = sessionId
            response = sqs.send_message(
                    QueueUrl=queue['QueueUrl'],
                    MessageBody=message_body)
            print(response)
            queue = sqs.get_queue_url(QueueName="video-processing-queue")
            #queue_url = 'https://sqs.us-east-1.amazonaws.com/329147244489/session-analytics-queue'
            message_body = sessionId
            response = sqs.send_message(
                    QueueUrl=queue['QueueUrl'],
                    MessageBody=message_body)
            print(response)


        return "Ok"


def insert_data(data, db=None, table=table_name):
    if not db:
        db = DB
    table = db.Table(table)
    with table.batch_writer() as batch:
        # overwrite if the same index is provided
        response = table.put_item(Item=data)
    return response

def lookup_data(key, db=None, table=table_name):
    if not db:
        db = DB
    table = db.Table(table)
    try:
        response = table.get_item(Key=key)
    except ClientError as e:
