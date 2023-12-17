import { Grid, Typography, makeStyles } from '@material-ui/core';
import React, { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../contexts/authContext';
import { useHistory } from 'react-router-dom';
import Box from '@material-ui/core/Box'
import Button from '@material-ui/core/Button'


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

export default function OpenViduComponent() {
  const classes = useStyles()

  const history = useHistory()

  
  console.log(AuthContext)
  const auth = useContext(AuthContext)

  // console.log(JSON.stringify(auth.attrInfo, null, 2))



  
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

  // const [userName, setUserName] = useState("");
  // const [userId, setUserId] = useState("");

  // useEffect(() => {
  console.log(auth)
  var userId = auth.attrInfo[0].Value
  var userName = auth.attrInfo[2].Value
  for(var i=0;i < auth.attrInfo.length;i++) {
    if (auth.attrInfo[i].Name === "sub") {
      userId = auth.attrInfo[i].Value
    }

    if (auth.attrInfo[i].Name === "email") {
      userName = auth.attrInfo[i].Value
    }
  } 
 
    console.log(userId, userName)
  // })
  const url = 'video.html?userId='+userId+'&userName='+userName
  console.log(url)
  return (
    <Grid container direction="row" justify="center" alignItems="center">
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
            
              <Button onClick={home} variant="contained" color="primary">
                Home
              </Button>
              </Grid>
                {/* </Grid> */}
                
            </Box>
          </Grid>
        </Box>
      <iframe src={url} width={1400} height={700}></iframe>
      </Grid>
    </Grid>
  );
};


