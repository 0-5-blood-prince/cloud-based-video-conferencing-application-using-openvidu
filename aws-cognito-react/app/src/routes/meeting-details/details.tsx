import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Button,
  makeStyles,
} from '@material-ui/core';

const Details = ({ data, columns, expandedColumns }: any) => {
  console.log(data)
  const [expandedRow, setExpandedRow] = useState(null);

  const handleRowClick = (rowIndex: any) => {
    if (expandedRow === rowIndex) {
      setExpandedRow(null);
    } else {
      setExpandedRow(rowIndex);
    }
  };

  const sendMeetingDetails =  async (meetingId: any) => {
    try {
      const response = await fetch('https://1yb39uhbz6.execute-api.us-east-1.amazonaws.com/TEST/meetings/sendDetails',{
        method: 'GET', // Specify the HTTP method (GET, POST, PUT, etc.)
        headers: {
          'Content-Type': 'application/json', // Example header (modify as needed)
          'meetingId' : meetingId
        },
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    // TODO hit backend to make the details available for other users and mail them
  };


  const useStyles = makeStyles({
    accordionContainer: {
      display: 'flex',
      // justifyContent: 'center',
      // alignItems: 'center',
      // minHeight: '100vh',
    },
    columnName: {
      fontSize: '1.5em', // Increase font size of column names
      fontWeight: 'bold', // Make column names bold
    },
    accordionContent: {
      width: '100%',
      textAlign: 'left',
      whiteSpace: 'pre-wrap', // Preserve new lines
    },
    listItem: {
      display: 'inline-block', // Display as inline-block to place items in a line
      marginRight: '20px', // Add right margin for spacing between items
      verticalAlign: 'top', // Align items vertically at the top
      marginBottom: '10px', // Add bottom margin for spacing between lines
    },
    strongText: {
      fontWeight: 'bold',
      marginRight: '5px', // Add right margin between label and value
    },
  });
  const classes = useStyles();

  return (
    <Table>
      <TableHead>
        <TableRow>
          {columns.map((columnName: string) => (
            <TableCell key={columnName}><strong className={classes.columnName}>{columnName}</strong></TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {data.map((d: any) => (
          <React.Fragment key={d}>
            <TableRow onClick={() => handleRowClick(d)}>
              {columns.map((columnName: string) => (
                <TableCell key={columnName}>{d[columnName]}</TableCell>
              ))}
            </TableRow>
            {expandedRow === d && (
              <TableRow>
                <TableCell colSpan={columns.length} >
                  <Accordion className={classes.accordionContainer}>
                    {/* <AccordionSummary>
                      <Typography>Selected Columns</Typography>
                    </AccordionSummary> */}
                    <AccordionDetails className={classes.accordionContent}>
                      <Typography component={'div'}>
                        <ul>
                          {expandedColumns.map((columnName: string) => (
                            <li key={columnName}>
                              
                              {columnName === 'Video Download Url' ? (
                                <>
                                <strong>Recording: </strong>
                                  {d[columnName] ?(
                                    <Button variant="contained" color="secondary" onClick={() => window.open(d[columnName], '_blank')}>
                                      Download
                                    </Button>
                                  ) : (
                                    'No video available' // Display message if videoUrl is not set
                                  )
                                  }
                                </>
                              ) : (
                                
                                <span key={columnName} className={classes.listItem}>
                                  <strong className={classes.strongText}>{columnName}:</strong>
                                  <span>{d[columnName]}</span>
                                </span>
                                // Render other column data normally
                                // <span><strong>{columnName}:             </strong>
                                // {d[columnName]}</span>
                              )}
                            </li>
                          ))}
                          {d['isHost'] === 1 ? (
                          <Button variant="contained" color="secondary" onClick={()=>{sendMeetingDetails(d['Meeting Code'])}}>
                              Send Meeting Details to other users
                          </Button>) :(<p></p>)
}
                        </ul>
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                </TableCell>
              </TableRow>
            )}
          </React.Fragment>
        ))}
      </TableBody>
    </Table>
  );
};

export default Details;
