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

  return (
    <Table>
      <TableHead>
        <TableRow>
          {columns.map((columnName: string) => (
            <TableCell key={columnName}>{columnName}</TableCell>
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
                <TableCell colSpan={columns.length}>
                  <Accordion>
                    {/* <AccordionSummary>
                      <Typography>Selected Columns</Typography>
                    </AccordionSummary> */}
                    <AccordionDetails>
                      <Typography component={'div'}>
                        <ul>
                          {expandedColumns.map((columnName: string) => (
                            <li key={columnName}>
                              <strong>{columnName}: </strong>
                              {d[columnName]}
                            </li>
                          ))}
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
