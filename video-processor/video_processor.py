import urllib.request as urllib2
import ssl
import boto3
from moviepy.editor import VideoFileClip
import uuid
import time
from botocore.exceptions import NoCredentialsError
import pandas as pd
import os



def extract_audio(video_path, output_audio_path):
    video_clip = VideoFileClip(video_path)
    audio_clip = video_clip.audio

    audio_clip.write_audiofile(output_audio_path, codec='mp3')
    video_clip.close()


aws_access_key_id = '<MASKED>'
aws_secret_access_key = '<MASKED>'
region_name = 'us-east-1'

bucket_name = 'cvc-meeting-recordings'
queue_url = '<MASKED>'


if __name__ == "__main__":
    

    while True:
        try:
            sqs = boto3.client('sqs', aws_access_key_id=aws_access_key_id, aws_secret_access_key=aws_secret_access_key, region_name=region_name)
            s3 = boto3.client('s3', aws_access_key_id=aws_access_key_id, aws_secret_access_key=aws_secret_access_key, region_name=region_name)
            transcribe = boto3.client('transcribe', aws_access_key_id=aws_access_key_id, aws_secret_access_key=aws_secret_access_key,region_name=region_name)
            response = sqs.receive_message(
                QueueUrl=queue_url,
                AttributeNames=['All'],
                MaxNumberOfMessages=1,
                MessageAttributeNames=['All'],
                VisibilityTimeout=0,
                WaitTimeSeconds=0
                )
            
            if 'Messages' in response:
                message = response['Messages'][0]
                receipt_handle = message['ReceiptHandle']

                print(f"Received message: {message['Body']}")
                
                session_id = message['Body']
                print("Session ID - {}".format(session_id))

                dwn_link = 'https://<MASKED>/openvidu/recordings/{}/{}.mp4'.format(session_id, session_id)
                context = ssl._create_unverified_context()

                print('Video Recording Like: {}'.format(dwn_link))

                video_name = session_id+'.mp4' 
                rsp = urllib2.urlopen(dwn_link, context=context)
                with open(video_name,'wb') as f:
                    f.write(rsp.read())
                print("Video file name: {}".format(video_name))

                s3.put_object(Bucket=bucket_name,Body='', Key='{}/'.format(session_id))
                print("created folder {} in {} bucket".format(session_id, bucket_name))

                try:
                    s3.upload_file(video_name, bucket_name, '{}/{}.mp4'.format(session_id, session_id))
                    print(f"Video uploaded successfully to S3: {'{}/{}.mp4'.format(session_id, session_id)}")
                except Exception as e:
                    print(f"Error uploading file to S3: {e}")


                audio_name = session_id+'.mp3' 
                extract_audio(video_name, audio_name)
                print('extracted audio: {}'.format(audio_name))

                try:
                    s3.upload_file(audio_name, bucket_name, '{}/{}.mp3'.format(session_id, session_id))
                    print(f"Audio uploaded successfully to S3: {'{}/{}.mp3'.format(session_id, session_id)}")
                except Exception as e:
                    print(f"Error uploading file to S3: {e}")


                transcript_name = session_id+'_transcript.txt'
                transcribe_job = str(uuid.uuid4())
                print("Transcribe Job: {}".format(transcribe_job))
                transcribe.start_transcription_job(
                    TranscriptionJobName=transcribe_job,
                    Media={'MediaFileUri': 's3://{}/{}/{}.mp3'.format(bucket_name, session_id, session_id)},
                    MediaFormat='mp3',
                    LanguageCode='en-US',
                    Settings = {
                        'ShowSpeakerLabels': True,
                        'MaxSpeakerLabels': 10
                        }
                        )
                

                i = 0
                transcription_result = dict()
                while True:
                    transcription_result = transcribe.get_transcription_job(TranscriptionJobName=transcribe_job)
                    print("Transcribe Job Status: {}".format(transcription_result['TranscriptionJob']['TranscriptionJobStatus']))
                    if transcription_result['TranscriptionJob']['TranscriptionJobStatus'] in ['COMPLETED', 'FAILED']:
                        break
                    time.sleep(15)
                    i+=1
                    if i==20:
                        break


                transcript = '<EMPTY TRANSCRIPT>'
                transcription_result = transcribe.get_transcription_job(TranscriptionJobName=transcribe_job)
                if transcription_result['TranscriptionJob']['TranscriptionJobStatus'] == 'COMPLETED':
                    transcript = pd.read_json(transcription_result['TranscriptionJob']['Transcript']['TranscriptFileUri']).loc['transcripts']['results'][0]['transcript']

                print("Extracted Transcripts:\n {}".format(transcript))

                f = open(transcript_name, 'w')
                f.write(transcript)
                f.close()

                try:
                    s3.upload_file(transcript_name, bucket_name, '{}/{}_transcript.txt'.format(session_id, session_id))
                    print(f"Transcript uploaded successfully to S3: {'{}/{}_transcript.txt'.format(session_id, session_id)}")
                except Exception as e:
                    print(f"Error uploading file to S3: {e}")


                # Delete received message from queue
                sqs.delete_message(
                    QueueUrl=queue_url,
                    ReceiptHandle=receipt_handle
                    )

                try:
                    os.remove(video_name)
                    os.remove(transcript_name)
                    os.remove(audio_name)
                except:
                    pass

            else:
                print("No messages in the queue")
        

        except NoCredentialsError:
            print("Credentials not available")
        
        time.sleep(10)