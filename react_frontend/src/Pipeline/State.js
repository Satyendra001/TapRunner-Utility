import * as React from 'react';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Slide from '@mui/material/Slide';
import { useState, useContext } from 'react';
import ListAltIcon from '@mui/icons-material/ListAlt';
import { STATE_FETCH_URL } from '../utility/URL';
import { APICall, SweetAlertPopUp } from '../utility/utils';
import moment from 'moment'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import PropTypes from 'prop-types';
import Typography from '@mui/material/Typography';
import Dropzone from 'react-dropzone';
import UploadIcon from '../assets/upload-cloud.svg'
import Tooltip from '@mui/material/Tooltip';
import FileOpenOutlinedIcon from '@mui/icons-material/FileOpenOutlined';
import RequireAuth from '../utility/RequireAuth';


const styles = {
  p1: {
    fontFamily: 'Jost',
    marginTop: '1rem',
    marginBottom: '0.5rem',
    color: '#646464'
  },

  uploadContainer: {
    border: '1px dashed #C4C4C4',
    borderRadius: '5px',
    display: 'flex',
    justifyContent: 'center',
    height: '6rem',
    backgroundColor: '#FFFFFF',
    padding: '1rem'
  },
}

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography component={'span'}>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

const State = ({ pipeline, change }) => {

  const [value, setValue] = React.useState(0);
  const [open, setOpen] = useState(false);
  const [state, setState] = useState({});
  const [file, setFile] = useState(null);
  const { user } = useContext(RequireAuth);


  const handleClickOpen = () => {
    setOpen(true);
    APICall({
      method: 'get',
      url: STATE_FETCH_URL,
      params: {
        instance_name: window.location.href.split("pipeline/")[1].split("/")[0],
        tap_name: window.location.href.split("pipeline/")[1].split("/")[1],
        user: user.username
      },
      // data: {"name": "catalog"},
      successCallBack: (data) => {
        console.log(data, "-----------------------------------------------------")
        setState(data)
        console.log("Fetch state")
      }
    });
  };

  const handleClose = () => {
    change(prevState => ({ ...prevState, sync: 'block' }));
    setOpen(false);
  };

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const submitState = () => {
    change(prevState => ({ ...prevState, sync: false }));
    let data = new FormData()
    if (value == 0) {
      data.append('is_upload', 'no');
      data.append('data', JSON.stringify(state));
    }
    else {
      data.append('is_upload', 'yes');
      data.append('data', file);
    }
    APICall({
      method: 'post',
      url: STATE_FETCH_URL,
      params: {
        instance_name: window.location.href.split("pipeline/")[1].split("/")[0],
        tap_name: window.location.href.split("pipeline/")[1].split("/")[1],
        user: user.username
      },
      headers: {
        'content-type': 'multipart/form-data',
      },
      data: data,
      successCallBack: (data) => {
        SweetAlertPopUp({
          title: "State has been created",
          icon: "success",
          buttons: [false, "Yes"],
          yesOnClick: () => { change(prevState => ({ ...prevState, sync: true })); setOpen(false); }
        });

        console.log("Created State")
      }
    });
  }

  return (
    <>
      <div>
        <Card sx={{ maxWidth: 350, boxShadow: 5, borderRadius: '15px' }}>
          <CardHeader
            titleTypographyProps={{ fontSize: 18, color: pipeline.state == false ? "" : "white" }}
            style={{ background: pipeline.state == false ? "#2c2929" : "linear-gradient(28deg, rgb(28, 28, 28), transparent)" }}
            action={
              <>
                <Tooltip title="Enter state value">
                  <IconButton aria-label="Enter state value" disabled={!pipeline.state} component="label" onClick={handleClickOpen}>
                    <ListAltIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Open state.json">
                  <IconButton aria-label="Open state" disabled={!pipeline.state} component="label" onClick={() => window.open(`/pipeline/${window.location.href.split("pipeline/")[1].split("/")[0]}/${window.location.href.split("pipeline/")[1].split("/")[1]}/state`, '_blank', 'noopener,noreferrer')}>
                    <FileOpenOutlinedIcon />
                  </IconButton>
                </Tooltip>
              </>
            }
            title="State"
          // subheader="September 14, 2016"
          />
        </Card>

        <Dialog
          open={open}
          TransitionComponent={Transition}
          keepMounted
          onClose={handleClose}
          aria-describedby="alert-dialog-slide-description"
          fullWidth
          maxWidth="md"
          PaperProps={{ sx: { height: 500 } }}
        >
          <DialogTitle style={{ background: 'linear-gradient(to bottom, #0A1F2A, #5BB4F3)', color: "white" }}>Create State file for sync</DialogTitle>
          <DialogContent>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={value} onChange={handleChange} aria-label="Create State file for sync" centered>
                <Tab label="Fill value in existing state" {...a11yProps(0)} />
                <Tab label="Upload State json" {...a11yProps(1)} />
              </Tabs>
            </Box>
            <TabPanel value={value} index={0}>
            </TabPanel>
            <TabPanel value={value} index={1}>
              <p style={styles.p1}>Upload files</p>
              <Dropzone onDrop={acceptedFiles => setFile(acceptedFiles[0])}>
                {({ getRootProps, getInputProps }) => (
                  <section>
                    <div {...getRootProps()}>
                      <label htmlFor="upload-photo" style={{ width: '100%' }}>
                        <div style={styles.uploadContainer}>
                          {file === null ?
                            <>
                              <img src={UploadIcon} width="24px" alt="upload icon" />
                              <p style={styles.p2} >Upload state json</p>
                            </> :
                            <p>{`Uploaded file ${file.name}`}</p>

                          }
                        </div>
                      </label><br />
                      <input {...getInputProps()} />
                    </div>
                  </section>
                )}
              </Dropzone>
            </TabPanel>
          </DialogContent>
          <DialogActions>
            <Button variant="contained"
              sx={{ background: "linear-gradient(rgb(10, 31, 42), rgb(91, 180, 243))", borderRadius: "150px 0 0 150px" }}
              onClick={() => {
                change(prevState => ({ ...prevState, is_state: false }));
                handleClose();
              }}
            >Skip</Button>
            <Button variant="contained"
              sx={{ background: "linear-gradient(rgb(10, 31, 42), rgb(91, 180, 243))", borderRadius: "0 150px 150px 0" }}
              onClick={() => {
                change(prevState => ({ ...prevState, is_state: true }));
                submitState();
              }}
            >Submit</Button>
          </DialogActions>
        </Dialog>
      </div>
    </>
  );
}

export default State
