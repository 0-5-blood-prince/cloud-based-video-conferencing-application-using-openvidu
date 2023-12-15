import { Grid } from '@material-ui/core';
import React, { useContext, useEffect } from 'react';
import { AuthContext } from '../contexts/authContext';



const OpenViduComponent = () => {
  const auth = useContext(AuthContext)
  const userId = auth.attrInfo[0].Value;
  console.log(userId)
  // console.log(JSON.stringify(auth.attrInfo, null, 2))

  const url = 'video.html?userId='+userId
  return (
    <Grid container direction="row" justify="center" alignItems="center">
      <iframe src={url} width={1500} height={1000}></iframe>
    </Grid>
  );
};

export default OpenViduComponent;
