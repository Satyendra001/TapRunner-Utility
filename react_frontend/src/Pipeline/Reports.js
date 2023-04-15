import { useState, useEffect, useContext } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { APICall } from '../utility/utils';
import { SYNC_REPORT_URL } from '../utility/URL';
import * as React from 'react';
import { styled } from '@mui/material/styles';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import jsPDF from 'jspdf';
import ReactDOMServer from 'react-dom/server';
import IconButton from '@mui/material/IconButton';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import Collapse from '@mui/material/Collapse';
import { useOutletContext } from 'react-router-dom'
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import Tooltip from '@mui/material/Tooltip';
import RequireAuth from '../utility/RequireAuth';


const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    background: 'linear-gradient(to bottom, #434A50, grey)',
    color: theme.palette.common.white,
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  // hide last border
  '&:last-child td, &:last-child th': {
    border: 0,
  },
}));

const style = {
  ul: {
    "paddingLeft": "0px",
    "listStylePosition": "inside",
  }
}



const Reports = () => {
  const [report, setReport] = useState({ data: {}, headers: [], extra_state: {} });
  const [catalog_open, setCatalogOpen] = useState(false);
  const [extra_bookmark, setExtraBookmark] = useState(false);
  const [sync_open, setSyncOpen] = useState(false);
  const { setTitle } = useOutletContext();
  const { user } = useContext(RequireAuth);
  const [columns_selection, setColumnSelection] = useState({
    catalog: {
      "Stream": true,
      "Key Properties": true,
      "Replication Method": true,
      "Replication Keys": true,
      "Automatic Fields": true,
      "Selected Fields": true,
      "Unselected Fields": true
    },

    sync: {
      "Stream": true,
      "Replication Method": true,
      "# of total records": true,
      "# of unique records": true,
      "Duplicates Records": true,
      "Max of Replication Key": true,
      "Bookmark": true
    },
  });
  const [anchorEl, setAnchorEl] = useState({
    catalog: null,
    sync: null
  });
  const [rotateChevron, setRotateChevron] = useState({
    catalog: false,
    sync: false
  });


  useEffect(() => {
    setTitle(`Report For ${window.location.href.split("pipeline/")[1].split("/")[0]} (${window.location.href.split("pipeline/")[1].split("/")[1]})`);
    APICall({
      method: 'get',
      headers: {
        'Content-Type': 'application/json',
      },
      params: {
        instance_name: window.location.href.split("pipeline/")[1].split("/")[0],
        tap_name: window.location.href.split("pipeline/")[1].split("/")[1],
        user: user.username
      },
      url: SYNC_REPORT_URL,
      successCallBack: (data) => {
        console.log(data)
        setReport(data);
      }
    });
  }, []);

  const RowCatalog = ({ data, stream }) => {
    const [open, setOpen] = React.useState(false);
    return (
      <React.Fragment>
        <StyledTableRow key={stream}>
          <StyledTableCell style={{ display: columns_selection.catalog["Stream"] ? "" : "none" }}>{stream}</StyledTableCell>

          <StyledTableCell style={{ display: columns_selection.catalog["Key Properties"] ? "" : "none" }} align="left">
            {
              data.key_properties.length == 0 ? <h1 style={{ color: "grey" }}>None</h1> :
                <ul style={style.ul}>
                  {
                    data.key_properties.map((field, id) => {
                      return <li key={field}>{field}</li>
                    })
                  }

                </ul>
            }
          </StyledTableCell>

          <StyledTableCell style={{ display: columns_selection.catalog["Replication Method"] ? "" : "none" }} align="left">{data.replication_method}</StyledTableCell>

          <StyledTableCell style={{ display: columns_selection.catalog["Replication Keys"] ? "" : "none" }} align="left">
            {
              data.replication_keys.length == 0 ? <h4 style={{ color: "grey" }}>None</h4> :
                <ul style={style.ul}>
                  {
                    data.replication_keys.map((field, id) => {
                      return <li key={field}>{field}</li>
                    })

                  }
                </ul>
            }
          </StyledTableCell>

          <StyledTableCell style={{ display: columns_selection.catalog["Automatic Fields"] ? "" : "none" }} align="left">
            {
              data.automatic_fields.length == 0 ? <h4 style={{ color: "grey" }}>None</h4> :
                <ul style={style.ul}>
                  {
                    data.automatic_fields.map((field, id) => {
                      return <li key={field}>{field}</li>
                    })

                  }
                </ul>
            }
          </StyledTableCell>

          <StyledTableCell style={{ display: columns_selection.catalog["Selected Fields"] ? "" : "none" }} align="left">
            {
              data.selected_fields.length == 0 ? <h4 style={{ color: "grey" }}>None</h4> :
                <>
                  <IconButton
                    aria-label="expand row"
                    size="small"
                    onClick={() => setOpen(!open)}
                  >
                    {open ? <> Hide <KeyboardArrowUpIcon /> </> : <>Show  <KeyboardArrowDownIcon /></>}
                  </IconButton>
                  <Collapse in={open} timeout="auto" unmountOnExit>
                    <ul style={{ ...style.ul, maxHeight: 220, overflowY: 'scroll' }}>
                      {
                        data.selected_fields.map((field, id) => {
                          return <li key={field}>{field}</li>
                        })

                      }
                    </ul>
                  </Collapse>
                </>
            }
          </StyledTableCell>

          <StyledTableCell style={{ display: columns_selection.catalog["Unselected Fields"] ? "" : "none" }} align="left">
            {
              data.unselected_fields.length == 0 ? <h4 style={{ color: "grey" }}>None</h4> :
                <>
                  <IconButton
                    aria-label="expand row"
                    size="small"
                    onClick={() => setOpen(!open)}
                  >
                    {open ? <> Hide <KeyboardArrowUpIcon /> </> : <>Show  <KeyboardArrowDownIcon /></>}
                  </IconButton>
                  <Collapse in={open} timeout="auto" unmountOnExit>
                    <ul style={{ ...style.ul, maxHeight: 220, overflowY: 'scroll' }}>
                      {
                        data.unselected_fields.map((field, id) => {
                          return <li key={field}>{field}</li>
                        })

                      }
                    </ul>
                  </Collapse>
                </>
            }
          </StyledTableCell>

        </StyledTableRow>
      </React.Fragment>
    );
  }

  const RowSync = ({ data, stream }) => {
    const [open, setOpen] = React.useState(false);
    return (
      <React.Fragment>
        <StyledTableRow key={stream}>
          <StyledTableCell style={{ display: columns_selection.sync["Stream"] ? "" : "none" }} align="left">{stream}</StyledTableCell>

          <StyledTableCell style={{ display: columns_selection.sync["Replication Method"] ? "" : "none" }} align="left">{data.replication_method}</StyledTableCell>

          <StyledTableCell style={{ display: columns_selection.sync["# of total records"] ? "" : "none" }} align="left">{data.total_records}</StyledTableCell>

          <StyledTableCell style={{ display: columns_selection.sync["# of unique records"] ? "" : "none" }} align="left">{data.unique_records}</StyledTableCell>

          <StyledTableCell style={{ display: columns_selection.sync["Duplicates Records"] ? "" : "none" }} align="left">
            {data.duplicates_records.length == 0 ? <h5 style={{ color: "green" }}>No duplicates</h5> :
              <>
                <IconButton
                  aria-label="expand row"
                  size="small"
                  onClick={() => setOpen(!open)}
                >
                  {open ? <> Hide <KeyboardArrowUpIcon /> </> : <>Show  <KeyboardArrowDownIcon /></>}
                </IconButton>
                <Collapse in={open} timeout="auto" unmountOnExit>
                  <ul style={{ maxHeight: 220, overflowY: 'scroll' }}>
                    {
                      data.duplicates_records.map((record, id) => {
                        return <li key={id}>{record.replaceAll("||", " \n ")}</li>
                      })

                    }
                  </ul>
                </Collapse>
              </>
            }
          </StyledTableCell>

          <StyledTableCell style={{ display: columns_selection.sync["Max of Replication Key"] ? "" : "none" }} align="left">
            <pre id="json" >{JSON.stringify(data.max_bookmarks, undefined, 2)}</pre>
          </StyledTableCell>

          <StyledTableCell style={{ display: columns_selection.sync["Bookmark"] ? "" : "none" }} align="left">
            {!("bookmarks" in data) ? <h5 style={{ color: "grey" }}>None</h5> :
              <>
                <IconButton
                  aria-label="expand row"
                  size="small"
                  onClick={() => setOpen(!open)}
                >
                  {open ? <> Hide <KeyboardArrowUpIcon /> </> : <>Show  <KeyboardArrowDownIcon /></>}
                </IconButton>
                <Collapse in={open} timeout="auto" unmountOnExit>
                  <pre style={{ maxHeight: 220, overflowY: 'scroll' }} id="json">{JSON.stringify("bookmarks" in data ? data.bookmarks : {}, undefined, 2)}</pre>
                </Collapse>
              </>
            }
          </StyledTableCell>

        </StyledTableRow>
      </React.Fragment>
    );
  }

  return (
    <>
      <Box sx={{ mt: 1, ml: 1 }}>
        <Typography component="div">
          Catalog Report
          <IconButton
            color="inherit"
            aria-label="expand row"
            size="small"
            onClick={() => setCatalogOpen(!catalog_open)}
          >
            {catalog_open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
          <Tooltip title="Select Columns">
            <IconButton
              style={{ transform: rotateChevron.catalog ? "rotate(100deg)" : "rotate(0)", transition: "all 0.2s linear" }}
              onClick={(event) => {
                setAnchorEl(prevState => ({ ...prevState, catalog: event.currentTarget }));
                setRotateChevron(prevState => ({ ...prevState, catalog: !rotateChevron.catalog }));
              }}
              component="label" >
              <SettingsOutlinedIcon />
            </IconButton>
          </Tooltip>
          <Menu
            id="basic-menu"
            anchorEl={anchorEl.catalog}
            open={Boolean(anchorEl.catalog)}
            onClose={() => {
              setAnchorEl(prevState => ({ ...prevState, catalog: null }));
              setRotateChevron(prevState => ({ ...prevState, catalog: !rotateChevron.catalog }));
            }}
            MenuListProps={{
              'aria-labelledby': 'basic-button',
            }}
          >
            <FormGroup sx={{ ml: 1 }}>
              <FormControlLabel disabled control={<Checkbox defaultChecked />} label="Stream" />
              {
                Object.keys(columns_selection.catalog).slice(1).map(column => {
                  return <FormControlLabel
                    key={column}
                    control={
                      <Checkbox
                        name={column}
                        checked={columns_selection.catalog[column]}
                        onChange={(e) => setColumnSelection(prevState => ({ ...prevState, catalog: { ...prevState.catalog, [e.target.name]: e.target.checked } }))}
                      />}
                    label={column} />
                })
              }
            </FormGroup>

          </Menu>
          <hr />
        </Typography>
        <Collapse in={catalog_open} timeout="auto" unmountOnExit>
          <TableContainer component={Paper} sx={{ maxHeight: 440 }}>
            <Table stickyHeader sx={{ minWidth: 700 }} aria-label="customized table">
              <TableHead>
                <TableRow>
                  {
                    Object.keys(columns_selection.catalog).map(column => {
                      return <StyledTableCell style={{ display: columns_selection.catalog[column] ? "" : "none" }} key={column} align="left"><strong>{column}</strong></StyledTableCell>
                    })
                  }
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.keys(report.data).map((stream, id) => {
                  return <RowCatalog key={stream} data={report.data[stream]} stream={stream} />
                })}
              </TableBody>

            </Table>
          </TableContainer>
        </Collapse>
      </Box>

      <Box sx={{ mt: 1, ml: 1 }}>
        <Typography component="div">
          Sync Report
          <IconButton
            color="inherit"
            aria-label="expand row"
            size="small"
            onClick={() => setSyncOpen(!sync_open)}
          >
            {sync_open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
          <Tooltip title="Select Columns">
            <IconButton
              style={{ transform: rotateChevron.sync ? "rotate(100deg)" : "rotate(0)", transition: "all 0.2s linear" }}
              onClick={(event) => {
                setAnchorEl(prevState => ({ ...prevState, sync: event.currentTarget }));
                setRotateChevron(prevState => ({ ...prevState, sync: !rotateChevron.sync }));
              }}
              component="label" >
              <SettingsOutlinedIcon />
            </IconButton>
          </Tooltip>
          <Menu
            id="basic-menu"
            anchorEl={anchorEl.sync}
            open={Boolean(anchorEl.sync)}
            onClose={() => {
              setAnchorEl(prevState => ({ ...prevState, sync: null }));
              setRotateChevron(prevState => ({ ...prevState, sync: !rotateChevron.sync }))
            }}
            MenuListProps={{
              'aria-labelledby': 'basic-button',
            }}
          >
            <FormGroup sx={{ ml: 1 }}>
              <FormControlLabel disabled control={<Checkbox defaultChecked />} label="Stream" />
              {
                Object.keys(columns_selection.sync).slice(1).map(column => {

                  return <FormControlLabel
                    key={column}
                    control={
                      <Checkbox
                        name={column}
                        checked={columns_selection.sync[column]}
                        onChange={(e) => setColumnSelection(prevState => ({ ...prevState, sync: { ...prevState.sync, [e.target.name]: e.target.checked } }))}
                      />}
                    label={column} />
                })
              }
            </FormGroup>
          </Menu>
          <hr />
        </Typography>
        <Collapse in={sync_open} timeout="auto" unmountOnExit>
          <TableContainer component={Paper} sx={{ maxHeight: 440 }}>
            <Table stickyHeader sx={{ minWidth: 700 }} aria-label="customized table">
              <TableHead>
                <TableRow>
                  {
                    Object.keys(columns_selection.sync).map(column => {
                      return <StyledTableCell style={{ display: columns_selection.sync[column] ? "" : "none" }} key={column} align="left"><strong>{column}</strong></StyledTableCell>
                    })
                  }
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.keys(report.data).map((stream, id) => {
                  return <RowSync key={stream} data={report.data[stream]} stream={stream} />

                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Collapse>
      </Box>

      {
        Object.keys(report.extra_state).length === 0 ||
        <Box sx={{ mt: 1, ml: 1 }}>
          <Typography variant="h5" component="div">
            Extra Bookmark
            <IconButton
              color="inherit"
              aria-label="expand row"
              size="small"
              onClick={() => setExtraBookmark(!extra_bookmark)}
            >
              {extra_bookmark ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
            <hr />
          </Typography>
          <Collapse in={extra_bookmark} timeout="auto" unmountOnExit>
            <TableContainer component={Paper} sx={{ maxHeight: 440 }}>
              <Table stickyHeader sx={{ minWidth: 700 }} aria-label="customized table">
                <TableHead>
                  <TableRow>
                    <StyledTableCell></StyledTableCell>
                    <StyledTableCell></StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.keys(report.extra_state).map((key, id) => {
                    return (
                      <StyledTableRow key={key}>
                        <StyledTableCell scope="row">{key}</StyledTableCell>
                        <StyledTableCell align="left">
                          <pre id="json">
                            {JSON.stringify(report.extra_state[key])}
                          </pre>
                        </StyledTableCell>
                      </StyledTableRow>
                    )

                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Collapse>
        </Box>
      }
    </>
  )
}

export default Reports