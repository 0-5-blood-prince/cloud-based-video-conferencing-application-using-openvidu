import React, { useContext, useEffect, useState } from 'react'

import { useHistory } from 'react-router-dom'

import { makeStyles } from '@material-ui/core/styles'

import Typography from '@material-ui/core/Typography'
import Grid from '@material-ui/core/Grid'
import Box from '@material-ui/core/Box'
import Button from '@material-ui/core/Button'
import GitHubIcon from '@material-ui/icons/GitHub'
import Link from '@material-ui/core/Link'

import logoImage from './logo.png'
import Details from './meeting-details/details'

import { AuthContext } from '../contexts/authContext'

const useStyles = makeStyles((theme) => ({
  root: {},
  title: {
    textAlign: 'center',
  },
  session: {
    width: '80vw',
    overflow: 'auto',
    overflowWrap: 'break-word',
    fontSize: '16px',
  },
  hero: {
    width: '100%',
    background: 'rgb(220,220,220)',
  },
}))
interface MeetingData {
  'Meeting Code': any;
  'Join Time': any;
  'Exit Time': any;
  'Audio Activity': any;
  'Video Activity': any;
  'Screen Share Activity': any;
  'Video Download Url': any;
  'Transcript': any;
}
export default function Home() {
  const columns = ['Meeting Code', 'Join Time', 'Exit Time', 'Audio Activity', 'Video Activity']; // Your column names
  const expandedColumns = ['Meeting Code', 'Join Time', 'Exit Time', 'Audio Activity', 'Video Activity', 'Screen Share Activity',  'Video Download Url','Transcript']; // Your column names

  const [data, setData] = useState<MeetingData[]>([]);

  // const data = [
  //   { 'Meeting Id': '1234', 'Start Time': 25, 'End Time': 30, 'Number of Participants': 5, 'Transcript':'abcdefghijklmnopqrstuvwxyz','Recording':'link'},
  //   { 'Meeting Id': '1235', 'Start Time': 30, 'End Time': 40, 'Number of Participants': 6, 'Transcript':'abcdefghijklmnopqrstuvwxyz','Recording':'link'},
  //   // Add more rows as needed
  // ];
  const classes = useStyles()

  const history = useHistory()

  const auth = useContext(AuthContext)


  useEffect(() => {
    const userId = auth.attrInfo[0].Value;
    const fetchData = async () => {
      try {
        const response = await fetch('https://1yb39uhbz6.execute-api.us-east-1.amazonaws.com/TEST/meetings',{
          method: 'GET', // Specify the HTTP method (GET, POST, PUT, etc.)
          headers: {
            'Content-Type': 'application/json', // Example header (modify as needed)
            'userId' : userId
          },
        });
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const result = await response.json();
        console.log(result);
        const meetings = result.meetings
        var responseData = []
        var i = 0;
        while(i < meetings.length) {
          const meeting = meetings[i]
          console.log(meeting)
          const detail = {
            'Meeting Code': meeting.meetingId, 
            'Join Time': meeting.firstSeen ,
            'Exit Time': meeting.lastSeen,
            'Audio Activity': meeting.audioActivity,
            'Video Activity': meeting.videoActivity,
            'Screen Share Activity': meeting.screenShareActivity,
            'Transcript': meeting.transcript,
            'Video Download Url': meeting.videoDownloadurl
          }
          i+=1
          responseData.push(detail)
        }
        console.log(responseData)
        setData(responseData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);
  function signOutClicked() {
    auth.signOut()
    history.push('/')
  }

  function newMeeting() {
    history.push('newmeeting')
  }

  function home() {
    history.push('/')
  }

  function changePasswordClicked() {
    history.push('changepassword')
  }

  return (
    <Grid container>
      <Grid className={classes.root} container direction="column" justify="center" alignItems="center">
        <Box className={classes.hero} p={1}>
          <Grid className={classes.root} container direction="column" justify="center" alignItems="center">
            {/* <Box m={2}>
              <img src={logoImage} width={224} height={224} alt="logo" />
            </Box> */}
            <Box m={2}>
                <Grid container direction="row" justify="center" alignItems="center">
                  <Typography className={classes.title} variant="h4">
                    Video Conferencing Home
                  </Typography>
                  {/* <p></p> */}
                {/* <Grid container direction="row" justify="center" alignItems="center"> */}
                  <Button onClick={signOutClicked} variant="contained" color="primary">
                Sign Out
              </Button>
              {/* <Button onClick={changePasswordClicked} variant="contained" color="primary">
                Change Password
              </Button> */}
              <Button onClick={newMeeting} variant="contained" color="primary">
                New Meeting
              </Button>
              <Button onClick={home} variant="contained" color="primary">
                Home
              </Button>
              </Grid>
                {/* </Grid> */}
                
            </Box>
          </Grid>
        </Box>
        {/* <Box m={2}>
          <Typography variant="h5">Session Info</Typography>
          <pre className={classes.session}>{JSON.stringify(auth.sessionInfo, null, 2)}</pre>
        </Box> */}
        {/* <Box m={2}>
          <Typography variant="h5">User Attributes</Typography>
          <pre className={classes.session}>{JSON.stringify(auth.attrInfo, null, 2)}</pre>
        </Box> */}
        <Details data={data} columns={columns} expandedColumns={expandedColumns} />
      </Grid>
    </Grid>
  )
}
